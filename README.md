# 33 RECIPE

**Personal Recipe Studio** — персональное веб-приложение для создания, оформления, хранения и экспорта кулинарных рецептов. Сейчас реализован только **Phase 01: Foundation**: стартовый экран и техническая основа. Редактор и данные рецептов пока отсутствуют.

## Стек и требования

React 19, TypeScript, Vite, Tailwind CSS, подготовленная конфигурация shadcn/ui и Lucide React. Нужны Node.js 24 LTS и npm 11. Версия Node указана в `.nvmrc`.

## Локальный запуск

```bash
npm ci
npm run dev
```

Откройте адрес, который напечатает Vite (обычно `http://localhost:5173`).

## Команды

| Команда                | Назначение                                   |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Сервер разработки                            |
| `npm run build`        | Проверка типов и production-сборка в `dist/` |
| `npm run preview`      | Локальный просмотр сборки                    |
| `npm run lint`         | ESLint                                       |
| `npm run typecheck`    | TypeScript strict check                      |
| `npm run format`       | Форматирование Prettier                      |
| `npm run format:check` | Проверка форматирования                      |
| `npm run test`         | Vitest в режиме наблюдения                   |
| `npm run test:run`     | Однократный прогон Vitest                    |

Перед отправкой изменений запустите `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run test:run` и `npm run build`. В CI используется `npm ci`.

## Развёртывание

Планируется GitHub → Vercel: Vite, `npm run build`, `dist`, `npm ci`, production из `main`, preview из рабочих веток. Фактический статус подключения и ручные шаги указаны в [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Слияние PR в `main` выполняется только после одобрения владельца.

Подробнее: [концепция](docs/PROJECT_BRIEF.md), [дорожная карта](docs/ROADMAP.md), [архитектура](docs/ARCHITECTURE.md).
