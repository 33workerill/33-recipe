import {
  deserializeRecipe,
  serializeRecipe,
  type Recipe,
} from '@/features/recipes/model'

const STORE = 'recipes'

type RecipeRecord = { id: string; revision: number; json: string }
export type StoredRecipe = { recipe: Recipe; revision: number }

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
      const request = this.factory.open(this.name, 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
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
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.get(id)
      let conflict = false
      request.onsuccess = () => {
        const current = request.result as RecipeRecord | undefined
        if (!current || current.revision !== expectedRevision) conflict = true
        else store.delete(id)
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
