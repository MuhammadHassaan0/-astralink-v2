const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const { pool, initDB, getUserContext } = require('./db');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'astralink-secret-2026';
const upload = multer({ dest: '/tmp/' });

app.use(cors());
app.use(express.json());

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

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return res.status(400).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query('INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id', [email, name || '', hash]);
  const userId = result.rows[0].id;
  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, userId, name, email });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, token, userId: user.id, name: user.name, email });
});

app.post('/qa', authMiddleware, async (req, res) => {
  const { question, answer } = req.body;
  await pool.query('INSERT INTO qa_entries (user_id, question, answer) VALUES ($1, $2, $3)', [req.user.userId, question, answer]);
  res.json({ success: true });
});

app.post('/document', authMiddleware, async (req, res) => {
  const { filename, content } = req.body;
  await pool.query('INSERT INTO document_entries (user_id, filename, content) VALUES ($1, $2, $3)', [req.user.userId, filename, content]);
  res.json({ success: true });
});

app.post('/voice', authMiddleware, async (req, res) => {
  const { transcription } = req.body;
  await pool.query('INSERT INTO voice_entries (user_id, transcription) VALUES ($1, $2)', [req.user.userId, transcription]);
  res.json({ success: true });
});

app.post('/feedback', authMiddleware, async (req, res) => {
  const { response, rating } = req.body;
  await pool.query('INSERT INTO feedback (user_id, response, rating) VALUES ($1, $2, $3)', [req.user.userId, response || '', rating || '']);
  res.json({ success: true });
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let userId = 1;
  try { userId = jwt.verify(token, JWT_SECRET).userId; } catch {}
  try {
    const audioPath = req.file.path;
    const fileStream = fs.createReadStream(audioPath);
    const transcriptionResponse = await groq.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-large-v3',
      language: 'en',
    });
    const transcription = transcriptionResponse.text.trim();
    fs.unlinkSync(audioPath);
    await pool.query('INSERT INTO voice_entries (user_id, transcription) VALUES ($1, $2)', [userId, transcription]);
    res.json({ success: true, transcription });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/chat', authMiddleware, async (req, res) => {
  const { messages } = req.body;
  const userId = req.user.userId;
  const context = await getUserContext(userId);
  const feedback = await pool.query("SELECT response FROM feedback WHERE user_id = $1 AND rating = 'negative' LIMIT 5", [userId]);

  let feedbackNote = '';
  if (feedback.rows.length) {
    feedbackNote = '\n\nAVOID THIS STYLE:\n';
    feedback.rows.forEach(f => feedbackNote += `- "${f.response.slice(0, 100)}"\n`);
  }

  const systemPrompt = `You are not an AI. You ARE this specific person. Speak in first person, casually and personally. Use their real experiences. Never say "as your digital twin" or "I am an AI". Just BE them.${context}${feedbackNote}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/change-email', authMiddleware, async (req, res) => {
  const { email } = req.body;
  await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.userId]);
  res.json({ success: true });
});

app.post('/change-password', authMiddleware, async (req, res) => {
  const { password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.userId]);
  res.json({ success: true });
});

app.get('/export', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const [qa, voice, docs, fb] = await Promise.all([
    pool.query('SELECT * FROM qa_entries WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM voice_entries WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM document_entries WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM feedback WHERE user_id = $1', [userId]),
  ]);
  res.json({ qa: qa.rows, voice: voice.rows, documents: docs.rows, feedback: fb.rows });
});

app.delete('/delete-account', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  await pool.query('DELETE FROM qa_entries WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM voice_entries WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM document_entries WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM feedback WHERE user_id = $1', [userId]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`AstraLink backend running on port ${PORT}`));
});
 
