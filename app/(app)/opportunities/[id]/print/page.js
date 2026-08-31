import { loadOpportunities } from '@/lib/opportunities';
import { notFound } from 'next/navigation';
import { scoreBand } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { opportunities } = await loadOpportunities();
  const opp = opportunities.find((o) => o.id === params.id);
  if (!opp) return { title: 'Print — FounderSignal' };
  return {
    title: `Print: ${opp.title} — FounderSignal`,
    description: `Printable opportunity brief for ${opp.title}`,
  };
}

export default async function PrintPage({ params }) {
  const id = decodeURIComponent(params.id);
  const { opportunities } = await loadOpportunities();
  const opp = opportunities.find((o) => o.id === id);

  if (!opp) notFound();

    const band = scoreBand(opp.score);
  const tam = opp.tamAnalysis || {};
  const verdict = opp.verdictMatrix || {};

  return (
    <html lang="en">
      <head>
        <title>Print: {opp.title} — FounderSignal</title>
        <meta name="theme-color" content="#000000" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              body { background: #fff; color: #000; font-size: 10pt; }
              .no-print { display: none !important; }
              .card { page-break-inside: avoid; break-inside: avoid; }
            }
            @media screen {
              body { background: #0f172a; color: #e2e8f0; font-size: 13px; padding: 2rem; }
              .container { max-width: 900px; margin: 0 auto; }
              .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
              .score-badge { background: ${band.hex}20; color: ${band.hex}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
              h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
              h2 { font-size: 1.1rem; margin: 1rem 0 0.5rem; border-bottom: 1px solid #334155; padding-bottom: 0.25rem; }
              h3 { font-size: 0.9rem; margin: 0.75rem 0 0.25rem; }
              p { margin: 0.25rem 0; line-height: 1.5; }
              table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
              th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #334155; font-size: 0.8rem; }
              th { font-weight: 700; color: #cbd5e1; }
              .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0; }
              .metric-box { border: 1px solid #475569; border-radius: 6px; padding: 10px; text-align: center; }
              .metric-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
              .metric-value { font-size: 1rem; font-weight: 700; margin-top: 2px; }
              ul { margin: 0.25rem 0; padding-left: 1.2rem; }
              li { margin: 0.15rem 0; }
              .badge { display: inline-block; background: #334159; color: #cbd5e1; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; margin: 0 2px; }
              .action-buttons { margin: 1rem 0; padding: 0; }
              .action-btn { display: inline-block; background: #3b82f6; color: #fff; padding: 8px 16px; margin: 0 5px; border-radius: 6px; text-decoration: none; font-weight: 600; }
              .action-btn.print { background: #22c55e; }
              .tags { margin-bottom: 0.5rem; }
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="action-buttons no-print" style={{ marginBottom: '1rem' }}>
            <button className="action-btn print" onClick={() => window.print()}>
              🖨️ Print to PDF
            </button>
            <button className="action-btn" onClick={() => window.close()}>
              ✕ Close
            </button>
          </div>

          <div className="card">
            <div className="tags">
              <span className="score-badge">Signal Score: {opp.score}/100</span>
              <span className="badge">{opp.vertical}</span>
              <span className="badge">{opp.industry}</span>
              <span className="badge">{opp.momentum} momentum</span>
            </div>
            <h1>{opp.title}</h1>
            <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>{opp.problem}</p>
          </div>

          <div className="card">
            <h2>Strategic Conviction Verdict</h2>
            <div className="score-grid">
              <div className="metric-box">
                <div className="metric-label">Conviction</div>
                <div className="metric-value">{verdict.convictionLevel || 'High'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Execution</div>
                <div className="metric-value">{verdict.executionDifficulty || 'N/A'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Time to Revenue</div>
                <div className="metric-value">{verdict.timeToRevenueMonths || 'N/A'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Capital Need</div>
                <div className="metric-value">{verdict.capitalIntensity || 'N/A'}</div>
              </div>
            </div>
            <p style={{ marginTop: '0.5rem' }}>{verdict.overallRecommendation}</p>
          </div>

          <div className="card">
            <h2>Market Sizing (TAM / SAM / SOM)</h2>
            <div className="score-grid">
              <div className="metric-box">
                <div className="metric-label">India TAM</div>
                <div className="metric-value">{tam.tamIndia || 'N/A'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Global TAM</div>
                <div className="metric-value">{tam.tamGlobal || 'N/A'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">SAM</div>
                <div className="metric-value">{tam.sam || 'N/A'}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">SOM</div>
                <div className="metric-value">{tam.som || 'N/A'}</div>
              </div>
            </div>
            {tam.cagr ? <p><strong>CAGR:</strong> {tam.cagr}</p> : null}
            {tam.metricsBreakdown ? <p>{tam.metricsBreakdown}</p> : null}
          </div>
        </div>
      </body>
    </html>
  );
}
