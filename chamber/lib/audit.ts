import type { AuditData } from '@/types'

export function generateAuditHTML(data: AuditData): string {
  const activeHard = data.activeConstraints.filter((c) => c.type === 'hard')
  const activeSoft = data.activeConstraints.filter((c) => c.type === 'soft')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chamber Audit — ${data.mind.fullName} — ${data.timestamp}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

    :root {
      --ink: #0c0b09;
      --parchment: #f4efe5;
      --warm: #ede8dc;
      --gold: #c8a84a;
      --rust: #8a3828;
      --muted: #78746e;
      --border: #d2c8ae;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 300;
      background: var(--parchment);
      color: var(--ink);
      max-width: 780px;
      margin: 0 auto;
      padding: 3rem 2.5rem;
      line-height: 1.8;
    }

    .eyebrow {
      font-family: 'DM Mono', monospace;
      font-size: 0.55rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 0.5rem;
    }

    h1 {
      font-weight: 400;
      font-size: 2rem;
      font-style: italic;
      margin-bottom: 0.25rem;
    }

    .meta {
      font-family: 'DM Mono', monospace;
      font-size: 0.55rem;
      letter-spacing: 0.1em;
      color: var(--muted);
      margin-bottom: 2.5rem;
    }

    .rule { height: 1px; background: var(--border); margin: 1.75rem 0; }

    .section-label {
      font-family: 'DM Mono', monospace;
      font-size: 0.52rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }

    .question {
      font-size: 1.3rem;
      font-style: italic;
      color: var(--ink);
      padding: 1rem 1.25rem;
      background: var(--warm);
      border-left: 3px solid var(--gold);
      margin-bottom: 0.5rem;
    }

    .constraint-row {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.88rem;
    }

    .constraint-type {
      font-family: 'DM Mono', monospace;
      font-size: 0.46rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.15em 0.4em;
      border-radius: 2px;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 0.25rem;
    }

    .hard-tag { background: rgba(138,56,40,0.1); color: var(--rust); }
    .soft-tag { background: rgba(200,168,74,0.1); color: #806020; }

    .constraint-name { font-weight: 400; }
    .constraint-source { font-style: italic; color: var(--muted); font-size: 0.78rem; }

    .response-text {
      font-size: 1.1rem;
      line-height: 1.9;
      color: var(--ink);
      margin-bottom: 0.5rem;
    }

    .trace-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 0.5rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.85rem;
    }

    .trace-label {
      font-family: 'DM Mono', monospace;
      font-size: 0.48rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      padding-top: 0.15rem;
    }

    .chunk-block {
      background: var(--warm);
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.88rem;
      line-height: 1.7;
      border-left: 2px solid var(--border);
    }

    .footer {
      margin-top: 3rem;
      font-family: 'DM Mono', monospace;
      font-size: 0.5rem;
      letter-spacing: 0.12em;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <p class="eyebrow">AstraLink · The Chamber · Decision Audit</p>
  <h1>${data.mind.fullName}</h1>
  <p class="meta">${data.era.label} · ${data.era.dateRange} · Generated ${data.timestamp}</p>

  <div class="rule"></div>

  <p class="section-label">Question asked</p>
  <div class="question">${data.question}</div>

  <div class="rule"></div>

  <p class="section-label">Active constraints</p>
  ${activeHard
    .map(
      (c) => `
  <div class="constraint-row">
    <span class="constraint-type hard-tag">Hard</span>
    <div>
      <div class="constraint-name">${c.name}</div>
      <div class="constraint-source">${c.source}</div>
      <div style="font-size:0.82rem;color:#3c3c38;margin-top:0.2rem">${c.evidence}</div>
    </div>
  </div>`
    )
    .join('')}
  ${activeSoft
    .map(
      (c) => `
  <div class="constraint-row">
    <span class="constraint-type soft-tag">Soft</span>
    <div>
      <div class="constraint-name">${c.name}</div>
      <div class="constraint-source">${c.source}</div>
    </div>
  </div>`
    )
    .join('')}

  <div class="rule"></div>

  <p class="section-label">Reasoning trace</p>
  ${data.trace.steps
    .map(
      (s) => `
  <div class="trace-row">
    <span class="trace-label">${s.label}</span>
    <span>${s.value}</span>
  </div>`
    )
    .join('')}

  <div class="rule"></div>

  <p class="section-label">Response</p>
  <p class="response-text">${data.response}</p>

  ${
    data.retrievedChunks.length > 0
      ? `
  <div class="rule"></div>
  <p class="section-label">Retrieved corpus chunks</p>
  ${data.retrievedChunks.map((chunk) => `<div class="chunk-block">${chunk}</div>`).join('')}`
      : ''
  }

  ${
    data.contradictions.length > 0
      ? `
  <div class="rule"></div>
  <p class="section-label">Contradictions detected</p>
  ${data.contradictions
    .map(
      (c) => `
  <div style="margin-bottom:1rem;padding:0.75rem 1rem;background:var(--warm)">
    <strong>${c.topic}</strong><br/>
    <span style="color:var(--muted);font-size:0.85rem">${c.position_a.era}: ${c.position_a.position}</span><br/>
    <span style="color:var(--muted);font-size:0.85rem">${c.position_b.era}: ${c.position_b.position}</span><br/>
    <em style="font-size:0.82rem">${c.note}</em>
  </div>`
    )
    .join('')}`
      : ''
  }

  ${
    data.hypothetical
      ? `
  <div class="rule"></div>
  <p class="section-label">Hypothetical applied</p>
  <p style="font-style:italic;color:var(--muted)">"${data.hypothetical}"</p>`
      : ''
  }

  <div class="rule"></div>
  <p class="footer">The Chamber · AstraLink · Every claim traceable to documented sources</p>
</body>
</html>`
}

export function downloadAudit(data: AuditData) {
  const html = generateAuditHTML(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chamber-audit-${data.mind.id}-${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
