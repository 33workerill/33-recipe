# Развёртывание GitHub → Vercel

По состоянию на 26.10.2026 проект Vercel `33-recipe` создан и связан с репозиторием `33workerill/33-recipe` через GitHub Integration. Владелец выбрал публичную видимость репозитория. Production Branch Tracking установлен на `main`, Preview — на остальные Git-ветки. Ссылки на развёртывания публикуются только после фактической проверки.

## Планируемая конфигурация

- Репозиторий: `33-recipe`, предпочтительно private.
- Production branch: `main`. Ветка `chore/phase-01-foundation` и PR дают Preview Deployment.
- Framework Preset: Vite. Install Command: `npm ci`. Build Command: `npm run build`. Output Directory: `dist`.
- Node.js: 24 LTS. Секреты и переменные окружения не требуются.

## Подключение

1. Создать private-репозиторий GitHub и отправить `main` и рабочую ветку.
2. Создать PR в `main`, дождаться успешного CI.
3. В Vercel выбрать **Add New Project → Import Git Repository**, выбрать `33-recipe` и проверить настройки выше.
4. Проверить Preview URL из Vercel/PR: открывается стартовая страница, текст читается на мобильной ширине, нет ошибок загрузки.
5. По одобрению владельца слить PR. Vercel соберёт production из `main`; проверить фактический URL и статус Ready.

Для будущих PR включить защиту `main` с обязательной проверкой `quality` в настройках GitHub Rulesets/Branch protection, если тариф и права позволяют. Публичный URL Vercel может быть доступен всем даже при private-репозитории; перед публикацией проверить Deployment Protection и не размещать персональные данные.

Фактические ссылки и статус текущего развёртывания фиксируются в отчёте по Phase 01, а не предполагаются из этой инструкции.
