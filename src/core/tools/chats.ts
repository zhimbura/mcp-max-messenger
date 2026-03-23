// Tools: get_chats, get_chat_members, get_chat, edit_chat, send_action
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

export function registerChatTools(server: McpServer, client: MaxClient): void {

  // ─── get_chats ─────────────────────────────────────────────────────────────
  server.registerTool(
    'get_chats',
    {
      title: 'Get Chats',
      description:
        'Get the list of all group chats where the bot is a participant. ' +
        'Returns chat_id, title, type, participant count, and last activity time. ' +
        'Use chat_id from results to read or send messages. ' +
        'NOTE: Only group chats are returned. Personal dialogs (type: dialog) are NOT included here — ' +
        'use get_updates to discover their chat_id.',
      inputSchema: {
        count: z.number().int().min(1).max(100).optional()
          .describe('Number of chats to return (1-100, default: 50)'),
        marker: z.number().int().optional()
          .describe('Pagination marker from previous response'),
      },
    },
    async ({ count, marker }) => {
      const result = await client.getChats(count ?? 50, marker);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── get_chat ──────────────────────────────────────────────────────────────
  server.registerTool(
    'get_chat',
    {
      title: 'Get Chat',
      description:
        'Get full details of a specific chat by its ID: title, description, ' +
        'participant count, icon, pinned message, link.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id to get details for'),
      },
    },
    async ({ chat_id }) => {
      const result = await client.getChat(chat_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── edit_chat ─────────────────────────────────────────────────────────────
  server.registerTool(
    'edit_chat',
    {
      title: 'Edit Chat',
      description:
        'Rename a chat, change its description, or update its icon. ' +
        'The bot must be an admin of the chat.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id to edit'),
        title: z.string().min(1).max(200).optional()
          .describe('New chat title'),
        description: z.string().max(2000).nullable().optional()
          .describe('New chat description (pass null to clear)'),
        icon: z.object({ url: z.string().url() }).nullable().optional()
          .describe('New icon as { url } (pass null to remove)'),
        notify_members: z.boolean().optional()
          .describe('Notify members about changes (default: false)'),
      },
    },
    async ({ chat_id, title, description, icon, notify_members }) => {
      const result = await client.editChat({
        chat_id,
        title,
        description,
        icon,
        notify_members,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── send_action ───────────────────────────────────────────────────────────
  server.registerTool(
    'send_action',
    {
      title: 'Send Action',
      description:
        'Show a typing indicator or other status to chat members. ' +
        'Use before sending a message to improve UX. ' +
        'Actions: typing_on, sending_photo, sending_video, sending_audio, sending_file, mark_seen.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id to show action in'),
        action: z.enum([
          'typing_on',
          'sending_photo',
          'sending_video',
          'sending_audio',
          'sending_file',
          'mark_seen',
        ]).describe('Action type to display'),
      },
    },
    async ({ chat_id, action }) => {
      const result = await client.sendAction(chat_id, action);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── get_chat_members ──────────────────────────────────────────────────────
  server.registerTool(
    'get_chat_members',
    {
      title: 'Get Chat Members',
      description:
        'Get the list of participants in a group chat. Returns user_id, name, username for each member.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
        count: z.number().int().min(1).max(100).optional()
          .describe('Number of members to return (1-100, default: 50)'),
        marker: z.number().int().optional()
          .describe('Pagination marker from previous response'),
      },
    },
    async ({ chat_id, count, marker }) => {
      const result = await client.getChatMembers(chat_id, count ?? 50, marker);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
