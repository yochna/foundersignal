import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isVercel } from '@/lib/config';
import { fullSeedOpportunities as seedOpportunities } from '@/lib/seed/opportunities';
import { normalizeOpportunity } from '@/lib/schemas';
import { utcDayKey } from '@/lib/utils';

/**
 * Zero-dependency store used when Supabase is not configured.
 *
 * Writes JSON under .data/ locally and /tmp on Vercel. If neither is writable
 * it degrades to a process-local cache and reports `writable: false`, which the
 * UI surfaces as "changes will not persist" rather than failing the request.
 */

const COLLECTIONS = {
  users: 'users.json',
  payments: 'payments.json',
  opportunities: 'opportunities.json',
  rawSignals: 'raw-signals.json',
  savedOpportunities: 'saved-opportunities.json',
  quizResults: 'quiz-results.json',
  resumeProfiles: 'resume-profiles.json',
  ideaValidations: 'idea-validations.json',
  userActivity: 'user-activity.json',
  ingestionRuns: 'ingestion-runs.json',
  apiUsage: 'api-usage.json',
  chatMessages: 'chat-messages.json',
  aiCache: 'ai-cache.json',
  userProfiles: 'user-profiles.json',
  communityPosts: 'community-posts.json',
  communityComments: 'community-comments.json',
  communityVotes: 'community-votes.json',
  roadmaps: 'roadmaps.json',
  adminEmails: 'admin-emails.json',
  revokedAdminEmails: 'revoked-admin-emails.json',
};

const dataDir = isVercel
  ? path.join('/tmp', 'foundersignal-data')
  : path.join(process.cwd(), '.data');

// Process-local mirror. Also the sole storage when the disk is unavailable.
const memory = new Map();
let writable = null;
let seeded = false;

function ensureDir() {
  if (writable === false) return false;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    writable = true;
    return true;
  } catch (error) {
    if (writable !== false) {
      console.warn(`[db:file] ${dataDir} is not writable (${error.code}); using in-memory store.`);
    }
    writable = false;
    return false;
  }
}

function filePath(collection) {
  return path.join(dataDir, COLLECTIONS[collection] || `${collection}.json`);
}

function read(collection) {
  if (memory.has(collection)) return memory.get(collection);

  if (ensureDir()) {
    try {
      const raw = fs.readFileSync(filePath(collection), 'utf8');
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : [];
      memory.set(collection, rows);
      return rows;
    } catch (error) {
      // ENOENT on first run is expected. A corrupt file should not take the app
      // down either, so we start that collection empty and log it once.
      if (error.code !== 'ENOENT') {
        console.warn(`[db:file] could not read ${collection}: ${error.message}. Starting empty.`);
      }
    }
  }

  memory.set(collection, []);
  return memory.get(collection);
}

function write(collection, rows) {
  memory.set(collection, rows);
  if (!ensureDir()) return false;
  try {
    fs.writeFileSync(filePath(collection), JSON.stringify(rows, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.warn(`[db:file] could not persist ${collection}: ${error.message}`);
    writable = false;
    return false;
  }
}

/** Load bundled briefs the first time the opportunities collection is empty. */
function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const rows = read('opportunities');
  if (rows.length > 0) return;

  const normalized = seedOpportunities
    .map((opp) => normalizeOpportunity({ ...opp, source: 'seed' }))
    .filter(Boolean)
    .map((opp) => ({ ...opp, createdAt: new Date().toISOString() }));

  write('opportunities', normalized);
  console.log(`[db:file] seeded ${normalized.length} opportunities.`);
}

function nowIso() {
  return new Date().toISOString();
}

export function createFileDriver() {
  return {
    name: writable === false ? 'memory' : 'file',

    async describe() {
      ensureSeeded();
      return {
        driver: writable === false ? 'memory' : 'file',
        writable: writable !== false,
        location: writable === false ? 'process memory' : dataDir,
        persistent: writable !== false && !isVercel,
      };
    },

    // --- opportunities ------------------------------------------------------
    async listOpportunities() {
      ensureSeeded();
      return read('opportunities');
    },

    async getOpportunity(id) {
      ensureSeeded();
      return read('opportunities').find((o) => o.id === id) || null;
    },

    async upsertOpportunities(opportunities) {
      ensureSeeded();
      const rows = read('opportunities');
      const byId = new Map(rows.map((r) => [r.id, r]));
      for (const opp of opportunities) {
        const existing = byId.get(opp.id);
        byId.set(opp.id, { ...existing, ...opp, createdAt: existing?.createdAt || nowIso() });
      }
      write('opportunities', Array.from(byId.values()));
      // Number written, matching the supabase driver's contract.
      return opportunities.length;
    },

    // --- users --------------------------------------------------------------
    async upsertUser(user) {
      const rows = read('users');
      const index = rows.findIndex((u) => u.id === user.id || (user.email && u.email === user.email));
      const record = {
        id: user.id,
        email: user.email || null,
        name: user.name || null,
        image: user.image || null,
        createdAt: index >= 0 ? rows[index].createdAt : nowIso(),
        lastSeenAt: nowIso(),
      };
      if (index >= 0) rows[index] = record;
      else rows.push(record);
      write('users', rows);
      return record;
    },

    async countUsers() {
      return read('users').length;
    },

    // --- billing --------------------------------------------------------------
    async getUserPlan(userId) {
      const user = read('users').find((u) => u.id === userId);
      if (!user) return { plan: 'free', expiresAt: null };
      if (user.plan && user.plan !== 'free' && user.planExpiresAt && Date.parse(user.planExpiresAt) < Date.now()) {
        return { plan: 'free', expiresAt: user.planExpiresAt };
      }
      return { plan: user.plan || 'free', expiresAt: user.planExpiresAt || null };
    },

    async setUserPlan(userId, { plan, expiresAt }) {
      const rows = read('users');
      const index = rows.findIndex((u) => u.id === userId);
      if (index >= 0) {
        rows[index] = { ...rows[index], plan, planExpiresAt: expiresAt };
        write('users', rows);
      }
      return { plan, expiresAt };
    },

    async createPaymentOrder(order) {
      const rows = read('payments');
      rows.push({
        id: order.id,
        userId: order.userId,
        plan: order.plan,
        amountPaise: order.amountPaise,
        currency: order.currency,
        status: 'created',
        razorpayPaymentId: null,
        createdAt: nowIso(),
        capturedAt: null,
      });
      write('payments', rows);
      return order;
    },

    async markPaymentCaptured(orderId, razorpayPaymentId) {
      const rows = read('payments');
      const index = rows.findIndex((p) => p.id === orderId);
      if (index >= 0) {
        rows[index] = { ...rows[index], status: 'captured', razorpayPaymentId, capturedAt: nowIso() };
        write('payments', rows);
      }
    },

    async getPaymentOrder(orderId) {
      return read('payments').find((p) => p.id === orderId) || null;
    },

    async listUsersByIds(ids) {
      if (!ids.length) return [];
      const wanted = new Set(ids);
      return read('users').filter((u) => wanted.has(u.id));
    },

    // --- saved --------------------------------------------------------------
    async listSaved(userId) {
      return read('savedOpportunities')
        .filter((r) => r.userId === userId)
        .map((r) => r.opportunityId);
    },

    async isSaved(userId, opportunityId) {
      return read('savedOpportunities').some(
        (r) => r.userId === userId && r.opportunityId === opportunityId
      );
    },

    async addSaved(userId, opportunityId) {
      const rows = read('savedOpportunities');
      if (!rows.some((r) => r.userId === userId && r.opportunityId === opportunityId)) {
        rows.push({ userId, opportunityId, createdAt: nowIso() });
        write('savedOpportunities', rows);
      }
      return true;
    },

    async removeSaved(userId, opportunityId) {
      const rows = read('savedOpportunities');
      const next = rows.filter((r) => !(r.userId === userId && r.opportunityId === opportunityId));
      write('savedOpportunities', next);
      return true;
    },

    async countSavedTotal() {
      return read('savedOpportunities').length;
    },

    // --- feature records ----------------------------------------------------
    async saveQuizResult(userId, answers, results) {
      const rows = read('quizResults');
      const record = { id: randomUUID(), userId, answers, results, createdAt: nowIso() };
      rows.push(record);
      write('quizResults', rows);
      return record;
    },

    async latestQuizResult(userId) {
      return (
        read('quizResults')
          .filter((r) => r.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null
      );
    },

    async saveResumeProfile(userId, fileName, parsed, demandScore) {
      const rows = read('resumeProfiles');
      const record = { id: randomUUID(), userId, fileName, parsed, demandScore, createdAt: nowIso() };
      rows.push(record);
      write('resumeProfiles', rows);
      return record;
    },

    async latestResumeProfile(userId) {
      return (
        read('resumeProfiles')
          .filter((r) => r.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null
      );
    },

    async saveValidation(userId, ideaText, result, validationScore) {
      const rows = read('ideaValidations');
      const record = {
        id: randomUUID(),
        userId,
        ideaText,
        result,
        validationScore,
        createdAt: nowIso(),
      };
      rows.push(record);
      write('ideaValidations', rows);
      return record;
    },

    async listValidations(userId, limit = 10) {
      return read('ideaValidations')
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    async countValidationsTotal() {
      return read('ideaValidations').length;
    },

    async listValidationsAdmin(limit = 100) {
      return read('ideaValidations')
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    // --- activity log ---------------------------------------------------------
    // Capped at ACTIVITY_CAP rows: this store is memory/disk-backed with no
    // rotation job, so an unbounded log would grow the JSON file forever on a
    // long-lived local or single-region deployment.
    async logActivity({ userId = null, sessionId = null, event, path: eventPath = null, meta = {} }) {
      const ACTIVITY_CAP = 2000;
      const rows = read('userActivity');
      const record = {
        id: randomUUID(),
        userId,
        sessionId,
        event,
        path: eventPath,
        meta: meta || {},
        createdAt: nowIso(),
      };
      rows.push(record);
      write('userActivity', rows.length > ACTIVITY_CAP ? rows.slice(-ACTIVITY_CAP) : rows);
      return record;
    },

    async listRecentActivity(limit = 100) {
      return read('userActivity')
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    async activityStats(days = 7) {
      const sinceMs = Date.now() - days * 86400000;
      const list = read('userActivity').filter((r) => new Date(r.createdAt).getTime() >= sinceMs);
      const uniqueUsers = new Set(list.map((r) => r.userId || r.sessionId).filter(Boolean)).size;
      const byPath = new Map();
      for (const row of list) {
        const key = row.path || '(unknown)';
        byPath.set(key, (byPath.get(key) || 0) + 1);
      }
      const topPaths = [...byPath.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([path, count]) => ({ path, count }));
      return { total: list.length, uniqueUsers, topPaths };
    },

    // --- chat ---------------------------------------------------------------
    async appendChat(userId, role, content) {
      const rows = read('chatMessages');
      const record = { id: randomUUID(), userId, role, content, createdAt: nowIso() };
      rows.push(record);
      write('chatMessages', rows);
      return record;
    },

    async listChat(userId, limit = 40) {
      return read('chatMessages')
        .filter((r) => r.userId === userId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-limit);
    },

    async clearChat(userId) {
      write(
        'chatMessages',
        read('chatMessages').filter((r) => r.userId !== userId)
      );
      return true;
    },

    // --- signals ------------------------------------------------------------
    async replaceRawSignals(signals) {
      const rows = signals.map((s) => ({ id: randomUUID(), ...s, ingestedAt: nowIso() }));
      write('rawSignals', rows);
      return rows.length;
    },

    async listRawSignals(limit = 200) {
      return read('rawSignals').slice(0, limit);
    },

    // --- ingestion runs -----------------------------------------------------
    async startRun() {
      const rows = read('ingestionRuns');
      const record = {
        id: randomUUID(),
        status: 'running',
        signalsCount: 0,
        opportunitiesCount: 0,
        sources: [],
        error: null,
        startedAt: nowIso(),
        finishedAt: null,
      };
      rows.push(record);
      write('ingestionRuns', rows);
      return record;
    },

    async finishRun(runId, patch) {
      const rows = read('ingestionRuns');
      const index = rows.findIndex((r) => r.id === runId);
      if (index === -1) return null;
      rows[index] = { ...rows[index], ...patch, finishedAt: patch.finishedAt || nowIso() };
      write('ingestionRuns', rows);
      return rows[index];
    },

    async listRuns(limit = 10) {
      return read('ingestionRuns')
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, limit);
    },

    // --- usage --------------------------------------------------------------
    async logUsage(entry) {
      const rows = read('apiUsage');
      const record = {
        id: randomUUID(),
        userId: entry.userId || null,
        feature: entry.feature,
        provider: entry.provider,
        outcome: entry.outcome,
        tokensUsed: entry.tokensUsed || 0,
        costEstimate: entry.costEstimate || 0,
        latencyMs: entry.latencyMs || 0,
        dayKey: utcDayKey(),
        createdAt: nowIso(),
      };
      rows.push(record);
      // Cap the local log so a long-running dev session cannot grow unbounded.
      write('apiUsage', rows.slice(-5000));
      return record;
    },

    async countUsageToday(userId, feature) {
      const day = utcDayKey();
      return read('apiUsage').filter(
        (r) =>
          r.dayKey === day &&
          r.feature === feature &&
          r.userId === userId &&
          // Only billed model calls count against a quota.
          (r.outcome === 'live' || r.outcome === 'cached')
      ).length;
    },

    async sumCostToday() {
      const day = utcDayKey();
      return read('apiUsage')
        .filter((r) => r.dayKey === day)
        .reduce((total, r) => total + (Number(r.costEstimate) || 0), 0);
    },

    async usageStats(days = 7) {
      const rows = read('apiUsage');
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
      return rows.filter((r) => r.createdAt >= cutoff);
    },

    // --- profiles -----------------------------------------------------------
    async getProfile(userId) {
      return read('userProfiles').find((r) => r.userId === userId) || null;
    },

    async upsertProfile(userId, patch) {
      const rows = read('userProfiles');
      const index = rows.findIndex((r) => r.userId === userId);
      const existing = index >= 0 ? rows[index] : null;
      const record = {
        ...(existing || {}),
        ...patch,
        userId,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
      };
      if (index >= 0) rows[index] = record;
      else rows.push(record);
      write('userProfiles', rows);
      return record;
    },

    // --- community ----------------------------------------------------------
    async createPost(post) {
      const rows = read('communityPosts');
      const record = {
        id: randomUUID(),
        userId: post.userId,
        title: post.title,
        body: post.body || '',
        topic: post.topic || 'general',
        tags: post.tags || [],
        linkUrl: post.linkUrl || '',
        opportunityId: post.opportunityId || null,
        pinned: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      rows.push(record);
      write('communityPosts', rows);
      return record;
    },

    async listPosts({ topic = 'all', authorId = null, limit = 50 } = {}) {
      return read('communityPosts')
        .filter((r) => (topic === 'all' || r.topic === topic) && (!authorId || r.userId === authorId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    async getPost(postId) {
      return read('communityPosts').find((r) => r.id === postId) || null;
    },

    async updatePost(postId, patch) {
      const rows = read('communityPosts');
      const index = rows.findIndex((r) => r.id === postId);
      if (index === -1) return null;
      rows[index] = { ...rows[index], ...patch, updatedAt: nowIso() };
      write('communityPosts', rows);
      return rows[index];
    },

    async deletePost(postId) {
      write('communityPosts', read('communityPosts').filter((r) => r.id !== postId));
      const removedComments = read('communityComments').filter((r) => r.postId === postId).map((r) => r.id);
      write('communityComments', read('communityComments').filter((r) => r.postId !== postId));
      write(
        'communityVotes',
        read('communityVotes').filter(
          (v) => !(v.targetType === 'post' && v.targetId === postId) &&
            !(v.targetType === 'comment' && removedComments.includes(v.targetId))
        )
      );
      return true;
    },

    async createComment(comment) {
      const rows = read('communityComments');
      const record = {
        id: randomUUID(),
        postId: comment.postId,
        parentId: comment.parentId || null,
        userId: comment.userId,
        body: comment.body,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      rows.push(record);
      write('communityComments', rows);
      return record;
    },

    async listComments(postId) {
      return read('communityComments')
        .filter((r) => r.postId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async getComment(commentId) {
      return read('communityComments').find((r) => r.id === commentId) || null;
    },

    async deleteComment(commentId) {
      // Replies are orphaned by deleting their parent, so drop them too.
      const all = read('communityComments');
      const doomed = new Set([commentId]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const row of all) {
          if (row.parentId && doomed.has(row.parentId) && !doomed.has(row.id)) {
            doomed.add(row.id);
            grew = true;
          }
        }
      }
      write('communityComments', all.filter((r) => !doomed.has(r.id)));
      write(
        'communityVotes',
        read('communityVotes').filter((v) => !(v.targetType === 'comment' && doomed.has(v.targetId)))
      );
      return true;
    },

    async countCommentsByPost(postIds) {
      const counts = {};
      for (const row of read('communityComments')) {
        if (postIds.includes(row.postId)) counts[row.postId] = (counts[row.postId] || 0) + 1;
      }
      return counts;
    },

    async setVote(userId, targetType, targetId, value) {
      const rows = read('communityVotes').filter(
        (v) => !(v.userId === userId && v.targetType === targetType && v.targetId === targetId)
      );
      if (value === 1 || value === -1) {
        rows.push({ userId, targetType, targetId, value, createdAt: nowIso() });
      }
      write('communityVotes', rows);
      return true;
    },

    async listVotes(targetType, targetIds) {
      return read('communityVotes').filter(
        (v) => v.targetType === targetType && targetIds.includes(v.targetId)
      );
    },

    async countPostsByUser(userId) {
      return read('communityPosts').filter((r) => r.userId === userId).length;
    },

    async countCommentsByUser(userId) {
      return read('communityComments').filter((r) => r.userId === userId).length;
    },

    // --- roadmaps -----------------------------------------------------------
    async saveRoadmap(entry) {
      const rows = read('roadmaps');
      const record = {
        id: randomUUID(),
        userId: entry.userId || null,
        inputKind: entry.inputKind || 'idea',
        inputText: entry.inputText,
        horizon: entry.horizon || '90 days',
        title: entry.title || '',
        result: entry.result || {},
        createdAt: nowIso(),
      };
      rows.push(record);
      write('roadmaps', rows.slice(-500));
      return record;
    },

    async listRoadmaps(userId, limit = 10) {
      return read('roadmaps')
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },

    async getRoadmap(id) {
      return read('roadmaps').find((r) => r.id === id) || null;
    },

    // --- AI cache -----------------------------------------------------------
    async getCached(key) {
      const row = read('aiCache').find((r) => r.key === key);
      if (!row) return null;
      if (new Date(row.expiresAt).getTime() < Date.now()) return null;
      return row.value;
    },

    async setCached(key, value, ttlMs) {
      const rows = read('aiCache').filter(
        (r) => r.key !== key && new Date(r.expiresAt).getTime() > Date.now()
      );
      rows.push({ key, value, expiresAt: new Date(Date.now() + ttlMs).toISOString() });
      write('aiCache', rows.slice(-500));
      return true;
    },

    // --- Admin emails --------------------------------------------------------
    async getAdminEmails() {
      return read('adminEmails');
    },

    async addAdminEmail(email, addedBy = 'system') {
      const normalised = email.trim().toLowerCase();
      const rows = read('adminEmails');
      const existing = rows.find((r) => r.email === normalised);
      if (existing) return existing;

      const record = {
        id: randomUUID(),
        email: normalised,
        addedBy,
        createdAt: new Date().toISOString(),
      };
      rows.push(record);
      write('adminEmails', rows);
      return record;
    },

    async removeAdminEmail(email) {
      const normalised = email.trim().toLowerCase();
      const rows = read('adminEmails').filter((r) => r.email !== normalised);
      write('adminEmails', rows);
      // Also add to revoked list so env admins can be revoked from UI
      const revoked = read('revokedAdminEmails');
      if (!revoked.includes(normalised)) {
        revoked.push(normalised);
        write('revokedAdminEmails', revoked);
      }
      return true;
    },

    async getRevokedAdminEmails() {
      return read('revokedAdminEmails');
    },

    async unrevokeAdminEmail(email) {
      const normalised = email.trim().toLowerCase();
      const revoked = read('revokedAdminEmails').filter((e) => e !== normalised);
      write('revokedAdminEmails', revoked);
      return true;
    },
  };
}

export default createFileDriver;
