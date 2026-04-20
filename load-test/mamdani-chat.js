/**
 * k6 load test — /mamdani/chat
 *
 * Simulates realistic question distribution across 4 topic buckets
 * (housing, transit, crime/safety, personal) with human-paced think time.
 *
 * Stages:
 *   0–60s   ramp from 1 → 10 VUs   (warm-up)
 *   60–120s ramp from 10 → 50 VUs  (target load)
 *   120–270s hold 50 VUs           (sustained pressure — 2.5 min)
 *   270–300s ramp down to 0        (cool-down)
 *
 * Thresholds (failure criteria):
 *   p95 response time < 30 s  (SSE streams can be slow)
 *   error rate < 5%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate    = new Rate('mamdani_errors');
const ttfbTrend    = new Trend('mamdani_ttfb_ms', true);   // time to first byte
const totalLatency = new Trend('mamdani_total_ms', true);   // full response time

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://astralink-v2-production.up.railway.app';

export const options = {
  stages: [
    { duration: '60s',  target: 10 },  // ramp up to 10 VUs
    { duration: '60s',  target: 50 },  // ramp up to 50 VUs
    { duration: '150s', target: 50 },  // hold at 50 VUs (2.5 min)
    { duration: '30s',  target: 0  },  // ramp down
  ],
  thresholds: {
    mamdani_errors:    ['rate<0.05'],        // < 5% error rate
    mamdani_total_ms:  ['p(95)<30000'],      // p95 < 30s (SSE stream)
    mamdani_ttfb_ms:   ['p(95)<8000'],       // p95 TTFB < 8s
  },
};

// ── Realistic question bank ───────────────────────────────────────────────────
const QUESTIONS = [
  // Housing (most common)
  'What is your housing policy?',
  'How do you plan to lower rent in New York City?',
  'What will you do about the housing crisis in NYC?',
  'Can you explain your stance on rent control?',
  'How will you help renters who are being pushed out?',
  'What do you think about real estate developers in NYC?',
  'How do small landlords fit into your housing plan?',
  'What will you do about vacant luxury apartments?',
  // Transit
  'Tell me about fare-free buses',
  'What are your plans for the subway?',
  'How will you improve public transit in NYC?',
  'What do you think about congestion pricing?',
  'Will you expand the fare-free bus pilot?',
  'How do you plan to reduce subway delays?',
  // Safety & crime
  'What is your approach to public safety?',
  'How do you feel about the NYPD budget?',
  'What will you do about crime in NYC?',
  'How does your policing plan actually work?',
  'What is the Crisis Management System?',
  'Do you support defunding the police?',
  // Personal / background
  'Tell me about yourself',
  'What do you believe in?',
  'Why did you run for mayor?',
  'What makes you different from other politicians?',
  'What is your biggest priority as mayor?',
  // Policy / economy
  'How will you pay for your programs?',
  'What do you think about taxing the wealthy?',
  'How will you help small businesses in NYC?',
  'What is your plan for childcare?',
  'How will you address food insecurity in the city?',
];

function randomQuestion() {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

// Build a short 1-turn history (some users send follow-ups)
function buildMessages() {
  const question = randomQuestion();
  return [{ role: 'user', content: question }];
}

// ── Virtual user scenario ─────────────────────────────────────────────────────
export default function () {
  const payload = JSON.stringify({ messages: buildMessages() });

  const params = {
    headers: {
      'Content-Type':        'application/json',
      'X-Load-Test-Secret':  __ENV.LOAD_TEST_SECRET || '',
    },
    timeout: '45s',   // generous — SSE streams can take time
    tags:    { endpoint: 'mamdani-chat' },
  };

  const startMs = Date.now();

  const res = http.post(`${BASE_URL}/mamdani-chat`, payload, params);

  const durationMs = Date.now() - startMs;

  // TTFB = time_waiting from k6 timing (ms before first byte received)
  const ttfb = res.timings.waiting;
  ttfbTrend.add(ttfb);
  totalLatency.add(durationMs);

  const ok = check(res, {
    'status is 200':           (r) => r.status === 200,
    'not rate limited (429)':  (r) => r.status !== 429,
    'no server error (5xx)':   (r) => r.status < 500,
    'has body':                (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!ok);

  if (res.status !== 200) {
    console.log(`[VU ${__VU}] status=${res.status} body="${res.body?.slice(0, 120)}"`);
  }

  // Human think time: 2–8s between questions (realistic pacing)
  sleep(2 + Math.random() * 6);
}

// ── End-of-test summary ───────────────────────────────────────────────────────
export function handleSummary(data) {
  const m         = data.metrics;
  const total     = m.iterations?.values?.count         ?? 0;
  const errors    = m.mamdani_errors?.values?.rate      ?? 0;
  const p50Total  = m.mamdani_total_ms?.values?.['p(50)'] ?? 0;
  const p95Total  = m.mamdani_total_ms?.values?.['p(95)'] ?? 0;
  const p99Total  = m.mamdani_total_ms?.values?.['p(99)'] ?? 0;
  const p50Ttfb   = m.mamdani_ttfb_ms?.values?.['p(50)'] ?? 0;
  const p95Ttfb   = m.mamdani_ttfb_ms?.values?.['p(95)'] ?? 0;
  const rps       = m.http_reqs?.values?.rate           ?? 0;

  const report = `
╔══════════════════════════════════════════════════════════╗
║       MAMDANI /chat LOAD TEST RESULTS                    ║
╠══════════════════════════════════════════════════════════╣
║ Total requests     : ${String(total).padEnd(34)}║
║ Requests/sec       : ${String(rps.toFixed(2)).padEnd(34)}║
║ Error rate         : ${String((errors * 100).toFixed(2) + '%').padEnd(34)}║
╠══════════════════════════════════════════════════════════╣
║ TOTAL RESPONSE TIME (wall clock incl. SSE stream)        ║
║   p50             : ${String(Math.round(p50Total) + ' ms').padEnd(34)}║
║   p95             : ${String(Math.round(p95Total) + ' ms').padEnd(34)}║
║   p99             : ${String(Math.round(p99Total) + ' ms').padEnd(34)}║
╠══════════════════════════════════════════════════════════╣
║ TIME TO FIRST BYTE (server started responding)           ║
║   p50             : ${String(Math.round(p50Ttfb) + ' ms').padEnd(34)}║
║   p95             : ${String(Math.round(p95Ttfb) + ' ms').padEnd(34)}║
╚══════════════════════════════════════════════════════════╝
`;

  console.log(report);
  return { stdout: report };
}
