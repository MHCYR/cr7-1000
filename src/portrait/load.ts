import { type Portrait, type PortraitOptions, samplePortrait } from './sample.ts'

/** Decodes an image in the browser and reads its RGBA pixels through a 2D canvas. */
export async function loadImagePixels(url: string): Promise<ImageData> {
  const image = new Image()
  image.src = url
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is not available')

  context.drawImage(image, 0, 0)
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/** Loads a portrait photo and samples it into the hybrid cloud. */
export async function loadPortrait(url: string, options: PortraitOptions): Promise<Portrait> {
  return samplePortrait(await loadImagePixels(url), options)
}
