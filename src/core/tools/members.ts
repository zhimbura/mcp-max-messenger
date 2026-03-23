// Tools: add_members, remove_member, get_admins, set_admin, remove_admin
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

export function registerMemberTools(server: McpServer, client: MaxClient): void {

  // ─── add_members ───────────────────────────────────────────────────────────
  server.registerTool(
    'add_members',
    {
      title: 'Add Members',
      description:
        'Add one or more users to a group chat. ' +
        'The bot must be an admin of the chat. Provide user_ids to add.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
        user_ids: z.array(z.number().int()).min(1).max(100)
          .describe('List of user_ids to add to the chat'),
      },
    },
    async ({ chat_id, user_ids }) => {
      const result = await client.addMembers({ chat_id, user_ids });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── remove_member ─────────────────────────────────────────────────────────
  server.registerTool(
    'remove_member',
    {
      title: 'Remove Member',
      description:
        'Remove a user from a group chat. ' +
        'The bot must be an admin of the chat. Optionally block the user from rejoining. ' +
        'WARNING: If the user has privacy mode enabled in MAX settings, ' +
        'the bot will not be able to re-add them after removal — confirm with the user before proceeding.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
        user_id: z.number().int().describe('The user_id of the member to remove'),
        block: z.boolean().optional()
          .describe('Block user from rejoining the chat (default: false)'),
      },
    },
    async ({ chat_id, user_id, block }) => {
      const result = await client.removeMember({ chat_id, user_id, block });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── get_admins ────────────────────────────────────────────────────────────
  server.registerTool(
    'get_admins',
    {
      title: 'Get Admins',
      description:
        'Get the list of administrators in a group chat. ' +
        'Returns user_id, name, username, and permissions for each admin.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
      },
    },
    async ({ chat_id }) => {
      const result = await client.getAdmins(chat_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── set_admin ─────────────────────────────────────────────────────────────
  server.registerTool(
    'set_admin',
    {
      title: 'Set Admin',
      description:
        'Grant admin rights to a chat member. ' +
        'The bot must be an admin or owner of the chat.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
        user_id: z.number().int().describe('The user_id to grant admin rights to'),
      },
    },
    async ({ chat_id, user_id }) => {
      const result = await client.setAdmin(chat_id, user_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── remove_admin ──────────────────────────────────────────────────────────
  server.registerTool(
    'remove_admin',
    {
      title: 'Remove Admin',
      description:
        'Revoke admin rights from a chat member. They remain a regular member. ' +
        'The bot must be an admin or owner of the chat. ' +
        'KNOWN MAX API BUG: The API returns success:true but rights may not actually be revoked. ' +
        'This is a confirmed issue on the MAX side — only the chat owner can reliably remove admin rights manually in the app.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id of the group chat'),
        user_id: z.number().int().describe('The user_id to revoke admin rights from'),
      },
    },
    async ({ chat_id, user_id }) => {
      const result = await client.removeAdmin(chat_id, user_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
