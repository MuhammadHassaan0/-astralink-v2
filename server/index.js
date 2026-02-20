const express = require('express');
const cors = require('cors');
const ollama = require('ollama').default;
const { db, getUserContext } = require('./db');

const app = express();
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

app.post('/qa', (req, res) => {
  const { userId, question, answer } = req.body;
  db.prepare('INSERT INTO qa_entries (user_id, question, answer) VALUES (?, ?, ?)').run(userId, question, answer);
  res.json({ success: true });
});

app.post('/document', (req, res) => {
  const { userId, filename, content } = req.body;
  db.prepare('INSERT INTO document_entries (user_id, filename, content) VALUES (?, ?, ?)').run(userId, filename, content);
  res.json({ success: true });
});

app.post('/voice', (req, res) => {
  const { userId, transcription } = req.body;
  db.prepare('INSERT INTO voice_entries (user_id, transcription) VALUES (?, ?)').run(userId, transcription);
  res.json({ success: true });
});

app.post('/feedback', (req, res) => {
  const { userId, message, response, rating } = req.body;
  db.prepare('INSERT INTO feedback (user_id, message, response, rating) VALUES (?, ?, ?, ?)').run(userId || 1, message || '', response || '', rating || '');
  res.json({ success: true });
});

app.post('/chat', async (req, res) => {
  const { messages, userId = 1 } = req.body;
  const context = getUserContext(userId);
  const feedback = db.prepare("SELECT response, rating FROM feedback WHERE user_id = ? AND rating = 'negative' LIMIT 5").all(userId);

  let feedbackNote = '';
  if (feedback.length) {
    feedbackNote = '\n\nPREVIOUS RESPONSES MARKED AS NOT SOUNDING LIKE ME (avoid this style):\n';
    feedback.forEach(f => feedbackNote += `- "${f.response.slice(0, 100)}"\n`);
  }

  const systemPrompt = `You are not an AI assistant. You ARE this specific person. Speak in first person, casually, personally. Use their real experiences, decisions, and words. Never say "as your digital twin" or "I am an AI". Just BE them — authentic, direct, real.${context}${feedbackNote}`;

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

app.listen(3001, () => console.log('AstraLink backend running on port 3001'));
