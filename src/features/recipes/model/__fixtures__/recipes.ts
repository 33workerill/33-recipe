import {
  createCookingStep,
  createEmptyRecipe,
  createIngredient,
  createIngredientGroup,
} from '@/features/recipes/model/factories'
import type { Recipe } from '@/features/recipes/model/types'

const id = (number: number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`
const fixedTime = () => new Date('2026-10-27T09:00:00.000Z')

export const emptyRecipe: Recipe = createEmptyRecipe({
  id: id(1),
  now: fixedTime,
})

const pizzaAssetId = id(30)
export const pizzaRecipe: Recipe = {
  ...createEmptyRecipe({ id: id(2), now: fixedTime }),
  title: 'Итальянская пицца',
  description: 'Тонкое тесто, томаты и моцарелла.',
  category: 'Основное блюдо',
  tags: ['пицца', 'итальянская кухня'],
  servings: 4,
  preparationTimeMinutes: 75,
  cookingTimeMinutes: 12,
  difficulty: 'medium',
  ingredientGroups: [
    createIngredientGroup({
      id: id(3),
      title: 'Тесто',
      ingredients: [
        createIngredient({
          id: id(4),
          name: 'Мука',
          amount: 400,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: id(5),
          name: 'Вода',
          amount: 260,
          unit: { kind: 'standard', code: 'ml' },
        }),
        createIngredient({
          id: id(6),
          name: 'Соль',
          amount: 8,
          unit: { kind: 'standard', code: 'g' },
        }),
      ],
    }),
    createIngredientGroup({
      id: id(7),
      title: 'Начинка',
      ingredients: [
        createIngredient({
          id: id(8),
          name: 'Моцарелла',
          amount: 150,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: id(9),
          name: 'Томаты',
          amount: 100,
          unit: { kind: 'standard', code: 'g' },
        }),
      ],
    }),
  ],
  steps: [
    createCookingStep({
      id: id(10),
      title: 'Подготовить тесто',
      instruction: 'Смешайте муку, воду и соль.\nВымесите до гладкости.',
      durationMinutes: 15,
    }),
    createCookingStep({
      id: id(11),
      title: 'Добавить начинку',
      instruction: 'Распределите томаты и моцареллу по основе.',
      assetIds: [pizzaAssetId],
    }),
    createCookingStep({
      id: id(12),
      title: 'Выпекать',
      instruction: 'Выпекайте до румяного края.',
      durationMinutes: 12,
      temperatureCelsius: 250,
    }),
  ],
  assets: [
    {
      id: pizzaAssetId,
      filename: 'pizza-step.webp',
      mimeType: 'image/webp',
      width: 1600,
      height: 1200,
      altText: 'Пицца перед выпеканием',
      role: 'step',
    },
  ],
  notes: 'Лучше готовить на заранее разогретом камне.',
  tips: 'Добавьте базилик после выпекания.',
  nutrition: {
    basis: 'per_serving',
    calories: 340,
    protein: 14.5,
    fat: 12.25,
    carbohydrates: 43,
  },
}

export const omeletRecipe: Recipe = {
  ...createEmptyRecipe({ id: id(20), now: fixedTime }),
  title: 'Простой омлет',
  ingredientGroups: [
    createIngredientGroup({
      id: id(21),
      ingredients: [
        createIngredient({
          id: id(22),
          name: 'Яйца',
          amount: 2,
          unit: { kind: 'standard', code: 'pcs' },
        }),
        createIngredient({
          id: id(23),
          name: 'Молоко',
          amount: 2.25,
          unit: { kind: 'standard', code: 'tbsp' },
        }),
      ],
    }),
  ],
  steps: [
    createCookingStep({
      id: id(24),
      instruction:
        'Взбейте яйца с молоком. Вылейте на сковороду и готовьте до плотности.',
    }),
  ],
}
