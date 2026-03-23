// Tools: get_messages, send_message, edit_message, delete_message,
//        pin_message, unpin_message, get_message, send_media
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

// Zod schema for inline keyboard attachment — reused in send_message and edit_message
const attachmentSchema = z.union([
  z.object({
    type: z.literal('inline_keyboard'),
    payload: z.object({
      buttons: z.array(
        z.array(
          z.union([
            z.object({
              type: z.literal('callback'),
              text: z.string(),
              payload: z.string(),
              intent: z.enum(['positive', 'negative', 'default']).optional(),
            }),
            z.object({
              type: z.literal('link'),
              text: z.string(),
              url: z.string(),
            }),
            z.object({
              type: z.literal('request_contact'),
              text: z.string(),
            }),
            z.object({
              type: z.literal('request_geo_location'),
              text: z.string(),
              quick: z.boolean().optional()
                .describe('If true — send location immediately without confirmation dialog'),
            }),
            z.object({
              type: z.literal('open_app'),
              text: z.string(),
              url: z.string()
                .describe('Mini-app URL to open'),
              app_id: z.number().int().optional()
                .describe('Mini-app ID (alternative to url)'),
              payload: z.string().optional()
                .describe('Payload passed to the mini-app on open'),
            }),
            z.object({
              type: z.literal('message'),
              text: z.string(),
              payload: z.string().optional(),
            }),
          ]),
        ),
      ),
    }),
  }),
  z.object({
    type: z.literal('image'),
    payload: z.object({ photo_id: z.number(), token: z.string(), url: z.string().optional() }),
  }),
  z.object({
    type: z.literal('video'),
    payload: z.object({ id: z.number(), token: z.string() }),
  }),
  z.object({
    type: z.literal('audio'),
    payload: z.object({ id: z.number(), token: z.string() }),
  }),
  z.object({
    type: z.literal('file'),
    payload: z.object({ fileId: z.string(), token: z.string() }),
  }),
]);

export function registerMessageTools(server: McpServer, client: MaxClient): void {

  // ─── get_messages ──────────────────────────────────────────────────────────
  server.registerTool(
    'get_messages',
    {
      title: 'Get Messages',
      description:
        'Read messages from a MAX chat. Use either chat_id OR message_ids — they are mutually exclusive. ' +
        'With chat_id: returns recent messages from that chat (use count/from/to to filter). ' +
        'With message_ids: returns those specific messages only (do NOT provide chat_id).',
      inputSchema: {
        chat_id: z.number().int().optional()
          .describe('The chat_id to read messages from. Omit when using message_ids.'),
        count: z.number().int().min(1).max(100).optional()
          .describe('Number of messages to return (1-100, default: 20). Only used with chat_id.'),
        from: z.number().optional()
          .describe('Start timestamp in milliseconds (Unix ms) for time range filter. Only used with chat_id.'),
        to: z.number().optional()
          .describe('End timestamp in milliseconds (Unix ms) for time range filter. Only used with chat_id.'),
        message_ids: z.array(z.string()).optional()
          .describe('List of specific message IDs to retrieve. Do NOT provide chat_id when using this.'),
      },
    },
    async ({ chat_id, count, from, to, message_ids }) => {
      if (!chat_id && !message_ids?.length) {
        throw new Error('Either chat_id or message_ids must be provided');
      }
      const result = await client.getMessages({
        chat_id: chat_id ?? 0,
        count: count ?? 20,
        from,
        to,
        message_ids,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── get_message ───────────────────────────────────────────────────────────
  server.registerTool(
    'get_message',
    {
      title: 'Get Message',
      description:
        'Get a single message by its ID. Returns full message details including text, sender, attachments.',
      inputSchema: {
        message_id: z.string().describe('Message ID (mid) to retrieve'),
      },
    },
    async ({ message_id }) => {
      const result = await client.getMessage(message_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── send_message ──────────────────────────────────────────────────────────
  server.registerTool(
    'send_message',
    {
      title: 'Send Message',
      description:
        'Send a text message to a MAX chat or user. ' +
        'Provide either chat_id (group chats/channels) or user_id (direct messages), not both. ' +
        'Supports markdown and HTML formatting. ' +
        'Use attachments to add inline keyboard buttons or media (use tokens from send_media).',
      inputSchema: {
        chat_id: z.number().int().optional()
          .describe('Group chat or channel ID (use get_chats to find)'),
        user_id: z.number().int().optional()
          .describe('User ID for direct message'),
        text: z.string().min(1).describe('Message text to send'),
        format: z.enum(['markdown', 'html', 'default']).optional()
          .describe('Text formatting: markdown (default) or html'),
        notify: z.boolean().optional()
          .describe('Whether to notify participants (default: true)'),
        disable_link_preview: z.boolean().optional()
          .describe('Disable link preview in message (default: false)'),
        attachments: z.array(attachmentSchema).optional()
          .describe('Optional attachments: inline_keyboard buttons or media tokens'),
      },
    },
    async ({ chat_id, user_id, text, format, notify, disable_link_preview, attachments }) => {
      if (!chat_id && !user_id) {
        throw new Error('Either chat_id or user_id must be provided');
      }
      const result = await client.sendMessage({
        chat_id,
        user_id,
        text,
        format: format ?? 'markdown',
        notify: notify ?? true,
        disable_link_preview,
        attachments: attachments as import('../types.js').Attachment[] | undefined,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── edit_message ──────────────────────────────────────────────────────────
  server.registerTool(
    'edit_message',
    {
      title: 'Edit Message',
      description:
        'Edit the text of an existing message sent by the bot. ' +
        'Optionally update attachments (inline keyboard buttons). Requires the message_id.',
      inputSchema: {
        message_id: z.string()
          .describe('The ID of the message to edit (from send_message or get_messages)'),
        text: z.string().min(1).describe('New message text'),
        format: z.enum(['markdown', 'html', 'default']).optional()
          .describe('Text formatting for new text'),
        attachments: z.array(attachmentSchema).optional()
          .describe('Optional new attachments (replaces existing)'),
      },
    },
    async ({ message_id, text, format, attachments }) => {
      const result = await client.editMessage({
        message_id,
        text,
        format,
        attachments: attachments as import('../types.js').Attachment[] | undefined,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── delete_message ────────────────────────────────────────────────────────
  server.registerTool(
    'delete_message',
    {
      title: 'Delete Message',
      description: 'Delete a message sent by the bot. Requires the message_id.',
      inputSchema: {
        message_id: z.string().describe('The ID of the message to delete'),
      },
    },
    async ({ message_id }) => {
      const result = await client.deleteMessage({ message_id });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── pin_message ───────────────────────────────────────────────────────────
  server.registerTool(
    'pin_message',
    {
      title: 'Pin Message',
      description:
        'Pin a message in a group chat. The bot must have admin rights in the chat.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id where the message is'),
        message_id: z.string().describe('The ID of the message to pin'),
        notify: z.boolean().optional()
          .describe('Whether to notify participants about pinned message (default: false)'),
      },
    },
    async ({ chat_id, message_id, notify }) => {
      const result = await client.pinMessage(chat_id, message_id, notify ?? false);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── unpin_message ────────────────────────────────────────────────────────
  server.registerTool(
    'unpin_message',
    {
      title: 'Unpin Message',
      description:
        'Unpin the currently pinned message in a group chat. The bot must have admin rights.',
      inputSchema: {
        chat_id: z.number().int().describe('The chat_id where the pinned message is'),
      },
    },
    async ({ chat_id }) => {
      const result = await client.unpinMessage(chat_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ─── send_media ────────────────────────────────────────────────────────────
  server.registerTool(
    'send_media',
    {
      title: 'Send Media',
      description:
        'Upload a file (image/video/audio/file) from a URL and send it as a message. ' +
        'The tool handles the full two-step upload process automatically: ' +
        '1) get MAX upload URL, 2) upload file, 3) send message with attachment. ' +
        'Provide either chat_id or user_id.',
      inputSchema: {
        chat_id: z.number().int().optional()
          .describe('Group chat or channel ID'),
        user_id: z.number().int().optional()
          .describe('User ID for direct message'),
        file_url: z.string().url()
          .describe('Public URL of the file to upload and send'),
        type: z.enum(['image', 'video', 'audio', 'file'])
          .describe('Type of media: image, video, audio, or file'),
        text: z.string().optional()
          .describe('Optional text caption for the media'),
        format: z.enum(['markdown', 'html', 'default']).optional()
          .describe('Text formatting for caption'),
      },
    },
    async ({ chat_id, user_id, file_url, type, text, format }) => {
      if (!chat_id && !user_id) {
        throw new Error('Either chat_id or user_id must be provided');
      }
      const result = await client.sendMedia({
        chat_id,
        user_id,
        fileUrl: file_url,
        type,
        text,
        format,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
