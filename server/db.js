const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      password TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voice_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      transcription TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      filename TEXT,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      question TEXT,
      answer TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      message TEXT,
      response TEXT,
      rating TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getUserContext(userId) {
  const voices = await pool.query('SELECT transcription FROM voice_entries WHERE user_id = $1', [userId]);
  const docs = await pool.query('SELECT filename, content FROM document_entries WHERE user_id = $1', [userId]);
  const qa = await pool.query('SELECT question, answer FROM qa_entries WHERE user_id = $1', [userId]);

  let context = '';
  if (voices.rows.length) {
    context += '\n\nVOICE RECORDINGS:\n';
    voices.rows.forEach(v => context += `- ${v.transcription}\n`);
  }
  if (docs.rows.length) {
    context += '\n\nDOCUMENTS:\n';
    docs.rows.forEach(d => context += `${d.filename}: ${d.content.slice(0, 8000)}\n`);
  }
  if (qa.rows.length) {
    context += '\n\nQ&A ANSWERS:\n';
    qa.rows.forEach(q => context += `Q: ${q.question}\nA: ${q.answer}\n`);
  }
  return context;
}

async function getPublicContext(userId) {
  const voices = await pool.query('SELECT transcription FROM voice_entries WHERE user_id = $1 LIMIT 3', [userId]);
  const docs = await pool.query('SELECT filename, content FROM document_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 2', [userId]);
  const qa = await pool.query('SELECT question, answer FROM qa_entries WHERE user_id = $1 LIMIT 5', [userId]);

  let context = '';
  if (voices.rows.length) {
    context += '\n\nVOICE RECORDINGS:\n';
    voices.rows.forEach(v => context += `- ${v.transcription}\n`);
  }
  if (docs.rows.length) {
    context += '\n\nDOCUMENTS:\n';
    docs.rows.forEach(d => context += `${d.filename}: ${d.content.slice(0, 3000)}\n`);
  }
  if (qa.rows.length) {
    context += '\n\nQ&A ANSWERS:\n';
    qa.rows.forEach(q => context += `Q: ${q.question}\nA: ${q.answer}\n`);
  }
  return context;
}

module.exports = { pool, initDB, getUserContext, getPublicContext };
