const responseMap = new Map();

export function addResponse(echo, e, timeoutMs = 5000) {
  if (!echo || !e) return;

  const existing = responseMap.get(echo);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    if (responseMap.has(echo)) {
      logger.warn(`[MC-PLUGIN] 命令响应超时: echo=${echo}`);
      responseMap.delete(echo);
    }
  }, timeoutMs);

  responseMap.set(echo, { e, timer });
}

export function handleResponse(echo, msgObj) {
  const entry = responseMap.get(echo);
  if (!entry) return false;
  responseMap.delete(echo);
  if (entry.timer) clearTimeout(entry.timer);

  let msg = '';
  try {
    let res = msgObj;
    if (typeof msgObj === 'string') {
      try {
        res = JSON.parse(msgObj);
      } catch {
        res = msgObj;
      }
    }
    if (typeof res === 'object' && res !== null && res.post_type === 'response') {
      msg = String(res.data ?? res.message ?? JSON.stringify(res));
    } else if (typeof res === 'object' && res !== null) {
      if ('data' in res) {
        msg = String(res.data);
      } else if ('message' in res) {
        msg = String(res.message);
      } else {
        msg = JSON.stringify(res);
      }
      if ('status' in res) {
        msg = `[${res.status}] ` + msg;
      }
      if ('code' in res) {
        msg = `[code=${res.code}] ` + msg;
      }
    } else {
      msg = String(res);
    }
    entry.e.reply(msg.trim());
  } catch (err) {
    logger.error(`[MC-PLUGIN] 发送响应消息失败: echo=${echo}, err=${err.message}`);
  }
  return true;
}
