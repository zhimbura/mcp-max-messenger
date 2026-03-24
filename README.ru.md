# mcp-max-messenger

[![npm version](https://badge.fury.io/js/%40woyax%2Fmcp-max-messenger.svg)](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
[![License: MIT + Commons Clause](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-blue.svg)](https://github.com/woyaxnini/mcp-max-messenger/blob/main/LICENSE)

**Первый MCP-сервер для мессенджера MAX** — национального мессенджера России от VK (75M+ пользователей).

Подключите AI-клиентов (Claude Desktop, Cursor, n8n и любое MCP-совместимое приложение) к MAX: отправляйте и читайте сообщения, управляйте чатами и участниками, отправляйте медиа, обрабатывайте нажатия кнопок, форматируйте HTML/Markdown — через открытый стандарт [Model Context Protocol](https://modelcontextprotocol.io).

**21 инструмент** с полным покрытием MAX Bot API.

---

## Зачем это нужно?

- 🇷🇺 Обязателен к предустановке на все смартфоны в России с сентября 2025
- 📱 75M+ зарегистрированных пользователей
- 🏢 Рекомендован Минцифры для госорганов и крупных компаний (ноябрь 2025)
- 🤖 Полноценный Bot API с официальными SDK: TypeScript, Python, Go, Java, PHP

---

## Быстрый старт

### Требования

- Node.js 18+
- Токен MAX-бота (создайте бота на [max.ru](https://max.ru))

### Локальный режим — для Claude Desktop / Cursor

Добавьте в конфиг Claude Desktop:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "max-messenger": {
      "command": "npx",
      "args": ["-y", "@woyax/mcp-max-messenger"],
      "env": {
        "MAX_TOKEN": "ВАШ_ТОКЕН_БОТА"
      }
    }
  }
}
```

Перезапустите Claude Desktop. Инструменты MAX появятся автоматически.

### Удалённый режим (HTTP) — для хостинга

```bash
MAX_TOKEN=ВАШ_ТОКЕН MCP_TRANSPORT=http MCP_PORT=3000 npx @woyax/mcp-max-messenger
```

Подключите любой MCP-клиент к `http://ваш-сервер:3000/mcp`.

---

## Доступные инструменты (21)

### Сообщения

| Инструмент | Описание |
|------------|----------|
| `get_messages` | Чтение сообщений из чата (по chat_id или message_ids) |
| `send_message` | Отправка сообщения: текст, HTML/Markdown, inline-клавиатура, медиавложения |
| `edit_message` | Редактирование текста и вложений |
| `delete_message` | Удаление сообщения |
| `pin_message` | Закрепить сообщение в чате |
| `unpin_message` | Открепить закреплённое сообщение |

### Медиа

| Инструмент | Описание |
|------------|----------|
| `send_media` | Загрузить и отправить фото, видео, аудио или файл по URL |
| `send_action` | Показать статус: «печатает», «отправляет фото/видео/аудио/файл», «прочитано» |

### Чаты

| Инструмент | Описание |
|------------|----------|
| `get_bot_info` | Информация о боте: имя, ID, username, описание |
| `get_chats` | Список групповых чатов бота |
| `get_chat` | Полная информация о чате: участники, закреплённое сообщение, владелец |
| `edit_chat` | Переименовать чат, сменить описание или иконку |

### Участники

| Инструмент | Описание |
|------------|----------|
| `get_chat_members` | Список участников чата с ролями |
| `get_admins` | Список администраторов с правами |
| `set_admin` | Назначить администратора |
| `remove_admin` | Снять права администратора |
| `add_members` | Добавить пользователей в групповой чат |
| `remove_member` | Удалить пользователя из группового чата |

### События

| Инструмент | Описание |
|------------|----------|
| `get_updates` | Входящие события: сообщения, нажатия кнопок, новые диалоги (long polling) |
| `answer_callback` | Ответ на нажатие inline-кнопки: уведомление или обновление сообщения |

### Кнопки (через attachments в send_message)

Поддерживаются 5 типов кнопок: `callback`, `link`, `message`, `request_contact`, `request_geo_location`.

---

## Примеры использования

После подключения к Claude Desktop используйте обычный язык:

> *«Отправь сообщение в чат 123456789: "Встреча через 10 минут"»*

> *«Отправь запрос на согласование с кнопками Согласовать / Отклонить в рабочий чат»*

> *«Покажи последние 10 сообщений из чата отдела продаж»*

> *«Отправь это фото в чат: https://example.com/image.jpg»*

> *«Кто участники группы "Разработка"? Назначь Алексея администратором.»*

> *«Проверь новые входящие сообщения и нажатия кнопок»*

---

## Конфигурация

### Переменные окружения

| Переменная | Обязательно | По умолчанию | Описание |
|-----------|-------------|--------------|----------|
| `MAX_TOKEN` | ✅ | — | Токен вашего MAX-бота |
| `MCP_TRANSPORT` | ❌ | `stdio` | Транспорт: `stdio` или `http` |
| `MCP_PORT` | ❌ | `3000` | Порт для HTTP-режима |

### Флаги командной строки

```bash
# Локальный режим (по умолчанию)
npx @woyax/mcp-max-messenger

# Удалённый HTTP-режим
npx @woyax/mcp-max-messenger --transport http --port 3000
```

---

## Архитектура

Два независимых слоя — инструменты работают одинаково в обоих режимах:

```
src/
├── core/               # Бизнес-логика — общая для обоих режимов
│   ├── max-client.ts   # HTTP-клиент MAX API
│   ├── types.ts        # TypeScript-типы MAX API
│   └── tools/
│       ├── bot.ts      # get_bot_info
│       ├── chats.ts    # get_chats, get_chat, edit_chat, send_action
│       ├── messages.ts # send/get/edit/delete/pin/unpin, send_media
│       ├── members.ts  # get_chat_members, get_admins, set/remove_admin, add/remove_members
│       └── updates.ts  # get_updates, answer_callback
├── transports/         # Транспортный слой — выбирается при запуске
│   ├── stdio.ts        # Локальный режим (Claude Desktop, Cursor)
│   └── http.ts         # Удалённый режим (Streamable HTTP)
└── index.ts            # Точка входа: выбор транспорта
```

---

## Особенности MAX API

- **Авторизация**: токен передаётся как `Authorization: <токен>` — **без слова `Bearer`**
- **Base URL**: `https://platform-api.max.ru`
- **Rate limit**: 30 запросов/сек
- **Групповые чаты**: `GET /chats` возвращает только групповые чаты
- **Личные сообщения**: доступны через `get_updates` — используйте полученный `chat_id` с любым стандартным инструментом
- **Загрузка медиа**: двухэтапный процесс (загрузка → отправка). Токены аудио/видео приходят на этапе загрузки, не при передаче файла
- **HTTP-транспорт**: Streamable HTTP (SSE устарел с MCP SDK 1.10.0)

### Известные проблемы MAX API

- `remove_admin` может вернуть `success: true`, не снимая права — подтверждённый баг на стороне MAX
- Кнопка `open_app` возвращает «Field 'webApp' cannot be null» — баг MAX API
- `add_members` может не сработать с ошибкой `add.participant.privacy`, если у пользователя включён безопасный режим

---

## Планы развития

- [ ] Тестирование HTTP-режима на VPS с интеграцией n8n
- [ ] Hosted MCP-сервис (подключение по URL, без локальной установки)
- [ ] Поддержка webhook для обработки событий в реальном времени
- [ ] Тестирование `answer_callback` через n8n webhook workflow

---

## Ссылки

- [Документация MAX Bot API](https://dev.max.ru/docs-api)
- [MAX OpenAPI Schema](https://github.com/max-messenger/max-bot-api-schema)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [npm-пакет](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
- [English README](./README.md)

---

## Автор и поддержка

**Алексеев Олег** — архитектор интеграций ERP и AI.

- 📧 woyaxnini@gmail.com · woyax@yandex.com
- 💬 Telegram: [@ale_oleg](https://t.me/ale_oleg) · Канал: [@woyax_ai](https://t.me/woyax_ai)
- 💬 MAX: [max.ru/id503610654564_biz](https://max.ru/id503610654564_biz)

Нужна интеграция AI-агентов с вашей ERP, CRM или MAX? MCP-серверы, n8n-воркфлоу, AI-автоматизация — [пишите](mailto:woyaxnini@gmail.com).

---

## Лицензия

MIT + Commons Clause © [Алексеев Олег](https://github.com/woyaxnini)

Бесплатно для личного и корпоративного использования. Продажа как hosted-сервиса — только с разрешения автора. Подробности в файле [LICENSE](./LICENSE).
