import {
  createCookingStep,
  createEmptyRecipe,
  createIngredient,
  createIngredientGroup,
} from '@/features/recipes/model'

export const DEMO_RECIPE_ID = 'f7700000-0000-4000-8000-000000000001'

function demoId(number: number) {
  return `f7700000-0000-4000-8000-${String(number).padStart(12, '0')}`
}

export function createDemoRecipe() {
  const recipe = createEmptyRecipe({ id: DEMO_RECIPE_ID })
  recipe.title = 'Пицца Маргарита — ТЕСТ'
  recipe.description =
    'Классическая итальянская пицца с томатами, моцареллой и базиликом'
  recipe.category = 'Выпечка'
  recipe.tags = ['пицца', 'итальянская кухня', 'тест']
  recipe.servings = 3
  recipe.preparationTimeMinutes = 90
  recipe.cookingTimeMinutes = 12
  recipe.difficulty = 'medium'
  recipe.ingredientGroups = [
    createIngredientGroup({
      id: demoId(2),
      title: 'Тесто',
      ingredients: [
        createIngredient({
          id: demoId(3),
          name: 'Мука',
          amount: 500,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(4),
          name: 'Вода',
          amount: 325,
          unit: { kind: 'standard', code: 'ml' },
        }),
        createIngredient({
          id: demoId(5),
          name: 'Соль',
          amount: 12,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(6),
          name: 'Сухие дрожжи',
          amount: 3,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(7),
          name: 'Оливковое масло',
          amount: 15,
          unit: { kind: 'standard', code: 'ml' },
        }),
      ],
    }),
    createIngredientGroup({
      id: demoId(8),
      title: 'Начинка',
      ingredients: [
        createIngredient({
          id: demoId(9),
          name: 'Моцарелла',
          amount: 250,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(10),
          name: 'Томатный соус',
          amount: 180,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(11),
          name: 'Базилик',
          amount: 10,
          unit: { kind: 'standard', code: 'g' },
        }),
        createIngredient({
          id: demoId(12),
          name: 'Оливковое масло',
          amount: 15,
          unit: { kind: 'standard', code: 'ml' },
        }),
      ],
    }),
  ]
  recipe.steps = [
    createCookingStep({
      id: demoId(13),
      title: 'Замесить тесто',
      durationMinutes: 15,
      instruction:
        'Смешайте муку с сухими дрожжами. Влейте воду комнатной температуры и перемешайте до увлажнения всей муки. Добавьте соль и оливковое масло, затем вымешивайте 8–10 минут, пока тесто не станет гладким, эластичным и почти перестанет липнуть к рукам.',
    }),
    createCookingStep({
      id: demoId(14),
      title: 'Дать тесту отдохнуть',
      durationMinutes: 60,
      instruction:
        'Сформируйте шар, положите его в слегка смазанную миску и накройте. Оставьте в тёплом месте примерно на час, пока тесто заметно не увеличится в объёме. Если в комнате прохладно, дайте ему больше времени и ориентируйтесь на подъём, а не только на часы.',
      note: 'Накройте миску крышкой или влажным полотенцем, чтобы поверхность не подсохла.',
    }),
    createCookingStep({
      id: demoId(15),
      title: 'Сформировать шарики',
      durationMinutes: 10,
      instruction:
        'Переложите поднявшееся тесто на слегка припылённую мукой поверхность и аккуратно выпустите крупные пузыри. Разделите на три равные части, подтяните края каждой заготовки к центру и скатайте гладкие шарики. Накройте их и оставьте расслабиться перед формированием основы.',
    }),
    createCookingStep({
      id: demoId(16),
      title: 'Растянуть основу',
      durationMinutes: 5,
      instruction:
        'Положите один шарик на присыпанную мукой поверхность. Надавливая подушечками пальцев от центра к краю, растяните тесто в круг, сохраняя чуть более толстый бортик. Осторожно растягивайте основу на костяшках пальцев; не используйте скалку, чтобы сохранить воздушные пузырьки.',
    }),
    createCookingStep({
      id: demoId(17),
      title: 'Добавить начинку',
      durationMinutes: 3,
      instruction:
        'Распределите по центру тонкий слой томатного соуса, оставляя свободный край. Разложите кусочки хорошо обсушенной моцареллы и сбрызните небольшим количеством оливкового масла. Свежий базилик добавьте после выпекания, чтобы сохранить его аромат и цвет.',
    }),
    createCookingStep({
      id: demoId(18),
      title: 'Выпечь пиццу',
      durationMinutes: 12,
      temperatureCelsius: 250,
      instruction:
        'Заранее разогрейте духовку до 250 °C вместе с камнем или перевёрнутым противнем. Переложите пиццу на горячую поверхность и выпекайте 8–12 минут, пока бортик не подрумянится, а сыр не расплавится и не начнёт пузыриться. Добавьте базилик, дайте пицце постоять минуту и подавайте горячей.',
      note: 'Время зависит от духовки и толщины основы; следите за цветом бортика.',
    }),
  ]
  recipe.nutrition = {
    basis: 'per_serving',
    calories: 780,
    protein: 28,
    fat: 24,
    carbohydrates: 112,
  }
  recipe.tips =
    'Для более выразительного вкуса используйте хорошо разогретый камень или стальной лист и не перегружайте основу соусом. Моцареллу заранее обсушите, иначе лишняя влага помешает корочке стать хрустящей. Перед посадкой в духовку слегка припылите лопату манкой — так пицца легче соскользнёт на горячую поверхность.'
  recipe.notes =
    'Тестовая демонстрационная запись для сравнения стилей, пропорций макетов, длинных текстов и переноса содержимого на разворот. КБЖУ указаны приблизительно и не предназначены для медицинских или диетологических расчётов. Из этого количества получается три индивидуальные пиццы; тесто можно приготовить заранее и оставить медленно подходить в холодильнике.'
  return recipe
}
