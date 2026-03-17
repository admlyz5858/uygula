import { cp, mkdir, readdir, stat, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const androidAssets = path.resolve(root, '../app/src/main/assets')
const webAssets = path.resolve(root, 'public/assets')

const mapping = {
  images: ['nature_scene_001.jpg', 'nature_scene_010.jpg', 'nature_scene_020.jpg', 'nature_scene_030.jpg', 'nature_scene_040.jpg'],
  videos: [
    'forest_canopy_loop_01.mp4',
    'rain_window_loop_03.mp4',
    'ocean_dawn_loop_05.mp4',
    'mountain_sunrise_loop_07.mp4',
    'night_sky_loop_09.mp4',
  ],
  audio: [
    'rain_ambient_01.mp3',
    'wind_ambient_02.mp3',
    'birds_ambient_03.mp3',
    'fireplace_ambient_04.mp3',
    'rain_ambient_05.mp3',
    'wind_ambient_06.mp3',
    'birds_ambient_07.mp3',
  ],
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function copyIfExists(src, dest) {
  try {
    await stat(src)
    await copyFile(src, dest)
    return true
  } catch {
    return false
  }
}

async function run() {
  await ensureDir(path.join(webAssets, 'images'))
  await ensureDir(path.join(webAssets, 'videos'))
  await ensureDir(path.join(webAssets, 'audio'))
  await ensureDir(path.join(webAssets, 'sfx'))

  const copied = []

  for (const file of mapping.images) {
    const ok = await copyIfExists(path.join(androidAssets, 'images', file), path.join(webAssets, 'images', file))
    if (ok) copied.push(`images/${file}`)
  }
  for (const file of mapping.videos) {
    const ok = await copyIfExists(path.join(androidAssets, 'videos', file), path.join(webAssets, 'videos', file))
    if (ok) copied.push(`videos/${file}`)
  }
  for (const file of mapping.audio) {
    const ok = await copyIfExists(path.join(androidAssets, 'audio', file), path.join(webAssets, 'audio', file))
    if (ok) copied.push(`audio/${file}`)
  }

  // Tick + bell are sourced from existing ambient clips to avoid missing references.
  await copyIfExists(path.join(webAssets, 'audio', 'wind_ambient_02.mp3'), path.join(webAssets, 'sfx', 'tick.mp3'))
  await copyIfExists(path.join(webAssets, 'audio', 'fireplace_ambient_04.mp3'), path.join(webAssets, 'sfx', 'bell.mp3'))

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'android fallback library',
    files: copied,
  }
  await writeFile(path.join(webAssets, 'asset-manifest.json'), JSON.stringify(manifest, null, 2))

  // Copy all if folder is still empty to ensure instant run.
  const imageFiles = await readdir(path.join(webAssets, 'images'))
  if (imageFiles.length === 0) {
    await cp(path.join(androidAssets, 'images'), path.join(webAssets, 'images'), { recursive: true })
    await cp(path.join(androidAssets, 'audio'), path.join(webAssets, 'audio'), { recursive: true })
    await cp(path.join(androidAssets, 'videos'), path.join(webAssets, 'videos'), { recursive: true })
  }

  console.log('Fallback assets are ready in public/assets')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
