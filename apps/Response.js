// 响应管理器：用于存储命令echo与e对象的映射，并处理超时和响应
const responseMap = new Map();

/**
 * 存储echo与e对象，并设置超时清理
 * @param {string} echo
 * @param {object} e
 * @param {number} timeoutMs
 */
export function addResponse(echo, e, timeoutMs = 5000) {
    if (!echo || !e) return;
    responseMap.set(echo, e);
    setTimeout(() => {
        if (responseMap.has(echo)) {
            logger.warn(`[MC-PLUGIN] 命令响应超时: echo=${echo}`);
            responseMap.delete(echo);
        }
    }, timeoutMs);
}

/**
 * 根据echo查找e对象，发送消息并清理
 * @param {string} echo
 * @param {string|object} result
 * @returns {boolean} 是否找到并处理
 */
/**
 * 处理WebSocket响应，支持标准结构，优先展示data字段，并增加提示
 * @param {string} echo
 * @param {object|string} result
 * @returns {boolean}
 */
export function handleResponse(echo, result) {
    const e = responseMap.get(echo);
    if (!e) return false;
    responseMap.delete(echo);
    let msg = '';
    try {
        let res = result;
        if (typeof result === 'string') {
            try { res = JSON.parse(result); } catch { res = result; }
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
        e.sendMsg(msg);
    } catch (err) {
        logger.error(`[MC-PLUGIN] 发送响应消息失败: echo=${echo}, err=${err.message}`);
    }
    return true;
}
