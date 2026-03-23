// Tools: get_updates, answer_callback
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

export function registerUpdateTools(server: McpServer, client: MaxClient): void {

  // ─── get_updates ───────────────────────────────────────────────────────────
  server.registerTool(
    'get_updates',
    {
      title: 'Get Updates',
      description:
        'Get incoming events: new messages, button clicks, user joins/leaves, etc. ' +
        'This is the ONLY way to get chat_id for personal dialogs (type: dialog). ' +
        'Use the returned marker in the next call to get only new events. ' +
        'Set timeout=0 for instant response, timeout>0 for long polling (waits up to N seconds for new events). ' +
        'Event types: message_created, message_edited, message_removed, message_callback, ' +
        'bot_started, bot_added, bot_removed, user_added, user_removed, message_chat_created. ' +
        'NOTE: Designed for development and manual polling only. ' +
        'For production bots use webhooks (POST /subscriptions) — ' +
        'in production the update queue accumulates quickly without continuous processing.',
      inputSchema: {
        limit: z.number().int().min(1).max(1000).optional()
          .describe('Max number of events to return (1-1000, default: 100)'),
        timeout: z.number().int().min(0).max(90).optional()
          .describe('Long polling timeout in seconds (0 = instant, default: 0)'),
        marker: z.number().optional()
          .describe('Pagination marker from previous get_updates call to get only new events'),
        types: z.array(
          z.enum([
            'message_created',
            'message_edited',
            'message_removed',
            'message_callback',
            'bot_started',
            'bot_added',
            'bot_removed',
            'user_added',
            'user_removed',
            'message_chat_created',
            'chat_title_changed',
          ]),
        ).optional()
          .describe('Filter by event types (omit to get all types)'),
      },
    },
    async ({ limit, timeout, marker, types }) => {
      const result = await client.getUpdates({
        limit: limit ?? 100,
        timeout: timeout ?? 0,
        marker,
        types,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── answer_callback ───────────────────────────────────────────────────────
  server.registerTool(
    'answer_callback',
    {
      title: 'Answer Callback',
      description:
        'Respond to an inline button click (callback event from get_updates). ' +
        'You can update the original message text and/or show a notification popup to the user. ' +
        'Must be called within 30 seconds of the button press.',
      inputSchema: {
        callback_id: z.string()
          .describe('The callback_id from the message_callback event (get_updates)'),
        user_id: z.number().int()
          .describe('The user_id of the user who clicked the button'),
        notification: z.string().max(200).optional()
          .describe('Short notification text shown as a popup to the user (optional)'),
        message_text: z.string().optional()
          .describe('New text for the original message (optional, updates the message in-place)'),
        message_format: z.enum(['markdown', 'html', 'default']).optional()
          .describe('Formatting for message_text'),
      },
    },
    async ({ callback_id, user_id, notification, message_text, message_format }) => {
      const result = await client.answerCallback({
        callback_id,
        user_id,
        notification,
        message: message_text
          ? { text: message_text, format: message_format }
          : undefined,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
