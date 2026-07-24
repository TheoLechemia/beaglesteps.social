import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function resolveDomain() {
  if (process.env.VITE_APP_DOMAIN) return process.env.VITE_APP_DOMAIN

  try {
    const envFile = readFileSync(path.join(rootDir, '.env'), 'utf-8')
    const match = envFile.match(/^VITE_APP_DOMAIN=(.+)$/m)
    if (match) return match[1].trim()
  } catch {
    // no .env file present, fall through to default
  }

  return 'beaglesteps.social'
}

const domain = resolveDomain()

const metadata = {
  client_id: `https://${domain}/client-metadata.json`,
  client_name: 'Beaglesteps',
  client_uri: `https://${domain}`,
  redirect_uris: [`https://${domain}/`],
  scope: 'atproto transition:generic',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'none',
  application_type: 'web',
  dpop_bound_access_tokens: true,
}

writeFileSync(
  path.join(rootDir, 'public', 'client-metadata.json'),
  `${JSON.stringify(metadata, null, 2)}\n`,
)

console.log(`Generated public/client-metadata.json for domain: ${domain}`)
