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
| PHP | 8.2 + Composer |
| Go | 1.24.5 |
| OpenCode | latest |

### Утилиты
git, curl, wget, jq, ripgrep, sqlite3, htop, nano, unzip, gcc, g++, make, mariadb-client

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

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `OPENCLAW_API_KEY` | API ключ OpenClaw |
| `OPENCODE_API_KEY` | API ключ OpenCode |

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Нет доступа к проектам | Проверить пути монтирования в `docker-compose.yml` |
| Контейнер не стартует | `docker compose logs agents` |
