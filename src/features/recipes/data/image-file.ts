export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_EDGE = 2400

export type ProcessedImage = {
  blob: Blob
  filename: string
  mimeType: string
  width: number
  height: number
  fingerprint: string
}

async function fingerprint(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function validateImageFile(file: File): void {
  const heic = /heic|heif/i.test(`${file.type} ${file.name}`)
  if (!ACCEPTED_TYPES.has(file.type) && !heic)
    throw new Error('Выберите фотографию JPEG, PNG или WebP.')
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES)
    throw new Error('Размер фотографии должен быть не больше 20 МБ.')
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  validateImageFile(file)
  let bitmap: ImageBitmap | undefined
  try {
    if (typeof createImageBitmap !== 'function')
      throw new Error('Этот браузер не умеет безопасно обработать изображение.')
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Не удалось подготовить фотографию.')
    context.drawImage(bitmap, 0, 0, width, height)
    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error('Не удалось обработать фотографию.')),
        mimeType,
        mimeType === 'image/jpeg' ? 0.88 : undefined,
      )
    })
    const filename =
      file.name.replace(/\.[^.]+$/, '') +
      (mimeType === 'image/png' ? '.png' : '.jpg')
    return {
      blob,
      filename,
      mimeType: blob.type,
      width,
      height,
      fingerprint: await fingerprint(file),
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('HEIC/HEIF'))
      throw error
    const heic = /heic|heif/i.test(`${file.type} ${file.name}`)
    throw new Error(
      heic
        ? 'Этот браузер не умеет декодировать HEIC/HEIF. Сохраните фото как JPEG и повторите загрузку.'
        : 'Не удалось прочитать фотографию. Для iPhone попробуйте экспортировать её в JPEG.',
      { cause: error },
    )
  } finally {
    bitmap?.close()
  }
}
