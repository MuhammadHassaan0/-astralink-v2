import OpenAI from 'openai'

if (!process.env.GROQ_API_KEY) {
  console.warn('[chamber] GROQ_API_KEY not set — API routes will fail at runtime')
}

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? 'missing',
  baseURL: 'https://api.groq.com/openai/v1',
})

export const MODEL = 'llama-3.3-70b-versatile'
