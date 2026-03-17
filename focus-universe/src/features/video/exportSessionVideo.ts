interface ExportInput {
  durationSeconds: number
  title: string
  backgroundImage: string
}

export async function exportSessionVideo({ durationSeconds, title, backgroundImage }: ExportInput): Promise<Blob> {
  const width = 3840
  const height = 2160
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  const image = await loadImage(backgroundImage)
  const stream = canvas.captureStream(30)
  const chunks: BlobPart[] = []
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  recorder.start()

  const start = performance.now()
  while ((performance.now() - start) / 1000 <= durationSeconds) {
    const elapsed = (performance.now() - start) / 1000
    const remaining = Math.max(0, durationSeconds - elapsed)
    const progress = elapsed / durationSeconds

    const zoom = 1.02 + progress * 0.08
    const drawWidth = width * zoom
    const drawHeight = height * zoom
    ctx.drawImage(image, -(drawWidth - width) / 2, -(drawHeight - height) / 2, drawWidth, drawHeight)

    ctx.fillStyle = 'rgba(7, 16, 30, 0.35)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.font = '700 140px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(title.toUpperCase(), width / 2, 260)

    ctx.fillStyle = 'rgba(141, 231, 202, 0.9)'
    ctx.fillRect(160, height - 220, (width - 320) * progress, 28)

    ctx.fillStyle = '#f6fffd'
    ctx.font = '700 240px system-ui'
    const min = Math.floor(remaining / 60)
    const sec = Math.floor(remaining % 60)
    ctx.fillText(`${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`, width / 2, height / 2 + 60)

    await new Promise((resolve) => setTimeout(resolve, 33))
  }

  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }))
    }
    recorder.stop()
  })

  return blob
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load background image'))
    image.src = src
  })
}
