/**
 * Bot file configuration — single source of truth for all bot-related metadata.
 * Update these constants whenever a new version is released.
 */

/** The Supabase Storage bucket that holds bot files */
export const BOT_BUCKET = 'VNCLC Storage';

/** Path inside the bucket where the bot file is stored (no spaces or brackets) */
export const BOT_STORAGE_PATH = 'bots/VNCLC_v2.0_Client.ex5';

/** Display filename shown to users when downloading */
export const BOT_DISPLAY_NAME = 'VNCLC Bot';

/** Human-readable version label used in UI */
export const BOT_VERSION = 'v2.0';
