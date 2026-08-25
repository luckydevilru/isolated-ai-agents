# AI Agents Hub

Docker-окружение для запуска AI-агентов (MiMo + OpenClaw) с веб-панелью управления.

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
3. Заполните API ключи в `.env` (если есть)
4. Запустите:
   ```bash
   docker compose up -d
   ```

### Порты
| Сервис | Порт |
|--------|------|
| Агенты | 4080 |

## Команды

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Статус
docker compose ps

# Пересборка
docker compose up -d --build
```
 

## Доступ к проектам

Проекты монтируются:
- `/run/media/iboss/udata/dev/chatter.loc` → `/var/www/chatter.loc`
- `/run/media/iboss/udata/dev/lotmonitor.loc` → `/var/www/lotmonitor.loc`

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Порт занят | Изменить порт в `.env` |
| Нет доступа к проектам | Проверить пути в `docker-compose.yml` |
