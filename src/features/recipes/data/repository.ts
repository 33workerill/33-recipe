import {
  deserializeRecipe,
  serializeRecipe,
  type Recipe,
} from '@/features/recipes/model'

const STORE = 'recipes'
const IMAGE_STORE = 'images'

type RecipeRecord = { id: string; revision: number; json: string }
export type StoredRecipe = { recipe: Recipe; revision: number }
export type StoredImage = {
  id: string
  recipeId: string
  blob: Blob
  fingerprint?: string
}

export class RecipeConflictError extends Error {
  constructor(
    message = 'Рецепт изменён в другой вкладке. Перезагрузите страницу после сохранения резервной копии.',
  ) {
    super(message)
    this.name = 'RecipeConflictError'
  }
}

function decode(record: RecipeRecord): StoredRecipe {
  return { recipe: deserializeRecipe(record.json), revision: record.revision }
}

function sameContent(left: Recipe, right: Recipe): boolean {
  return (
    JSON.stringify({ ...left, updatedAt: '' }) ===
    JSON.stringify({ ...right, updatedAt: '' })
  )
}

function nextTimestamp(
  now: Date,
  createdAt: string,
  previous?: string,
): string {
  const minimum = previous ? Date.parse(previous) + 1 : Date.parse(createdAt)
  return new Date(Math.max(now.getTime(), minimum)).toISOString()
}

export class RecipeRepository {
  constructor(
    private readonly factory: IDBFactory = indexedDB,
    private readonly name = '33-recipe',
    private readonly now: () => Date = () => new Date(),
  ) {}

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.factory.open(this.name, 2)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE))
          db.createObjectStore(STORE, { keyPath: 'id' })
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          const images = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' })
          images.createIndex('recipeId', 'recipeId', { unique: false })
        }
      }
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => db.close()
        resolve(db)
      }
      request.onerror = () =>
        reject(request.error ?? new Error('Не удалось открыть локальную базу.'))
      request.onblocked = () =>
        reject(
          new Error('Закройте другие вкладки приложения и повторите попытку.'),
        )
    })
  }

  async get(id: string): Promise<StoredRecipe | null> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(id)
      let record: RecipeRecord | undefined
      request.onsuccess = () => {
        record = request.result as RecipeRecord | undefined
      }
      tx.oncomplete = () => {
        db.close()
        try {
          resolve(record ? decode(record) : null)
        } catch (error) {
          reject(error)
        }
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось прочитать рецепт.'))
      }
    })
  }

  async list(): Promise<StoredRecipe[]> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).getAll()
      let records: RecipeRecord[] = []
      request.onsuccess = () => {
        records = request.result as RecipeRecord[]
      }
      tx.oncomplete = () => {
        db.close()
        try {
          resolve(
            records
              .map(decode)
              .sort(
                (a, b) =>
                  b.recipe.updatedAt.localeCompare(a.recipe.updatedAt) ||
                  a.recipe.id.localeCompare(b.recipe.id),
              ),
          )
        } catch (error) {
          reject(error)
        }
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось прочитать библиотеку.'))
      }
    })
  }

  async save(
    recipe: Recipe,
    expectedRevision: number | null,
  ): Promise<StoredRecipe> {
    const validated = deserializeRecipe(serializeRecipe(recipe))
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.get(validated.id)
      let result: StoredRecipe | undefined
      let conflict: Error | undefined
      request.onsuccess = () => {
        const current = request.result as RecipeRecord | undefined
        if ((current?.revision ?? null) !== expectedRevision) {
          conflict = new RecipeConflictError()
          return
        }
        if (current) {
          const stored = decode(current)
          if (sameContent(stored.recipe, validated)) {
            result = stored
            return
          }
        }
        const next: Recipe = {
          ...validated,
          updatedAt: nextTimestamp(
            this.now(),
            validated.createdAt,
            current && decode(current).recipe.updatedAt,
          ),
        }
        const record: RecipeRecord = {
          id: next.id,
          revision: (current?.revision ?? 0) + 1,
          json: serializeRecipe(next),
        }
        result = decode(record)
        store.put(record)
      }
      tx.oncomplete = () => {
        db.close()
        if (conflict) reject(conflict)
        else if (result) resolve(result)
        else reject(new Error('Рецепт не был сохранён.'))
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось сохранить рецепт.'))
      }
    })
  }

  async delete(id: string, expectedRevision: number): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, IMAGE_STORE], 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.get(id)
      let conflict = false
      request.onsuccess = () => {
        const current = request.result as RecipeRecord | undefined
        if (!current || current.revision !== expectedRevision) conflict = true
        else {
          store.delete(id)
          const images = tx.objectStore(IMAGE_STORE)
          const request = images
            .index('recipeId')
            .openKeyCursor(IDBKeyRange.only(id))
          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              images.delete(cursor.primaryKey)
              cursor.continue()
            }
          }
        }
      }
      tx.oncomplete = () => {
        db.close()
        if (conflict) reject(new RecipeConflictError())
        else resolve()
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось удалить рецепт.'))
      }
    })
  }

  async getImage(id: string): Promise<StoredImage | null> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly')
      const request = tx.objectStore(IMAGE_STORE).get(id)
      let image: StoredImage | undefined
      request.onsuccess = () => {
        image = request.result as StoredImage | undefined
      }
      tx.oncomplete = () => {
        db.close()
        resolve(image ?? null)
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось прочитать фотографию.'))
      }
    })
  }

  async findImageByFingerprint(
    recipeId: string,
    fingerprint: string,
  ): Promise<StoredImage | null> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly')
      const request = tx
        .objectStore(IMAGE_STORE)
        .index('recipeId')
        .getAll(recipeId)
      let image: StoredImage | undefined
      request.onsuccess = () => {
        image = (request.result as StoredImage[]).find(
          (entry) => entry.fingerprint === fingerprint,
        )
      }
      tx.oncomplete = () => {
        db.close()
        resolve(image ?? null)
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось проверить повтор фото.'))
      }
    })
  }

  async saveImage(
    recipe: Recipe,
    expectedRevision: number,
    image: StoredImage,
    deleteImageIds: string[] = [],
  ): Promise<StoredRecipe> {
    const validated = deserializeRecipe(serializeRecipe(recipe))
    if (
      image.recipeId !== validated.id ||
      !validated.assets.some((a) => a.id === image.id)
    )
      throw new Error('Фотография не связана с этим рецептом.')
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, IMAGE_STORE], 'readwrite')
      const recipes = tx.objectStore(STORE)
      const request = recipes.get(validated.id)
      let result: StoredRecipe | undefined
      let conflict: Error | undefined
      request.onsuccess = () => {
        const current = request.result as RecipeRecord | undefined
        if ((current?.revision ?? null) !== expectedRevision) {
          conflict = new RecipeConflictError()
          tx.abort()
          return
        }
        const next: Recipe = {
          ...validated,
          updatedAt: nextTimestamp(
            this.now(),
            validated.createdAt,
            current && decode(current).recipe.updatedAt,
          ),
        }
        const record: RecipeRecord = {
          id: next.id,
          revision: (current?.revision ?? 0) + 1,
          json: serializeRecipe(next),
        }
        recipes.put(record)
        const images = tx.objectStore(IMAGE_STORE)
        const existingImageRequest = images.get(image.id)
        existingImageRequest.onsuccess = () => {
          const existingImage = existingImageRequest.result as
            StoredImage | undefined
          if (existingImage && existingImage.recipeId !== validated.id) {
            conflict = new RecipeConflictError(
              'ID фотографии уже используется другим рецептом.',
            )
            tx.abort()
            return
          }
          images.put(image)
        }
        deleteImageIds
          .filter((id) => id !== image.id)
          .forEach((id) => {
            const previous = images.get(id)
            previous.onsuccess = () => {
              if (
                (previous.result as StoredImage | undefined)?.recipeId ===
                validated.id
              )
                images.delete(id)
            }
          })
        result = decode(record)
      }
      tx.oncomplete = () => {
        db.close()
        if (result) resolve(result)
        else reject(new Error('Фотография не была сохранена.'))
      }
      tx.onabort = () => {
        db.close()
        reject(
          conflict ?? tx.error ?? new Error('Не удалось сохранить фотографию.'),
        )
      }
    })
  }

  async deleteImage(
    recipe: Recipe,
    expectedRevision: number,
    imageId: string,
  ): Promise<StoredRecipe> {
    return this.deleteImages(recipe, expectedRevision, [imageId])
  }

  async deleteImages(
    recipe: Recipe,
    expectedRevision: number,
    imageIds: string[],
  ): Promise<StoredRecipe> {
    const validated = deserializeRecipe(serializeRecipe(recipe))
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, IMAGE_STORE], 'readwrite')
      const recipes = tx.objectStore(STORE)
      const request = recipes.get(validated.id)
      let result: StoredRecipe | undefined
      let conflict: Error | undefined
      request.onsuccess = () => {
        const current = request.result as RecipeRecord | undefined
        if ((current?.revision ?? null) !== expectedRevision) {
          conflict = new RecipeConflictError()
          tx.abort()
          return
        }
        const next: Recipe = {
          ...validated,
          updatedAt: nextTimestamp(
            this.now(),
            validated.createdAt,
            current && decode(current).recipe.updatedAt,
          ),
        }
        const record: RecipeRecord = {
          id: next.id,
          revision: (current?.revision ?? 0) + 1,
          json: serializeRecipe(next),
        }
        recipes.put(record)
        const images = tx.objectStore(IMAGE_STORE)
        imageIds.forEach((imageId) => {
          const imageRequest = images.get(imageId)
          imageRequest.onsuccess = () => {
            if (
              (imageRequest.result as StoredImage | undefined)?.recipeId ===
              validated.id
            )
              images.delete(imageId)
          }
        })
        result = decode(record)
      }
      tx.oncomplete = () => {
        db.close()
        if (result) resolve(result)
        else reject(new Error('Фотография не была удалена.'))
      }
      tx.onabort = () => {
        db.close()
        reject(
          conflict ?? tx.error ?? new Error('Не удалось удалить фотографию.'),
        )
      }
    })
  }

  async duplicateWithImages(
    source: Recipe,
    duplicate: Recipe,
  ): Promise<StoredRecipe> {
    const validated = deserializeRecipe(serializeRecipe(duplicate))
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, IMAGE_STORE], 'readwrite')
      const recipes = tx.objectStore(STORE)
      const images = tx.objectStore(IMAGE_STORE)
      const sourceRequest = images.index('recipeId').getAll(source.id)
      let result: StoredRecipe | undefined
      sourceRequest.onsuccess = () => {
        const originals = sourceRequest.result as StoredImage[]
        for (const original of originals) {
          const asset = source.assets.find((item) => item.id === original.id)
          if (!asset) continue
          const sourceIndex = source.assets.findIndex(
            (item) => item.id === asset.id,
          )
          const replacement = validated.assets[sourceIndex]
          if (replacement) {
            images.add({
              ...original,
              id: replacement.id,
              recipeId: validated.id,
              blob: original.blob.slice(
                0,
                original.blob.size,
                original.blob.type,
              ),
            } satisfies StoredImage)
          }
        }
        const record: RecipeRecord = {
          id: validated.id,
          revision: 1,
          json: serializeRecipe(validated),
        }
        recipes.add(record)
        result = decode(record)
      }
      tx.oncomplete = () => {
        db.close()
        if (result) resolve(result)
        else reject(new Error('Копия рецепта не создана.'))
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Не удалось скопировать фотографии.'))
      }
    })
  }

  async importAll(recipes: Recipe[]): Promise<void> {
    const validated = recipes.map((recipe) =>
      deserializeRecipe(serializeRecipe(recipe)),
    )
    const ids = validated.map((recipe) => recipe.id)
    if (new Set(ids).size !== ids.length)
      throw new RecipeConflictError('В копии повторяются ID рецептов.')
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.getAllKeys()
      let conflict: Error | undefined
      request.onsuccess = () => {
        const existing = new Set(request.result.map(String))
        if (ids.some((id) => existing.has(id))) {
          conflict = new RecipeConflictError(
            'Рецепт с таким ID уже есть. Импорт отменён без изменений.',
          )
          return
        }
        validated.forEach((recipe) =>
          store.add({
            id: recipe.id,
            revision: 1,
            json: serializeRecipe(recipe),
          } satisfies RecipeRecord),
        )
      }
      tx.oncomplete = () => {
        db.close()
        if (conflict) reject(conflict)
        else resolve()
      }
      tx.onabort = () => {
        db.close()
        reject(tx.error ?? new Error('Импорт не выполнен.'))
      }
    })
  }
}
