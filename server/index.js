const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ollama = require('ollama').default;
const { db, getUserContext } = require('./db');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: '/tmp/' });

const app = express();
const JWT_SECRET = 'astralink-secret-2026';

app.use(cors());
app.use(express.json());

db.exec(`CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT,
  response TEXT,
  rating TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Register
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, name, password) VALUES (?, ?, ?)').run(email, name || '', hash);
  const token = jwt.sign({ userId: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, userId: result.lastInsertRowid, name, email });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, userId: user.id, name: user.name, email });
});

// Protected routes
app.post('/qa', authMiddleware, (req, res) => {
  const { question, answer } = req.body;
  db.prepare('INSERT INTO qa_entries (user_id, question, answer) VALUES (?, ?, ?)').run(req.user.userId, question, answer);
  res.json({ success: true });
});

app.post('/document', authMiddleware, (req, res) => {
  const { filename, content } = req.body;
  db.prepare('INSERT INTO document_entries (user_id, filename, content) VALUES (?, ?, ?)').run(req.user.userId, filename, content);
  res.json({ success: true });
});

app.post('/voice', authMiddleware, (req, res) => {
  const { transcription } = req.body;
  db.prepare('INSERT INTO voice_entries (user_id, transcription) VALUES (?, ?)').run(req.user.userId, transcription);
  res.json({ success: true });
});

app.post('/feedback', authMiddleware, (req, res) => {
  const { response, rating } = req.body;
  db.prepare('INSERT INTO feedback (user_id, response, rating) VALUES (?, ?, ?)').run(req.user.userId, response || '', rating || '');
  res.json({ success: true });
});

app.post('/chat', authMiddleware, async (req, res) => {
  const { messages } = req.body;
  const userId = req.user.userId;
  const context = getUserContext(userId);
  const feedback = db.prepare("SELECT response FROM feedback WHERE user_id = ? AND rating = 'negative' LIMIT 5").all(userId);

  let feedbackNote = '';
  if (feedback.length) {
    feedbackNote = '\n\nAVOID THIS STYLE (marked as not sounding like me):\n';
    feedback.forEach(f => feedbackNote += `- "${f.response.slice(0, 100)}"\n`);
  }

  const systemPrompt = `You are not an AI. You ARE this specific person. Speak in first person, casually and personally. Use their real experiences. Never say "as your digital twin" or "I am an AI". Just BE them.${context}${feedbackNote}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await ollama.chat({
      model: 'llama3.1',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });
    for await (const chunk of response) {
      res.write(`data: ${JSON.stringify({ text: chunk.message.content })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/transcribe', upload.single('audio'), (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let userId = 1;
  try { userId = require('jsonwebtoken').verify(token, JWT_SECRET).userId; } catch {}

  const audioPath = req.file.path;
  const outDir = '/tmp';

  exec(`/opt/homebrew/bin/whisper ${audioPath} --model tiny --output_dir ${outDir} --output_format txt --language en`, (err, stdout, stderr) => {
    const txtPath = audioPath + '.txt';
    if (err || !fs.existsSync(txtPath)) {
      console.error('Whisper error:', err, stderr);
      return res.status(500).json({ error: 'Transcription failed' });
    }
    const transcription = fs.readFileSync(txtPath, 'utf8').trim();
    fs.unlinkSync(audioPath);
    fs.unlinkSync(txtPath);
    db.prepare('INSERT INTO voice_entries (user_id, transcription) VALUES (?, ?)').run(userId, transcription);
    res.json({ success: true, transcription });
  });
});

app.delete('/delete-account', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  db.prepare('DELETE FROM qa_entries WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM voice_entries WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM document_entries WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM feedback WHERE user_id = ?').run(userId);
  res.json({ success: true });
});

app.listen(3001, () => console.log('AstraLink backend running on port 3001'));
