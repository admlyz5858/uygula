import type { AudioTrack, NatureAsset } from './types'

export const fallbackNatureAssets: NatureAsset[] = [
  {
    id: 'forest-1',
    category: 'forest',
    imageUrl: '/assets/images/nature_scene_001.jpg',
    videoUrl: '/assets/videos/forest_canopy_loop_01.mp4',
    credit: 'Focus Universe local library',
  },
  {
    id: 'rain-1',
    category: 'rain',
    imageUrl: '/assets/images/nature_scene_010.jpg',
    videoUrl: '/assets/videos/rain_window_loop_03.mp4',
    credit: 'Focus Universe local library',
  },
  {
    id: 'ocean-1',
    category: 'ocean',
    imageUrl: '/assets/images/nature_scene_020.jpg',
    videoUrl: '/assets/videos/ocean_dawn_loop_05.mp4',
    credit: 'Focus Universe local library',
  },
  {
    id: 'mountain-1',
    category: 'mountains',
    imageUrl: '/assets/images/nature_scene_030.jpg',
    videoUrl: '/assets/videos/mountain_sunrise_loop_07.mp4',
    credit: 'Focus Universe local library',
  },
  {
    id: 'night-1',
    category: 'night',
    imageUrl: '/assets/images/nature_scene_040.jpg',
    videoUrl: '/assets/videos/night_sky_loop_09.mp4',
    credit: 'Focus Universe local library',
  },
]

export const fallbackAudioTracks: AudioTrack[] = [
  { id: 'focus-rain', mode: 'focus', title: 'Rain Drift', url: '/assets/audio/rain_ambient_01.mp3', category: 'rain' },
  { id: 'focus-birds', mode: 'focus', title: 'Bird Valley', url: '/assets/audio/birds_ambient_03.mp3', category: 'birds' },
  { id: 'focus-wind', mode: 'focus', title: 'Wind Halo', url: '/assets/audio/wind_ambient_02.mp3', category: 'wind' },
  { id: 'focus-lofi', mode: 'focus', title: 'Lo-Fi Flow', url: '/assets/audio/rain_ambient_05.mp3', category: 'lofi' },
  { id: 'break-piano', mode: 'break', title: 'Soft Piano Bloom', url: '/assets/audio/fireplace_ambient_04.mp3', category: 'piano' },
  { id: 'break-chill', mode: 'break', title: 'Chill Breeze', url: '/assets/audio/wind_ambient_06.mp3', category: 'chill' },
  { id: 'break-nature', mode: 'break', title: 'Nature Glow', url: '/assets/audio/birds_ambient_07.mp3', category: 'nature' },
]

export const uiSfx = {
  tick: '/assets/sfx/tick.mp3',
  bell: '/assets/sfx/bell.mp3',
  click: '/assets/sfx/click.mp3',
}
