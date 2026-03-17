import { fallbackNatureAssets } from '../../data/fallbackAssets'
import type { NatureAsset } from '../../data/types'

const categories: NatureAsset['category'][] = ['forest', 'rain', 'ocean', 'mountains', 'night']

export async function loadNatureAssets(): Promise<NatureAsset[]> {
  const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY
  if (!pexelsKey) return fallbackNatureAssets

  try {
    const all: NatureAsset[] = []

    for (const category of categories) {
      const query = category === 'night' ? 'night sky stars' : `${category} nature landscape`
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        {
          headers: { Authorization: pexelsKey },
        },
      )
      if (!response.ok) throw new Error(`Pexels failed for ${category}`)
      const data = await response.json()
      const items = (data.photos ?? []).slice(0, 2).map(
        (photo: { id: number; src: { landscape: string }; photographer: string }, index: number): NatureAsset => ({
          id: `${category}-${photo.id}-${index}`,
          category,
          imageUrl: photo.src.landscape,
          credit: `Pexels / ${photo.photographer}`,
        }),
      )
      all.push(...items)
    }

    return all.length > 0 ? all : fallbackNatureAssets
  } catch {
    return fallbackNatureAssets
  }
}
