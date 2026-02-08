import { toStringArray } from '../utils/array.js';

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toStringValue(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeServerConfig(serverCfg = {}) {
  return {
    ...serverCfg,
    server_name: toStringValue(serverCfg.server_name, ''),
    ws_able: toBoolean(serverCfg.ws_able, false),
    ws_url: toStringValue(serverCfg.ws_url, ''),
    ws_password: toStringValue(serverCfg.ws_password, ''),
    ws_max_attempts: Math.max(0, Math.floor(toNumber(serverCfg.ws_max_attempts, 3))),
    group_list: toStringArray(serverCfg.group_list),
    bot_self_id: toStringArray(serverCfg.bot_self_id),
    command_header: toStringValue(serverCfg.command_header, '/'),
    command_user: toStringArray(serverCfg.command_user),
    mask_word: toStringValue(serverCfg.mask_word, ''),
  };
}

export function normalizeConfig(config = {}, defaults = {}) {
  const normalized = {
    ...defaults,
    ...config,
  };

  normalized.mc_qq_ws_server = toBoolean(normalized.mc_qq_ws_server, true);
  normalized.mc_qq_ws_url = toStringValue(normalized.mc_qq_ws_url, '/minecraft/ws');
  normalized.mc_qq_ws_port = Math.min(
    65535,
    Math.max(1, Math.floor(toNumber(normalized.mc_qq_ws_port, 8080)))
  );
  normalized.mc_qq_ws_password = toStringValue(normalized.mc_qq_ws_password, '');
  normalized.mc_qq_send_group_name = toBoolean(normalized.mc_qq_send_group_name, true);
  normalized.mc_qq_display_server_name = toBoolean(normalized.mc_qq_display_server_name, true);
  normalized.mc_qq_say_way = toStringValue(normalized.mc_qq_say_way, '说：');
  normalized.mc_qq_chat_image_enable = toBoolean(normalized.mc_qq_chat_image_enable, false);
  normalized.debug_mode = toBoolean(normalized.debug_mode, false);

  const serverList = Array.isArray(normalized.mc_qq_server_list)
    ? normalized.mc_qq_server_list
    : [];
  normalized.mc_qq_server_list = serverList.map(normalizeServerConfig);

  return normalized;
}
