# mcp-max-messenger

[![npm version](https://badge.fury.io/js/%40woyax%2Fmcp-max-messenger.svg)](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
[![License: MIT + Commons Clause](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-blue.svg)](https://github.com/woyaxnini/mcp-max-messenger/blob/main/LICENSE)

**The first MCP server for MAX Messenger** — Russia's national messenger by VK (75M+ users).

Connect AI clients (Claude Desktop, Cursor, n8n, and any MCP-compatible app) to MAX: send and read messages, manage chats and members, send media, handle button presses, format with HTML/Markdown — all through the open [Model Context Protocol](https://modelcontextprotocol.io) standard.

**21 tools** with full coverage of MAX Bot API.

---

## Why MAX?

- 🇷🇺 National messenger mandated for pre-installation on all smartphones in Russia (September 2025)
- 📱 75M+ registered users
- 🏢 Recommended by the Ministry of Digital Development for government agencies and large enterprises
- 🤖 Full Bot API with official SDKs: TypeScript, Python, Go, Java, PHP

---

## Quick Start

### Prerequisites

- Node.js 18+
- A MAX bot token (create a bot at [max.ru](https://max.ru))

### Claude Desktop / Cursor (stdio mode)

Add to your Claude Desktop config:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "max-messenger": {
      "command": "npx",
      "args": ["-y", "@woyax/mcp-max-messenger"],
      "env": {
        "MAX_TOKEN": "YOUR_BOT_TOKEN"
      }
    }
  }
}
```

Restart Claude Desktop. The MAX tools will appear automatically.

### Remote / Hosted mode (HTTP)

```bash
MAX_TOKEN=YOUR_BOT_TOKEN MCP_TRANSPORT=http MCP_PORT=3000 npx @woyax/mcp-max-messenger
```

Connect any MCP client to `http://your-server:3000/mcp`.

---

## Available Tools (21)

### Messages

| Tool | Description |
|------|-------------|
| `get_messages` | Read messages from a chat (by chat_id or message_ids) |
| `send_message` | Send a message with text, HTML/Markdown, inline keyboard, media attachments |
| `edit_message` | Edit message text and attachments |
| `delete_message` | Delete a message |
| `pin_message` | Pin a message in a chat |
| `unpin_message` | Unpin the currently pinned message |

### Media

| Tool | Description |
|------|-------------|
| `send_media` | Upload and send photo, video, audio, or file by URL |
| `send_action` | Show typing indicator, "sending photo/video/audio/file", mark as read |

### Chats

| Tool | Description |
|------|-------------|
| `get_bot_info` | Bot info: name, ID, username, description |
| `get_chats` | List all group chats the bot participates in |
| `get_chat` | Full chat details: participants, pinned message, owner |
| `edit_chat` | Rename chat, change description or icon |

### Members

| Tool | Description |
|------|-------------|
| `get_chat_members` | List chat members with roles |
| `get_admins` | List chat administrators with permissions |
| `set_admin` | Grant admin rights to a member |
| `remove_admin` | Revoke admin rights |
| `add_members` | Add users to a group chat |
| `remove_member` | Remove a user from a group chat |

### Events

| Tool | Description |
|------|-------------|
| `get_updates` | Incoming events: messages, button presses, new dialogs (long polling) |
| `answer_callback` | Respond to inline button press: show notification or update message |

### Buttons (via send_message attachments)

5 button types supported: `callback`, `link`, `message`, `request_contact`, `request_geo_location`.

---

## Usage Examples

Once connected to Claude Desktop, use natural language:

> *"Send a message to chat 123456789: 'The meeting starts in 10 minutes'"*

> *"Send an approval request with Approve/Reject buttons to the team chat"*

> *"Show me the last 10 messages from the announcements chat"*

> *"Send this photo to the chat: https://example.com/image.jpg"*

> *"Who are the members of the sales group? Make Alex an admin."*

> *"Check for new incoming messages and button presses"*

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_TOKEN` | ✅ | — | Your MAX bot token |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport: `stdio` or `http` |
| `MCP_PORT` | ❌ | `3000` | Port for HTTP mode |

### Command-line Flags

```bash
# Local stdio mode (default)
npx @woyax/mcp-max-messenger

# Remote HTTP mode
npx @woyax/mcp-max-messenger --transport http --port 3000
```

---

## Architecture

Two independent layers — tools work identically in both modes:

```
src/
├── core/               # Business logic — shared between modes
│   ├── max-client.ts   # MAX API HTTP client
│   ├── types.ts        # TypeScript types for MAX API
│   └── tools/
│       ├── bot.ts      # get_bot_info
│       ├── chats.ts    # get_chats, get_chat, edit_chat, send_action
│       ├── messages.ts # send/get/edit/delete/pin/unpin, send_media
│       ├── members.ts  # get_chat_members, get_admins, set/remove_admin, add/remove_members
│       └── updates.ts  # get_updates, answer_callback
├── transports/         # Transport layer — selected at runtime
│   ├── stdio.ts        # Local mode (Claude Desktop, Cursor)
│   └── http.ts         # Remote mode (Streamable HTTP)
└── index.ts            # Entry point: transport selection
```

---

## MAX API Notes

- **Authorization**: Token passed as `Authorization: <token>` — **no `Bearer` prefix**
- **Base URL**: `https://platform-api.max.ru`
- **Rate limit**: 30 requests/second
- **Group chats**: `GET /chats` returns group chats only
- **Personal dialogs**: Accessible via `get_updates` — use the returned `chat_id` with all standard tools
- **Media upload**: Two-step process (upload → send). Audio/video tokens come from the upload step, not the file transfer
- **HTTP transport**: Uses Streamable HTTP (SSE deprecated since MCP SDK 1.10.0)

### Known MAX API Issues

- `remove_admin` may return `success: true` without actually revoking rights — confirmed bug on MAX side
- `open_app` button type returns "Field 'webApp' cannot be null" — MAX API bug
- `add_members` may fail with `add.participant.privacy` if the user has privacy mode enabled

---

## Roadmap

- [ ] HTTP mode testing on VPS with n8n integration
- [ ] Hosted MCP service (connect by URL, no local install)
- [ ] Webhook support for real-time event handling
- [ ] `answer_callback` testing via n8n webhook workflow

---

## Links

- [MAX Bot API Documentation](https://dev.max.ru/docs-api)
- [MAX OpenAPI Schema](https://github.com/max-messenger/max-bot-api-schema)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [npm package](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
- [Russian README](./README.ru.md)

---

## Author & Support

Built by **Oleg Alekseev** — ERP/AI integration architect.

- 📧 woyaxnini@gmail.com · woyax@yandex.com
- 💬 Telegram: [@ale_oleg](https://t.me/ale_oleg) · Channel: [@woyax_ai](https://t.me/woyax_ai)
- 💬 MAX: [max.ru/id503610654564_biz](https://max.ru/id503610654564_biz)

Need help integrating AI agents with your ERP, CRM, or MAX? Custom MCP servers, n8n workflows, AI automation — [contact me](mailto:woyaxnini@gmail.com).

---

## License

MIT + Commons Clause © [Oleg Alekseev](https://github.com/woyaxnini)

Free to use for personal and corporate purposes. Selling as a hosted service requires author's permission. See [LICENSE](./LICENSE) for details.
