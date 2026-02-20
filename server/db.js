const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'astralink.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS voice_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    transcription TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS document_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS qa_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    question TEXT,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Helper: get all context for a user to build system prompt
function getUserContext(userId) {
  const voices = db.prepare('SELECT transcription FROM voice_entries WHERE user_id = ?').all(userId);
  const docs = db.prepare('SELECT filename, content FROM document_entries WHERE user_id = ?').all(userId);
  const qas = db.prepare('SELECT question, answer FROM qa_entries WHERE user_id = ?').all(userId);

  let context = '';

  if (voices.length) {
    context += '\n\nVOICE RECORDINGS (what this person said in their own words):\n';
    voices.forEach((v, i) => context += `${i+1}. ${v.transcription}\n`);
  }

  if (docs.length) {
    context += '\n\nDOCUMENTS THEY SHARED:\n';
    docs.forEach(d => context += `[${d.filename}]: ${d.content.slice(0, 1000)}\n`);
  }

  if (qas.length) {
    context += '\n\nQ&A ANSWERS:\n';
    qas.forEach(q => context += `Q: ${q.question}\nA: ${q.answer}\n\n`);
  }

  return context;
}

module.exports = { db, getUserContext };
