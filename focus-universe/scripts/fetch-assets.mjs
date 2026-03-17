import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const output = path.join(root, 'public/assets/remote')

const categories = ['forest', 'rain', 'ocean', 'mountains', 'night sky']
const pexelsKey = process.env.PEXELS_API_KEY
const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

async function ensureOutput() {
  await mkdir(output, { recursive: true })
}

async function fetchPexels(category) {
  if (!pexelsKey) return []
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(category)}&per_page=8&orientation=landscape`,
    { headers: { Authorization: pexelsKey } },
  )
  if (!response.ok) return []
  const data = await response.json()
  return (data.photos ?? []).map((photo) => ({
    id: `pexels-${photo.id}`,
    category,
    imageUrl: photo.src.landscape,
    credit: `Pexels / ${photo.photographer}`,
  }))
}

async function fetchUnsplash(category) {
  if (!unsplashKey) return []
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(category)}&per_page=8&orientation=landscape&client_id=${unsplashKey}`,
  )
  if (!response.ok) return []
  const data = await response.json()
  return (data.results ?? []).map((photo) => ({
    id: `unsplash-${photo.id}`,
    category,
    imageUrl: photo.urls.regular,
    credit: `Unsplash / ${photo.user?.name ?? 'Unknown'}`,
  }))
}

async function run() {
  await ensureOutput()
  const remote = []

  for (const category of categories) {
    const pexels = await fetchPexels(category)
    const unsplash = await fetchUnsplash(category)
    remote.push(...pexels, ...unsplash)
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    total: remote.length,
    items: remote,
  }

  await writeFile(path.join(output, 'nature-assets.json'), JSON.stringify(payload, null, 2))

  console.log(`Remote asset index created: ${remote.length} records`)
  if (!pexelsKey && !unsplashKey) {
    console.log('No API keys were provided. File was generated empty; local fallback assets remain active.')
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
