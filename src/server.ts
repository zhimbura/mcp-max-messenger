// MCP Server setup — registers all tools
// This is transport-agnostic: same tools work in both stdio and HTTP modes

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MaxClient } from './core/max-client.js';
import { registerBotTools } from './core/tools/bot.js';
import { registerChatTools } from './core/tools/chats.js';
import { registerMessageTools } from './core/tools/messages.js';
import { registerMemberTools } from './core/tools/members.js';
import { registerUpdateTools } from './core/tools/updates.js';

export interface ServerConfig {
  token: string;
}

export function createServer(config: ServerConfig): McpServer {
  const client = new MaxClient(config.token);

  const server = new McpServer({
    name: 'mcp-max-messenger',
    version: '1.1.0',
  });

  // Register all tools (21 total in v1.1.0)
  registerBotTools(server, client);       // get_bot_info
  registerChatTools(server, client);      // get_chats, get_chat, edit_chat, send_action, get_chat_members
  registerMessageTools(server, client);   // get_messages, get_message, send_message, edit_message,
                                          // delete_message, pin_message, unpin_message, send_media
  registerMemberTools(server, client);    // add_members, remove_member, get_admins, set_admin, remove_admin
  registerUpdateTools(server, client);    // get_updates, answer_callback

  return server;
}
