/**
 * Provider-agnostic LLM wrapper.
 *
 * Detection order (first match wins):
 *   1. LLM_PROVIDER env var (anthropic | openai | groq | mistral | together | perplexity | ollama | custom)
 *   2. Key prefix  →  sk-ant-* = anthropic, gsk_* = groq, sk-* = openai
 *
 * Extra env vars:
 *   LLM_API_KEY   — key for any provider (falls back to ANTHROPIC_API_KEY for Anthropic)
 *   LLM_MODEL     — override the default model for the chosen provider
 *   LLM_BASE_URL  — required for "ollama" and "custom"; optional override for others
 */

const BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
  together: 'https://api.together.xyz/v1',
  perplexity: 'https://api.perplexity.ai',
  ollama: 'http://localhost:11434/v1',
}

const DEFAULT_MODELS = {
  anthropic: 'claude-opus-4-8',
  openai: 'gpt-4o',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
  together: 'meta-llama/Llama-3-70b-chat-hf',
  perplexity: 'llama-3.1-sonar-large-128k-online',
  ollama: 'llama3',
  custom: 'gpt-4o',
}

function detectProvider() {
  if (process.env.LLM_PROVIDER) return process.env.LLM_PROVIDER.toLowerCase()
  const key = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  if (key.startsWith('sk-ant-')) return 'anthropic'
  if (key.startsWith('gsk_')) return 'groq'
  if (key.startsWith('sk-')) return 'openai'
  return null
}

async function generate(prompt, { maxTokens = 4096 } = {}) {
  const provider = detectProvider()
  if (!provider) throw new Error('No LLM provider configured — set LLM_API_KEY and LLM_PROVIDER in server/.env')

  const apiKey = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || 'ollama'
  const model = process.env.LLM_MODEL || DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai

  if (provider === 'anthropic') {
    const _Anthropic = require('@anthropic-ai/sdk')
    const Anthropic = _Anthropic.default ?? _Anthropic
    const client = new Anthropic({ apiKey })
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })
    const message = await stream.finalMessage()
    const textBlock = message.content.find((b) => b.type === 'text')
    return textBlock?.text ?? ''
  }

  // All other providers speak the OpenAI chat-completions dialect
  const { OpenAI } = require('openai')
  const baseURL = process.env.LLM_BASE_URL || BASE_URLS[provider]
  const client = new OpenAI({ apiKey, ...(baseURL && { baseURL }) })
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  })
  return response.choices[0]?.message?.content ?? ''
}

module.exports = { generate, detectProvider }
