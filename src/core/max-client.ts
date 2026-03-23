// MAX Bot API HTTP client
// Docs: https://dev.max.ru/docs-api
// Base URL: https://platform-api.max.ru
// Auth: Authorization: <token>  (NO "Bearer" prefix — MAX API specifics)

import type {
  BotInfo,
  Chat,
  ChatsResult,
  ChatMembersResult,
  ChatAdminsResult,
  MessagesResult,
  SendMessageParams,
  SendMessageResult,
  EditMessageParams,
  DeleteMessageParams,
  SimpleResult,
  GetMessagesParams,
  UpdatesResult,
  GetUpdatesParams,
  AnswerCallbackParams,
  EditChatParams,
  BotActionType,
  MediaType,
  AddMembersParams,
  RemoveMemberParams,
  MaxApiError as MaxApiErrorResponse,
} from './types.js';

const BASE_URL = 'https://platform-api.max.ru';

export class MaxApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`MAX API error [${code}]: ${message}`);
    this.name = 'MaxApiError';
  }
}

export class MaxClient {
  private readonly token: string;

  constructor(token: string) {
    if (!token || token.trim() === '') {
      throw new Error('MAX bot token is required');
    }
    this.token = token.trim();
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    params?: Record<string, string | number | boolean | string[]>,
    body?: unknown,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);

    // Append query params for GET/DELETE
    if (params && (method === 'GET' || method === 'DELETE')) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }

    const headers: Record<string, string> = {
      // MAX API uses token directly — NO "Bearer" prefix
      Authorization: this.token,
      'Content-Type': 'application/json',
      'User-Agent': 'mcp-max-messenger/1.1.0',
    };

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestInit.body = JSON.stringify(body);
    } else if (params && ['POST', 'PUT', 'PATCH'].includes(method) && !body) {
      requestInit.body = JSON.stringify(params);
    }

    const response = await fetch(url.toString(), requestInit);

    if (!response.ok) {
      let errorData: MaxApiErrorResponse | null = null;
      try {
        errorData = (await response.json()) as MaxApiErrorResponse;
      } catch {
        // ignore parse error
      }
      throw new MaxApiError(
        errorData?.code ?? String(response.status),
        errorData?.message ?? response.statusText,
      );
    }

    // Some DELETE/PATCH endpoints return empty body
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true } as unknown as T;
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;

    // FIX (edit_chat): MAX API returns {"code":"empty.response.body","message":"..."}
    // as a 2xx response when PATCH succeeds but has no body to return — treat as success.
    if (parsed && typeof parsed === 'object' && parsed['code'] === 'empty.response.body') {
      return { success: true } as unknown as T;
    }

    return parsed as T;
  }

  // ─── Bot ──────────────────────────────────────────────────────────────────

  async getMe(): Promise<BotInfo> {
    return this.request<BotInfo>('GET', '/me');
  }

  // ─── Chats ────────────────────────────────────────────────────────────────

  async getChats(count = 50, marker?: number): Promise<ChatsResult> {
    const params: Record<string, string | number> = { count };
    if (marker !== undefined) params.marker = marker;
    return this.request<ChatsResult>('GET', '/chats', params);
  }

  async getChat(chatId: number): Promise<Chat> {
    return this.request<Chat>('GET', `/chats/${chatId}`);
  }

  async editChat(p: EditChatParams): Promise<Chat> {
    const body: Record<string, unknown> = {};
    if (p.title !== undefined) body.title = p.title;
    if (p.description !== undefined) body.description = p.description;
    if (p.icon !== undefined) body.icon = p.icon;
    if (p.pin !== undefined) body.pin = p.pin;
    if (p.notify_members !== undefined) body.notify_members = p.notify_members;
    return this.request<Chat>('PATCH', `/chats/${p.chat_id}`, undefined, body);
  }

  async sendAction(chatId: number, action: BotActionType): Promise<SimpleResult> {
    return this.request<SimpleResult>(
      'POST',
      `/chats/${chatId}/actions`,
      undefined,
      { action },
    );
  }

  async getChatMembers(
    chatId: number,
    count = 50,
    marker?: number,
  ): Promise<ChatMembersResult> {
    const params: Record<string, string | number> = { count };
    if (marker !== undefined) params.marker = marker;
    return this.request<ChatMembersResult>('GET', `/chats/${chatId}/members`, params);
  }

  async addMembers(p: AddMembersParams): Promise<SimpleResult> {
    return this.request<SimpleResult>(
      'POST',
      `/chats/${p.chat_id}/members`,
      undefined,
      { user_ids: p.user_ids },
    );
  }

  async removeMember(p: RemoveMemberParams): Promise<SimpleResult> {
    const params: Record<string, string | number | boolean> = {
      user_id: p.user_id,
    };
    if (p.block !== undefined) params.block = p.block;
    return this.request<SimpleResult>('DELETE', `/chats/${p.chat_id}/members`, params);
  }

  async getAdmins(chatId: number): Promise<ChatAdminsResult> {
    return this.request<ChatAdminsResult>('GET', `/chats/${chatId}/members/admins`);
  }

  async setAdmin(chatId: number, userId: number): Promise<SimpleResult> {
    // FIX: MAX API requires { admins: [{ user_id, permissions }] }
    // permissions: [] means standard admin rights (empty = default set)
    return this.request<SimpleResult>(
      'POST',
      `/chats/${chatId}/members/admins`,
      undefined,
      { admins: [{ user_id: userId, permissions: [] }] },
    );
  }

  async removeAdmin(chatId: number, userId: number): Promise<SimpleResult> {
    return this.request<SimpleResult>(
      'DELETE',
      `/chats/${chatId}/members/admins/${userId}`,
    );
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessage(messageId: string): Promise<{ message: import('./types.js').Message }> {
    return this.request('GET', `/messages/${messageId}`);
  }

  async getMessages(p: GetMessagesParams): Promise<MessagesResult> {
    const params: Record<string, string | number | boolean | string[]> = {};

    // FIX: chat_id and message_ids are mutually exclusive per MAX API docs.
    // When message_ids provided — omit chat_id entirely.
    // message_ids must be comma-separated: ?message_ids=id1,id2 (NOT repeated params)
    if (p.message_ids?.length) {
      params.message_ids = p.message_ids.join(',');
    } else {
      params.chat_id = p.chat_id;
      if (p.from !== undefined) params.from = p.from;
      if (p.to !== undefined) params.to = p.to;
      if (p.count !== undefined) params.count = p.count;
    }

    return this.request<MessagesResult>('GET', '/messages', params);
  }

  async sendMessage(p: SendMessageParams): Promise<SendMessageResult> {
    const body: Record<string, unknown> = {
      text: p.text,
    };
    if (p.user_id !== undefined) body.user_id = p.user_id;
    if (p.chat_id !== undefined) body.chat_id = p.chat_id;
    if (p.format) body.format = p.format;
    if (p.notify !== undefined) body.notify = p.notify;
    if (p.disable_link_preview !== undefined) body.disable_link_preview = p.disable_link_preview;
    if (p.attachments?.length) body.attachments = p.attachments;

    const queryParams: Record<string, string | number> = {};
    if (p.user_id !== undefined) queryParams.user_id = p.user_id;
    if (p.chat_id !== undefined) queryParams.chat_id = p.chat_id;

    const url = new URL(`${BASE_URL}/messages`);
    for (const [k, v] of Object.entries(queryParams)) {
      url.searchParams.set(k, String(v));
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: this.token,
        'Content-Type': 'application/json',
        'User-Agent': 'mcp-max-messenger/1.1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData: MaxApiErrorResponse | null = null;
      try {
        errorData = (await response.json()) as MaxApiErrorResponse;
      } catch { /* ignore */ }
      throw new MaxApiError(
        errorData?.code ?? String(response.status),
        errorData?.message ?? response.statusText,
      );
    }

    return response.json() as Promise<SendMessageResult>;
  }

  async editMessage(p: EditMessageParams): Promise<SimpleResult> {
    // FIX: message_id must be a query param — PUT /messages?message_id=...
    const body: Record<string, unknown> = { text: p.text };
    if (p.format) body.format = p.format;
    if (p.attachments?.length) body.attachments = p.attachments;
    return this.request<SimpleResult>(
      'PUT',
      `/messages?message_id=${encodeURIComponent(p.message_id)}`,
      undefined,
      body,
    );
  }

  async deleteMessage(p: DeleteMessageParams): Promise<SimpleResult> {
    return this.request<SimpleResult>('DELETE', '/messages', {
      message_id: p.message_id,
    });
  }

  // ─── Pin ─────────────────────────────────────────────────────────────────

  async pinMessage(chatId: number, messageId: string, notify = false): Promise<SimpleResult> {
    return this.request<SimpleResult>(
      'PUT',
      `/chats/${chatId}/pin`,
      undefined,
      { message_id: messageId, notify },
    );
  }

  async unpinMessage(chatId: number): Promise<SimpleResult> {
    return this.request<SimpleResult>('DELETE', `/chats/${chatId}/pin`);
  }

  // ─── Updates (v1.1.0) ─────────────────────────────────────────────────────

  async getUpdates(p: GetUpdatesParams): Promise<UpdatesResult> {
    const params: Record<string, string | number | string[]> = {};
    if (p.limit !== undefined) params.limit = p.limit;
    if (p.timeout !== undefined) params.timeout = p.timeout;
    if (p.marker !== undefined) params.marker = p.marker;
    if (p.types?.length) params.types = p.types;
    return this.request<UpdatesResult>('GET', '/updates', params);
  }

  async answerCallback(p: AnswerCallbackParams): Promise<SimpleResult> {
    // FIX: callback_id must be a query param — POST /answers?callback_id=...
    const body: Record<string, unknown> = {
      user_id: p.user_id,
    };
    if (p.message) body.message = p.message;
    if (p.notification !== undefined) body.notification = p.notification;
    return this.request<SimpleResult>(
      'POST',
      `/answers?callback_id=${encodeURIComponent(p.callback_id)}`,
      undefined,
      body,
    );
  }

  // ─── Media upload (v1.1.0) ────────────────────────────────────────────────
  // Two-step process:
  // 1. POST /uploads?type=X  → get upload URL (+ token for video/audio)
  // 2. POST upload URL with file as multipart/form-data
  // 3. POST /messages with attachment token

  async getUploadUrl(type: MediaType): Promise<{ url: string; token?: string }> {
    return this.request<{ url: string; token?: string }>(
      'POST',
      `/uploads?type=${type}`,
    );
  }

  async uploadFile(
    uploadUrl: string,
    fileBuffer: Buffer,
    contentType: string,
    filename = 'upload',
  ): Promise<Record<string, unknown>> {
    // MAX upload server expects multipart/form-data with field name "data"
    // FIX: use Uint8Array to avoid TypeScript Buffer/BlobPart incompatibility
    const form = new FormData();
    form.append('data', new Blob([new Uint8Array(fileBuffer)], { type: contentType }), filename);

    // Do NOT set Content-Type manually — fetch sets multipart boundary automatically
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new MaxApiError(
        String(response.status),
        `Upload failed: ${response.statusText}`,
      );
    }

    const text = await response.text();
    console.error('[MAX UPLOAD RESPONSE]', text); // debug — remove after confirmed working

    if (!text || text.trim() === '') return {};
    // FIX: MAX upload server returns "<retval>1</retval>" (XML) for audio/video uploads.
    // This is a success signal — treat it as an empty result and use the token from uploadInfo.
    if (text.trim().startsWith('<')) return {};
    return JSON.parse(text) as Record<string, unknown>;
  }

  // sendMedia: fetch file by URL, upload to MAX, send as message
  async sendMedia(p: {
    chat_id?: number;
    user_id?: number;
    fileUrl: string;
    type: MediaType;
    text?: string;
    format?: import('./types.js').MessageFormat;
  }): Promise<SendMessageResult> {
    // Step 1: get upload URL from MAX
    const uploadInfo = await this.getUploadUrl(p.type);
    console.error('[MAX UPLOAD INFO]', JSON.stringify(uploadInfo)); // debug

    // Step 2: download file from provided URL
    const fileResponse = await fetch(p.fileUrl);
    if (!fileResponse.ok) {
      throw new MaxApiError('FETCH_FAILED', `Failed to fetch file from URL: ${p.fileUrl}`);
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const contentType = fileResponse.headers.get('content-type') ?? 'application/octet-stream';

    // Determine filename extension from content type
    const ext = contentType.split('/')[1]?.split(';')[0] ?? 'bin';
    const filename = `upload.${ext}`;

    // Step 3: upload to MAX upload URL
    let token: string | undefined;
    let photoId = 0;

    if (p.type === 'video' || p.type === 'audio') {
      // For video/audio: token comes from POST /uploads response (step 1)
      token = uploadInfo.token;
      await this.uploadFile(uploadInfo.url, fileBuffer, contentType, filename);
    } else {
      // For image/file: token comes from upload response (step 2)
      const uploadResult = await this.uploadFile(uploadInfo.url, fileBuffer, contentType, filename);

      // MAX image upload may return several structures — handle all known variants:
      // Variant A: { "photos": { "0": { "token": "...", "photo_id": 123 } } }
      // Variant B: { "token": "..." }
      // Variant C: token from uploadInfo as fallback
      if (uploadResult.token && typeof uploadResult.token === 'string') {
        token = uploadResult.token;
      } else if (uploadResult.photos && typeof uploadResult.photos === 'object') {
        const photos = uploadResult.photos as Record<string, { token: string; photo_id: number }>;
        const first = Object.values(photos)[0];
        if (first?.token) {
          token = first.token;
          photoId = first.photo_id ?? 0;
        }
      }

      // Fallback: token from uploadInfo
      if (!token && uploadInfo.token) {
        token = uploadInfo.token;
      }
    }

    if (!token) {
      throw new MaxApiError('NO_TOKEN', 'Failed to get media token after upload');
    }

    // Step 4: send message with attachment
    let attachment: import('./types.js').Attachment;
    if (p.type === 'image') {
      attachment = { type: 'image', payload: { photo_id: photoId, token } };
    } else if (p.type === 'video') {
      attachment = { type: 'video', payload: { id: 0, token } };
    } else if (p.type === 'audio') {
      attachment = { type: 'audio', payload: { id: 0, token } };
    } else {
      attachment = { type: 'file', payload: { fileId: '', token } };
    }

    // Step 4: send message with attachment
    // FIX: MAX needs time to process uploaded files — retry up to 3 times on attachment.not.ready
    const RETRY_DELAYS = [3000, 6000, 12000];
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        console.error(`[MAX] attachment.not.ready — retry ${attempt}/${RETRY_DELAYS.length} after ${RETRY_DELAYS[attempt - 1]}ms`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
      }
      try {
        return await this.sendMessage({
          chat_id: p.chat_id,
          user_id: p.user_id,
          text: p.text ?? '',
          format: p.format,
          attachments: [attachment],
        });
      } catch (err) {
        const e = err as MaxApiError;
        if (e.code === 'attachment.not.ready') {
          lastError = e;
          continue; // retry
        }
        throw err; // any other error — rethrow immediately
      }
    }

    throw lastError ?? new MaxApiError('attachment.not.ready', 'File not processed after retries');
  }
}
