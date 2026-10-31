import { type Portrait, type PortraitOptions, samplePortrait } from './sample.ts'

/** Local-only placeholder photo (see README); replaced by a licensed one before publishing. */
export const PORTRAIT_URL = '/cr7_portrait.png'

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

/** Loads the portrait photo and samples it into the hybrid cloud. */
export async function loadPortrait(options: PortraitOptions, url = PORTRAIT_URL): Promise<Portrait> {
  return samplePortrait(await loadImagePixels(url), options)
}
