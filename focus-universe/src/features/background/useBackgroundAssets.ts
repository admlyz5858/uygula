import { useEffect } from 'react'
import { useFocusStore } from '../../data/store'
import { loadNatureAssets } from './backgroundService'

export function useBackgroundAssets(): void {
  const setAssets = useFocusStore((state) => state.setAssets)

  useEffect(() => {
    void loadNatureAssets().then((assets) => setAssets(assets))
  }, [setAssets])
}
