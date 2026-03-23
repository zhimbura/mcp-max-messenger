// Types for MAX Bot API
// Based on: https://dev.max.ru/docs-api

export interface BotInfo {
  user_id: number;
  name: string;
  first_name?: string;
  username: string;
  is_bot: boolean;
  last_activity_time: number;
  description?: string;
  avatar_url?: string;
  full_avatar_url?: string;
}

export interface User {
  user_id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_bot: boolean;
  last_activity_time?: number;
  avatar_url?: string;
}

export type ChatType = 'dialog' | 'chat' | 'channel';
export type ChatStatus = 'active' | 'removed' | 'left' | 'closed' | 'suspended';

export interface Chat {
  chat_id: number;
  type: ChatType;
  status: ChatStatus;
  title?: string;
  icon?: { url: string };
  last_event_time: number;
  participants_count: number;
  owner_id?: number;
  participants?: Record<string, number>;
  is_public?: boolean;
  link?: string;
  description?: string | null;
  pinned_message?: Message;
}

export interface ChatMember {
  user_id: number;
  name: string;
  username?: string;
  is_bot: boolean;
  last_activity_time?: number;
  avatar_url?: string;
}

export interface ChatAdmin {
  user_id: number;
  name: string;
  username?: string;
  is_bot: boolean;
  permissions?: string[];
  avatar_url?: string;
}

export interface ChatMembersResult {
  members: ChatMember[];
  marker?: number;
}

export interface ChatAdminsResult {
  members: ChatAdmin[];
  marker?: number;
}

export type MessageFormat = 'html' | 'markdown' | 'default';

export interface MessageBody {
  mid: string;
  seq: number;
  text?: string;
  attachments?: Attachment[];
  markup?: MarkupElement[];
}

export interface Message {
  sender?: User;
  recipient: Recipient;
  timestamp: number;
  link?: LinkedMessage;
  body: MessageBody;
  stat?: MessageStat;
  url?: string;
}

export interface Recipient {
  chat_id?: number;
  user_id?: number;
  chat_type: ChatType;
}

export interface LinkedMessage {
  type: 'forward' | 'reply';
  sender?: User;
  chat_id?: number;
  message?: MessageBody;
}

export interface MessageStat {
  views: number;
}

export interface MarkupElement {
  type: string;
  from: number;
  length: number;
  url?: string;
  user_link?: string;
  user_id?: number;
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export type Attachment =
  | PhotoAttachment
  | VideoAttachment
  | FileAttachment
  | AudioAttachment
  | InlineKeyboardAttachment
  | LocationAttachment;

export interface PhotoAttachment {
  type: 'image';
  payload: { photo_id: number; token: string; url?: string };
}

export interface VideoAttachment {
  type: 'video';
  payload: { id: number; token: string };
}

export interface FileAttachment {
  type: 'file';
  payload: { fileId: string; token: string };
}

export interface AudioAttachment {
  type: 'audio';
  payload: { id: number; token: string };
}

export interface LocationAttachment {
  type: 'location';
  payload: { longitude: number; latitude: number };
}

export interface InlineKeyboardAttachment {
  type: 'inline_keyboard';
  payload: InlineKeyboard;
}

export interface InlineKeyboard {
  buttons: KeyboardButton[][];
}

export type KeyboardButton =
  | CallbackButton
  | LinkButton
  | RequestContactButton
  | RequestGeoButton
  | MessageButton;

export interface CallbackButton {
  type: 'callback';
  text: string;
  payload: string;
  intent?: 'positive' | 'negative' | 'default';
}

export interface LinkButton {
  type: 'link';
  text: string;
  url: string;
}

export interface RequestContactButton {
  type: 'request_contact';
  text: string;
}

export interface RequestGeoButton {
  type: 'request_geo_location';
  text: string;
  quick?: boolean;
}

export interface MessageButton {
  type: 'message';
  text: string;
  payload?: string;
}

// ─── Request / Response types ─────────────────────────────────────────────────

export interface GetMessagesParams {
  chat_id: number;
  message_ids?: string[];
  from?: number;
  to?: number;
  count?: number;
}

export interface MessagesResult {
  messages: Message[];
}

export interface SendMessageParams {
  user_id?: number;
  chat_id?: number;
  text: string;
  format?: MessageFormat;
  notify?: boolean;
  disable_link_preview?: boolean;
  attachments?: Attachment[];
}

export interface SendMessageResult {
  message: Message;
}

export interface EditMessageParams {
  message_id: string;
  text: string;
  format?: MessageFormat;
  attachments?: Attachment[];
}

export interface DeleteMessageParams {
  message_id: string;
}

export interface SimpleResult {
  success: boolean;
}

export interface ChatsResult {
  chats: Chat[];
  marker?: number;
}

export interface MaxApiError {
  code: string;
  message: string;
}

// ─── Updates (v1.1.0) ─────────────────────────────────────────────────────────

export type UpdateType =
  | 'message_created'
  | 'message_edited'
  | 'message_removed'
  | 'message_callback'
  | 'bot_started'
  | 'bot_added'
  | 'bot_removed'
  | 'user_added'
  | 'user_removed'
  | 'message_chat_created'
  | 'chat_title_changed';

export interface Update {
  update_type: UpdateType;
  timestamp: number;
  message?: Message;
  callback?: Callback;
  user?: User;
  chat_id?: number;
  inviter_id?: number;
  admin_id?: number;
  message_id?: string;
}

export interface UpdatesResult {
  updates: Update[];
  marker?: number;
}

export interface GetUpdatesParams {
  limit?: number;
  timeout?: number;
  marker?: number;
  types?: UpdateType[];
}

// ─── Callback (v1.1.0) ────────────────────────────────────────────────────────

export interface Callback {
  timestamp: number;
  callback_id: string;
  payload?: string;
  user: User;
  message?: Message;
}

export interface AnswerCallbackParams {
  callback_id: string;
  user_id: number;
  message?: {
    text: string;
    format?: MessageFormat;
    attachments?: Attachment[];
  };
  notification?: string;
}

// ─── Media upload (v1.1.0) ────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio' | 'file';

export interface UploadUrlResult {
  url: string;
  token?: string;
}

// ─── Chat management (v1.1.0) ─────────────────────────────────────────────────

export interface EditChatParams {
  chat_id: number;
  title?: string;
  description?: string | null;
  icon?: { url: string } | null;
  pin?: string | null;
  notify_members?: boolean;
}

export type BotActionType =
  | 'typing_on'
  | 'sending_photo'
  | 'sending_video'
  | 'sending_audio'
  | 'sending_file'
  | 'mark_seen';

// ─── Members management (v1.1.0) ─────────────────────────────────────────────

export interface AddMembersParams {
  chat_id: number;
  user_ids: number[];
}

export interface RemoveMemberParams {
  chat_id: number;
  user_id: number;
  block?: boolean;
}
