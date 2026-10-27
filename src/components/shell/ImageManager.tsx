import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Recipe } from '@/features/recipes/model'

type Props = {
  recipe: Recipe
  urls: Record<string, string>
  onAdd: (
    file: File,
    role: 'cover' | 'gallery',
    replaceId?: string,
  ) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onAltChange: (id: string, value: string) => void
  onReorder: (id: string, offset: -1 | 1) => void
}

export function ImageManager({
  recipe,
  urls,
  onAdd,
  onRemove,
  onAltChange,
  onReorder,
}: Props) {
  const coverInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const cover = recipe.assets.find((asset) => asset.role === 'cover')
  const gallery = recipe.assets.filter((asset) => asset.role === 'gallery')

  const choose = async (file: File | undefined, role: 'cover' | 'gallery') => {
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      await onAdd(file, role, role === 'cover' ? cover?.id : undefined)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось добавить фотографию.',
      )
    } finally {
      setBusy(false)
      if (coverInput.current) coverInput.current.value = ''
      if (galleryInput.current) galleryInput.current.value = ''
    }
  }

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Удалить фотографию «${name}»?`)) return
    try {
      await onRemove(id)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось удалить фотографию.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Обложка</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            JPEG, PNG или WebP · до 20 МБ
          </p>
        </div>
        {cover && urls[cover.id] ? (
          <img
            src={urls[cover.id]}
            alt={cover.altText || 'Обложка рецепта'}
            className="max-h-72 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground">
            Добавьте фотографию обложки
          </div>
        )}
        {cover && (
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="cover-alt">Описание фотографии</Label>
              <Input
                id="cover-alt"
                value={cover.altText}
                onChange={(event) => onAltChange(cover.id, event.target.value)}
                placeholder="Например, пирог на деревянном столе"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0"
              aria-label="Удалить обложку"
              onClick={() => void remove(cover.id, cover.filename)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
        <input
          ref={coverInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,.heic,.heif"
          className="sr-only"
          aria-label="Файл обложки"
          onChange={(event) => void choose(event.target.files?.[0], 'cover')}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => coverInput.current?.click()}
        >
          <ImagePlus />
          {cover ? 'Заменить обложку' : 'Добавить обложку'}
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Галерея</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Дополнительные фотографии рецепта
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => galleryInput.current?.click()}
          >
            <ImagePlus />
            Добавить
          </Button>
        </div>
        <input
          ref={galleryInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.heic,.heif"
          className="sr-only"
          aria-label="Фотографии галереи"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            void (async () => {
              for (const file of files) await choose(file, 'gallery')
            })()
          }}
        />
        {gallery.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Галерея пока пуста.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((asset, index) => (
              <li
                key={asset.id}
                className="min-w-0 overflow-hidden rounded-xl border border-border bg-background"
              >
                {urls[asset.id] ? (
                  <img
                    src={urls[asset.id]}
                    alt={asset.altText || 'Фотография рецепта'}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                    Файл недоступен
                  </div>
                )}
                <div className="p-2">
                  <Input
                    aria-label="Описание фотографии"
                    value={asset.altText}
                    onChange={(event) =>
                      onAltChange(asset.id, event.target.value)
                    }
                    placeholder="Описание"
                  />
                  <div className="mt-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      aria-label={`Переместить ${asset.filename} выше`}
                      onClick={() => onReorder(asset.id, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === gallery.length - 1}
                      aria-label={`Переместить ${asset.filename} ниже`}
                      onClick={() => onReorder(asset.id, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => void remove(asset.id, asset.filename)}
                  >
                    <Trash2 />
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  )
}
