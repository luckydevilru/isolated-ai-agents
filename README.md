# AI Agents Hub

Docker-окружение для запуска AI-агентов (OpenCode) с доступом к проектам.

## Быстрый старт

### Требования
- Docker Desktop 4.0+ (macOS/Windows) или Docker Engine 20.10+ (Linux)
- Docker Compose v2

### Установка

1. Скопируйте папку на ноутбук
2. Создайте `.env`:
   ```bash
   cp .env.example .env
   ```
3. Заполните API ключи в `.env`
4. Запустите:
   ```bash
   docker compose up -d
   ```

## Стек

| Компонент | Версия |
|-----------|--------|
| Node.js | 22 (Bookworm) |
| Python | 3.11 |
| PHP | 8.4 + Composer (Sury) |
| Go | 1.24.5 |
| OpenCode | latest |
| OpenChamber | latest |

### Утилиты
git, curl, wget, jq, ripgrep, sqlite3, htop, nano, unzip, gcc, g++, make, mariadb-client

## Веб-интерфейс (OpenChamber)

OpenChamber — веб-интерфейс для управления сессиями OpenCode, доступен на `http://localhost:3000`.

Заполните `.env`:
```
OPENCHAMBER_UI_PASSWORD=ваш-пароль
```

OpenChamber запускается **автоматически** при старте контейнера (entrypoint поднимает его в фоне как пользователь `node`/uid 1000 и чинит владельца `$HOME`-томов). Достаточно:
```bash
docker compose up -d --build
# затем открыть http://localhost:3000
```

Управление:
```bash
docker exec -it ai-agents openchamber status   # статус
docker exec -it ai-agents openchamber logs     # логи
docker exec -it ai-agents openchamber stop     # остановить
docker exec -it ai-agents openchamber update   # обновить
```

> Контейнер стартует от root только для того, чтобы entrypoint исправил владельца root-заселённых `$HOME`-томов (`agent-config`, `agent-opencode`, `agent-openchamber`), после чего все процессы работают от `node` (uid 1000 = `iboss` на хосте). Файлы на хостовых bind-монтированиях (`/run/media/iboss/...`) не затрагиваются — права хост-пользователя `iboss` не теряются.

Интерфейс слушает только `localhost` хоста (`network_mode: host`). Для доступа с других устройств добавьте `--lan` (только в доверенной сети).

## Одноразовый фикс апгрейда (≤ 1.24.0)

`@openchamber/web` 1.24.0 сломан в npm (зависит от отсутствующего `@openchamber/sdk@1.23.1`), поэтому сборка образа сейчас упадёт с `ETARGET` — пересобирайте только после выхода исправленной версии (в образе ставится `latest` без пина). У 1.23.x есть баг: кнопка «Update» в UI зависает с `ERR_TIMED_OUT`, если загрузка бинарника OpenCode подвисает.

Исправляется ручным патчем `agents/patch-openchamber.js` — он добавляет таймаут 120с к апгрейд-запросу. Патч **сознательно не зашит в контейнер** (это одноразовый фикс) и применяется только к `@openchamber/web ≤ 1.24.0` — на версии выше он ничего не делает и не трогает файлы.

Применить:
```bash
docker exec -it ai-agents node /var/www/docker/ai/agents/patch-openchamber.js
```

Проверить статус (1 = применён, 0 = нет):
```bash
docker exec -it ai-agents sh -c "grep -c 'openchamber-patch:' /usr/local/lib/node_modules/@openchamber/web/server/lib/opencode/routes.js"
```

Откатить из бэкапа `routes.js.bak`:
```bash
docker exec -it ai-agents sh -c "mv /usr/local/lib/node_modules/@openchamber/web/server/lib/opencode/routes.js.bak /usr/local/lib/node_modules/@openchamber/web/server/lib/opencode/routes.js"
```

> Файлы `/usr/local/lib/node_modules` — не volume: патч живёт в слое контейнера и сбрасывается при пересборке (`docker compose up -d --build`). После `openchamber update`, переустанавливающего `@openchamber/web`, патч тоже пропадает — если ещё нужен, примените снова.

## Команды

```bash
docker compose up -d          # Запуск
docker compose down           # Остановка
docker compose logs -f        # Логи
docker compose restart        # Перезапуск
docker compose ps             # Статус
docker compose up -d --build  # Пересборка
```

## Монтируемые проекты

| Хост | Контейнер |
|------|-----------|
| `/run/media/iboss/udata/dev/laravel/sites` | `/var/www` |
| `/run/media/iboss/udata/dev/php/bx24.loc` | `/var/www/bx24.loc/` |
| `/run/media/iboss/udata/dev/php/bxapps` | `/var/www/bxapps/` |
| `/run/media/iboss/udata/dev/php/line24` | `/var/www/line24/` |
| `/run/media/iboss/udata/dev/docker/` | `/var/www/docker` |

Сетевой режим: `host` (контейнер использует сеть хоста).

## Права файлов

Контейнер стартует от `user: "0:0"`, но entrypoint переключает процессы на `node` (uid 1000 = `iboss` на хосте). Все файлы, создаваемые в контейнере, автоматически получают владельца `iboss:iboss`.

Если после пересборки права на старых файлах `root:root`:
```bash
sudo chown -R iboss:iboss /run/media/iboss/udata/dev/laravel/sites/
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `OPENCLAW_API_KEY` | API ключ OpenClaw |
| `OPENCODE_API_KEY` | API ключ OpenCode |
| `OPENCHAMBER_UI_PASSWORD` | Пароль на веб-интерфейс OpenChamber |

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Нет доступа к проектам | Проверить пути монтирования в `docker-compose.yml` |
| Контейнер не стартует | `docker compose logs agents` |
| Файлы от root | Проверить `user` в `docker-compose.yml`, пересобрать |
