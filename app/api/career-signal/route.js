import { withApi, readFormData, readJson, parseWith } from '@/lib/api';
import { AppError, ErrorCode, badRequest } from '@/lib/errors';
import { careerSignalRequest } from '@/lib/schemas';
import { runAi, getQuotaState } from '@/lib/ai/gateway';
import { loadOpportunities } from '@/lib/opportunities';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';
import { MAX_UPLOAD_BYTES, hasGemini } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'text',
  'text/markdown': 'text',
  // Word documents are accepted so the upload does not hard-fail, but their
  // binary XML is not readable by the model, so we ask for a paste instead.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'unsupported-binary',
  'application/msword': 'unsupported-binary',
};

export const GET = withApi(async () => {
  const user = await getCurrentUser();
  return {
    quota: await getQuotaState('career-signal', user?.id || null),
    accepts: { pdf: true, text: true, paste: true, maxBytes: MAX_UPLOAD_BYTES },
    // Without a model key we cannot read a PDF at all, so the UI should lead
    // with the paste box rather than the file picker.
    pdfReadable: hasGemini,
  };
});

/**
 * POST /api/career-signal
 *
 * Accepts either multipart form data with a `file`, or JSON with `resumeText`.
 * PDFs are handed to Gemini as inlineData (it reads PDFs natively), so no PDF
 * parsing dependency is needed. When the model is unavailable, a PDF cannot be
 * read locally, and the response explains that pasting text is the way forward.
 */
export const POST = withApi(async (request) => {
  const contentType = request.headers.get('content-type') || '';

  let resumeText = '';
  let fileName = 'pasted-resume.txt';
  let fileData = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await readFormData(request);
    const file = form.get('file');
    const pastedText = form.get('resumeText');

    if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function') {
      if (file.size === 0) throw badRequest('The uploaded file is empty');
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new AppError(
          ErrorCode.PAYLOAD_TOO_LARGE,
          `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB, over the 4 MB limit`
        );
      }

      const kind = ACCEPTED_TYPES[file.type] || (file.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : null);

      if (kind === 'unsupported-binary') {
        throw badRequest('Word documents cannot be read directly', {
          hint: 'Export the resume as PDF, or paste the text into the box instead.',
        });
      }
      if (!kind) {
        throw badRequest(`Unsupported file type "${file.type || 'unknown'}"`, {
          hint: 'Upload a PDF or a plain text file, or paste the text instead.',
        });
      }

      fileName = file.name || fileName;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (kind === 'pdf') {
        if (!hasGemini) {
          throw new AppError(ErrorCode.AI_UNAVAILABLE, 'PDF reading requires the AI model', {
            hint: 'No GEMINI_API_KEY is configured, and PDFs cannot be parsed without it. Paste your resume text instead to get heuristic analysis.',
          });
        }
        fileData = { base64: buffer.toString('base64'), mimeType: 'application/pdf' };
        // Give the heuristic tier something to work with if the model then fails.
        resumeText = buffer
          .toString('latin1')
          .replace(/[^\x20-\x7E\n]+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .slice(0, 8000);
      } else {
        resumeText = buffer.toString('utf8');
      }
    } else if (typeof pastedText === 'string' && pastedText.trim()) {
      resumeText = pastedText;
    } else {
      throw badRequest('No file or resume text was supplied');
    }
  } else {
    const body = await readJson(request);
    const parsed = parseWith(careerSignalRequest, body);
    resumeText = parsed.resumeText;
    fileName = parsed.fileName || fileName;
  }

  // Pasted or text-file input must be substantial enough to analyse. PDFs skip
  // this check because their extracted text is only a heuristic backstop.
  if (!fileData && resumeText.trim().length < 40) {
    throw badRequest('That is too short to analyse', {
      hint: 'Paste at least a few lines covering your role, skills and experience.',
    });
  }

  const user = await getCurrentUser();
  const { opportunities } = await loadOpportunities();

  const { data, meta } = await runAi({
    feature: 'career-signal',
    userId: user?.id || null,
    input: { resumeText, fileName, fileData },
    corpus: opportunities,
  });

  if (user) {
    try {
      // Only the extracted structure is stored, never the uploaded file.
      await repo.saveResumeProfile(user.id, fileName, data, data.demandScore);
    } catch (error) {
      console.error('[career-signal] could not persist resume profile:', error.message);
    }
  }

  const matched = (data.matchedOpportunityIds || [])
    .map((id) => opportunities.find((o) => o.id === id))
    .filter(Boolean)
    .slice(0, 3)
    .map((o) => ({ id: o.id, title: o.title, score: o.score, vertical: o.vertical }));

  return { result: data, matched, fileName, meta };
});
