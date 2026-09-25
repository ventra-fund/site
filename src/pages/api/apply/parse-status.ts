import type { APIRoute } from 'astro';
import { LLAMA_CLOUD_API_KEY } from 'astro:env/server';
import { EXTRACT_JOB_ID, MAX_UPLOAD_FILES, type ParseStatusResponse } from '@/lib/upload-config';
import { json, methodNotAllowed, requireSecrets } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { createDocClient, readExtractions } from '@/lib/server/doc-extract/llamacloud';
import { buildSuggestions, monthsOf } from '@/lib/server/doc-extract/autofill';
import type { StatementExtraction } from '@/lib/server/doc-extract/schema';

// GET /api/apply/parse-status?jobs=<id>,<id>… — where the browser's statements are in the
// reader, plus the form values suggested by every statement read so far. The job ids are the
// ones /api/apply/upload handed out (unguessable provider ids; nothing is stored on our side),
// so one the provider doesn't know is simply reported `failed`. Every job in the list is asked
// about on each call, not only the pending ones, so the suggestions always aggregate the whole
// set: an average of monthly deposits over three statements has to see all three.
export const prerender = false;

const TAG = 'apply-parse-status';

export const GET: APIRoute = async ({ url, request }) => {
  // Before anything else: every call fans out to the provider, which has its own rate limit.
  const limited = await enforceRateLimit(TAG, request, 'STATUS_RATE_LIMIT');
  if (limited) return limited;

  const jobs = [...new Set((url.searchParams.get('jobs') ?? '').split(',').map((s) => s.trim()).filter(Boolean))];
  if (!jobs.length || jobs.length > MAX_UPLOAD_FILES || !jobs.every((j) => EXTRACT_JOB_ID.test(j))) return json(400, { error: 'invalid_jobs' });

  const env = requireSecrets(TAG, { LLAMA_CLOUD_API_KEY });
  if ('response' in env) return env.response;

  const extractions: StatementExtraction[] = [];
  const documents: ParseStatusResponse['documents'] = [];
  for (const { jobId, result } of await readExtractions(TAG, createDocClient(env.secrets.LLAMA_CLOUD_API_KEY), jobs)) {
    switch (result.status) {
      case 'pending': documents.push({ jobId, status: 'reading' }); break;
      case 'unreadable': documents.push({ jobId, status: 'unreadable' }); break;
      case 'error':
        console.warn(`[${TAG}] extract job ${jobId} failed:`, result.message.slice(0, 200));
        documents.push({ jobId, status: 'failed' });
        break;
      case 'done':
        extractions.push(result.extraction);
        documents.push({ jobId, status: 'done', monthsCovered: monthsOf(result.extraction) });
        break;
    }
  }

  const body: ParseStatusResponse = { documents, suggestions: buildSuggestions(extractions) };
  return json(200, { ...body });
};

export const ALL: APIRoute = methodNotAllowed;
