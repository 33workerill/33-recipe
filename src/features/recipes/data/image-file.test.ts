import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  processImageFile,
  validateImageFile,
} from '@/features/recipes/data/image-file'

afterEach(() => vi.restoreAllMocks())

describe('image file processing', () => {
  it('keeps orientation, scales without cropping, and updates JPEG metadata', async () => {
    const bitmap = {
      width: 4000,
      height: 2000,
      close: vi.fn(),
    } as unknown as ImageBitmap
    const createBitmap = vi.fn(
      async (_file: Blob, options?: ImageBitmapOptions) => {
        expect(options?.imageOrientation).toBe('from-image')
        return bitmap
      },
    )
    vi.stubGlobal('createImageBitmap', createBitmap)
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback, type) => {
        callback(new Blob(['resized'], { type }))
      },
    )

    const result = await processImageFile(
      new File(['source'], 'dish.webp', { type: 'image/webp' }),
    )
    expect(result).toMatchObject({
      filename: 'dish.jpg',
      mimeType: 'image/jpeg',
      width: 2400,
      height: 1200,
    })
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 2400, 1200)
    expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(bitmap.close).toHaveBeenCalledOnce()
  })

  it('rejects formats outside the accepted image inputs', () => {
    expect(() =>
      validateImageFile(
        new File(['x'], 'notes.svg', { type: 'image/svg+xml' }),
      ),
    ).toThrow('JPEG, PNG или WebP')
  })
})
