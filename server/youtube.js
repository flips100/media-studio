/**
 * YouTube Data API v3 OAuth helpers + resumable video upload.
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 *      YOUTUBE_REDIRECT_URI (default http://localhost:8787/api/youtube/callback),
 *      YOUTUBE_TOKEN_PATH (default ./uploads/youtube-tokens.json)
 */
import { google } from 'googleapis'
import fs from 'node:fs'
import path from 'node:path'

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]

const DEFAULT_REDIRECT = 'http://localhost:8787/api/youtube/callback'
const DEFAULT_TOKEN_PATH = './uploads/youtube-tokens.json'

function redirectUri() {
  return process.env.YOUTUBE_REDIRECT_URI || DEFAULT_REDIRECT
}

function tokenPath() {
  const configured = process.env.YOUTUBE_TOKEN_PATH || DEFAULT_TOKEN_PATH
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured)
}

export function credentialsConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

function createOAuth2Client() {
  if (!credentialsConfigured()) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  )
}

export function getAuthUrl() {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export function loadTokens() {
  try {
    const raw = fs.readFileSync(tokenPath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveTokens(tokens) {
  const dest = tokenPath()
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const existing = loadTokens() || {}
  const merged = { ...existing, ...tokens }
  if (!merged.refresh_token && existing.refresh_token) {
    merged.refresh_token = existing.refresh_token
  }
  fs.writeFileSync(dest, JSON.stringify(merged, null, 2), 'utf8')
  return merged
}

export async function exchangeCode(code) {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  saveTokens(tokens)
  return tokens
}

export async function getAuthenticatedClient() {
  const client = createOAuth2Client()
  const tokens = loadTokens()
  if (!tokens?.refresh_token && !tokens?.access_token) {
    throw new Error('YouTube not connected — visit /api/youtube/auth first')
  }
  client.setCredentials(tokens)
  client.on('tokens', (fresh) => {
    saveTokens(fresh)
  })
  return client
}

export async function getChannelTitle() {
  const auth = await getAuthenticatedClient()
  const youtube = google.youtube({ version: 'v3', auth })
  const res = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
  })
  return res.data.items?.[0]?.snippet?.title || null
}

/**
 * Resumable upload via googleapis youtube.videos.insert.
 * @param {{ filePath: string, title: string, description?: string, privacyStatus?: 'public'|'unlisted'|'private' }} opts
 */
export async function uploadVideo({
  filePath,
  title,
  description = '',
  privacyStatus = 'unlisted',
}) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Video file not found')
  }
  const allowed = new Set(['public', 'unlisted', 'private'])
  const privacy = allowed.has(privacyStatus) ? privacyStatus : 'unlisted'

  const auth = await getAuthenticatedClient()
  const youtube = google.youtube({ version: 'v3', auth })

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title || 'Untitled',
        description: description || '',
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  })

  const id = res.data.id
  if (!id) {
    throw new Error('YouTube upload succeeded but no video id returned')
  }
  return { id, url: `https://youtu.be/${id}`, data: res.data }
}

export { SCOPES, redirectUri, tokenPath }
