import Config from '../components/Config.js';
import { LOG_PREFIX_CLIENT, LOG_PREFIX_WS } from '../components/logging/prefixes.js';
import { createClient, createReverseClient } from '@cikeyqi/queqiao-node-sdk';

/** @typedef {import('@cikeyqi/queqiao-node-sdk').QueQiaoClient} QueQiaoClient */
/** @typedef {import('@cikeyqi/queqiao-node-sdk').RequestOptions} RequestOptions */

/**
 * @typedef GroupRequest
 * @property {string} api
 * @property {Record<string, unknown>} data
 * @property {RequestOptions} [options]
 * @property {string} [debugAction]
 * @property {string} [errorReply]
 */

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const textOf = (value) => String(value ?? '').trim();
const toError = (error) => (error instanceof Error ? error.message : String(error?.message || error || 'unknown error'));

const toJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const parseJson = (raw) => {
  if (isRecord(raw)) return raw;
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const pickOptions = (source, keys) => Object.fromEntries(
  keys.flatMap((key) => source?.[key] === undefined ? [] : [[key, source[key]]])
);

const walkText = (node) => {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (Array.isArray(node)) return node.map(walkText).join('');
  if (!isRecord(node)) return '';

  return [
    typeof node.text === 'string' ? node.text : '',
    typeof node.translate === 'string' ? node.translate : '',
    typeof node.key === 'string' ? node.key : '',
    Array.isArray(node.extra) ? node.extra.map(walkText).join('') : '',
    Array.isArray(node.with) ? node.with.map(walkText).join('') : ''
  ].join('');
};

const plainRaw = (raw) => {
  if (raw === null || raw === undefined) return '';
  if (typeof raw !== 'string') return walkText(raw);

  const text = raw.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) return raw;

  const parsed = parseJson(text);
  const plain = parsed ? walkText(parsed) : '';
  return plain || raw;
};

const imageOf = (text) => {
  if (typeof text !== 'string') return { text: String(text ?? ''), url: null };
  const match = text.match(/\[\[CICode,.*?url=([^,\]]+).*?\]\]/i);
  return match
    ? { text: text.replace(/\[\[CICode,.*?\]\]/i, '').trim(), url: match[1] }
    : { text, url: null };
};

const formatEvent = (eventData, config) => {
  const postType = textOf(eventData.post_type);
  if (postType && postType !== 'message' && postType !== 'notice') return null;

  const playerName = textOf(eventData.player?.nickname) || '未知玩家';
  const sayWord = textOf(config?.mc_qq_say_way) || '说：';

  const builders = {
    player_join: () => `${playerName} 加入了游戏`,
    player_quit: () => `${playerName} 退出了游戏`,
    player_death: () => textOf(eventData.death?.text) || textOf(eventData.death?.translate?.text) || `${playerName} 死亡了`,
    player_command: () => `${playerName} 使用命令 ${textOf(eventData.command)}`.trim(),
    player_achievement: () => {
      const title = textOf(eventData.achievement?.translate?.text)
        || textOf(eventData.achievement?.text)
        || textOf(eventData.achievement?.display?.title?.text)
        || textOf(eventData.achievement?.display?.title?.translate?.text)
        || textOf(eventData.achievement?.display?.title);
      if (!title) return null;
      if (textOf(eventData.achievement?.translate?.text) || textOf(eventData.achievement?.text)) return title;
      return `${playerName} 达成了进度 ${title}`;
    },
    player_chat: () => {
      const content = textOf(eventData.message) || textOf(plainRaw(eventData.raw_message));
      return content ? `${playerName} ${sayWord} ${content}`.trim() : null;
    }
  };

  const makeText = builders[eventData.sub_type];
  if (!makeText) return null;

  const body = makeText();
  if (!body) return null;

  if (!config?.mc_qq_display_server_name) return body;
  const serverName = textOf(eventData.server_name) || '未知服务器';
  return `[${serverName}] ${body}`;
};

class McBridge {
  constructor() {
    /** @type {QueQiaoClient | null} */
    this.forwardClient = null;
    /** @type {QueQiaoClient | null} */
    this.reverseClient = null;
    /** @type {boolean} */
    this.debugMode = false;
    /** @type {boolean} */
    this.booted = false;
    /** @type {Promise<void> | null} */
    this.bootTask = null;

    this.boot();
  }

  async boot(force = false) {
    if (!force && this.booted) return;
    if (!force && this.bootTask) return this.bootTask;
    if (force && this.bootTask) await this.bootTask;

    this.bootTask = this.startClients()
      .then(() => {
        this.booted = true;
      })
      .catch((error) => {
        this.booted = false;
        logger.error(LOG_PREFIX_WS + `初始化失败: ${toError(error)}`);
      })
      .finally(() => {
        this.bootTask = null;
      });

    return this.bootTask;
  }

  async reconnect() {
    Config.reloadConfig();
    this.booted = false;
    await this.boot(true);
  }

  async startClients() {
    const config = Config.getConfig();
    if (!config) {
      logger.error(LOG_PREFIX_WS + '无法获取配置，QueQiao 服务无法启动');
      return;
    }

    this.debugMode = Boolean(config.debug_mode);
    await this.closeClients();

    if (config.mc_qq_ws_server) await this.startReverse(config);
    await this.startForward(config);
  }

  async closeClients() {
    const closeJobs = [
      this.forwardClient?.close?.(),
      this.reverseClient?.close?.()
    ].filter(Boolean).map((job) => Promise.resolve(job).catch(() => undefined));

    await Promise.allSettled(closeJobs);
    this.forwardClient = null;
    this.reverseClient = null;
  }

  buildForward(config) {
    const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];
    const serverMap = new Map();

    for (const serverItem of serverList) {
      if (!serverItem?.ws_able) continue;

      const serverName = textOf(serverItem.server_name);
      const serverUrl = textOf(serverItem.ws_url);
      if (!serverName || !serverUrl) {
        logger.warn(LOG_PREFIX_WS + `远程服务器配置 ${serverName || '未命名'} 不完整，已跳过`);
        continue;
      }

      serverMap.set(serverName, {
        url: serverUrl,
        selfName: serverName,
        accessToken: textOf(serverItem.ws_password) || undefined
      });
    }

    return [...serverMap.values()];
  }

  async startForward(config) {
    const forwardList = this.buildForward(config);
    if (!forwardList.length) {
      if (this.debugMode) logger.info(LOG_PREFIX_WS + '未配置可用的正向连接');
      return;
    }

    const forwardOptions = pickOptions(config, [
      'headers',
      'reconnect',
      'reconnectIntervalMs',
      'reconnectMaxIntervalMs',
      'connectTimeoutMs',
      'heartbeatIntervalMs',
      'heartbeatTimeoutMs',
      'requestTimeoutMs',
      'echoTimeoutMs',
      'maxPendingRequests',
      'maxPayloadBytes',
      'autoConnect'
    ]);

    this.forwardClient = createClient(
      forwardList,
      Object.keys(forwardOptions).length ? forwardOptions : undefined
    );

    this.bindEvents(this.forwardClient, 'forward');

    try {
      await this.forwardClient.connect();
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `正向连接启动失败: ${toError(error)}`);
    }
  }

  async startReverse(config) {
    const serverPort = Number(config.mc_qq_ws_port);
    const serverPath = textOf(config.mc_qq_ws_url);
    if (!serverPort || !serverPath) {
      logger.error(LOG_PREFIX_WS + '反向连接端口或路径未配置');
      return;
    }

    const reverseOptions = {
      ...pickOptions(config, [
        'headers',
        'strictHeaders',
        'rejectDuplicateOrigin',
        'requestTimeoutMs',
        'echoTimeoutMs',
        'maxPendingRequests',
        'maxPayloadBytes',
        'autoConnect'
      ]),
      ...(textOf(config.mc_qq_ws_password) ? { accessToken: textOf(config.mc_qq_ws_password) } : {})
    };

    this.reverseClient = createReverseClient(
      { port: serverPort, path: serverPath },
      Object.keys(reverseOptions).length ? reverseOptions : undefined
    );

    this.bindEvents(this.reverseClient, 'reverse');

    try {
      await this.reverseClient.connect();
      logger.mark(LOG_PREFIX_WS + `监听地址: ${logger.green(`ws://localhost:${serverPort}${serverPath}`)}`);
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `反向连接启动失败: ${toError(error)}`);
    }
  }

  bindEvents(client, modeName) {
    client.on('connection_open', (serverName) => {
      logger.mark(LOG_PREFIX_WS + logger.green(serverName) + ` 已连接 (${modeName})`);
    });

    client.on('connection_close', (serverName, closeCode, closeReason) => {
      logger.mark(LOG_PREFIX_WS + logger.yellow(serverName) + ` 已断开 (${modeName}) code=${closeCode} reason=${closeReason || '-'}`);
    });

    client.on('connection_reconnect', (serverName, retryCount, delayMs) => {
      logger.info(LOG_PREFIX_WS + `${serverName} 正在重连 (${modeName}) attempt=${retryCount} delayMs=${delayMs}`);
    });

    client.on('connection_error', (serverName, error) => {
      logger.error(LOG_PREFIX_WS + logger.red(serverName || 'unknown') + ` 连接错误 (${modeName}): ${toError(error)}`);
    });

    client.on('event', (eventData) => {
      try {
        this.handleEvent(eventData);
      } catch (error) {
        logger.error(LOG_PREFIX_WS + `处理入站事件失败: ${toError(error)}`);
      }
    });
  }

  handleEvent(eventData) {
    let rawEvent = isRecord(eventData)
      ? (isRecord(eventData.data) && (
        'post_type' in eventData.data ||
        'event_name' in eventData.data ||
        'sub_type' in eventData.data
      ) ? eventData.data : eventData)
      : eventData;

    rawEvent = parseJson(rawEvent);
    if (!rawEvent) return;

    if (!textOf(rawEvent.server_name)) {
      const names = this.connectedNames();
      if (names.length === 1) rawEvent = { ...rawEvent, server_name: names[0] };
    }

    if (this.debugMode) logger.mark(LOG_PREFIX_WS + ' 收到事件: ' + logger.green(toJson(rawEvent)));

    const config = Config.getConfig();
    const messageText = formatEvent(rawEvent, config);
    if (!messageText) return;

    const serverName = textOf(rawEvent.server_name);
    const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];
    const serverItem = serverList.find((item) => textOf(item.server_name) === serverName);

    if (!serverItem) {
      if (this.debugMode) logger.info(LOG_PREFIX_WS + `服务器 ${serverName || 'unknown'} 未在配置中，忽略消息`);
      return;
    }

    this.dispatchGroups(messageText, serverItem);
  }

  dispatchGroups(messageText, serverItem) {
    const serverName = textOf(serverItem?.server_name) || '未知服务器';
    const botList = Array.isArray(serverItem?.bot_self_id) ? serverItem.bot_self_id.filter(Boolean).map(String) : [];
    const groupList = Array.isArray(serverItem?.group_list) ? serverItem.group_list.filter(Boolean).map(String) : [];

    if (!botList.length || !groupList.length) {
      if (this.debugMode) logger.warn(LOG_PREFIX_WS + `${serverName} 缺少 bot_self_id 或 group_list，忽略消息`);
      return;
    }

    let text = String(messageText ?? '');
    if (textOf(serverItem.mask_word)) {
      try {
        text = text.replace(new RegExp(serverItem.mask_word, 'g'), '');
      } catch {
        logger.warn(LOG_PREFIX_WS + `${serverName} 的屏蔽词正则无效，已忽略`);
      }
    }

    text = text.trim();
    if (!text) return;

    const { text: plainText, url: imageUrl } = imageOf(text);
    const imageSeg = imageUrl && global.segment ? segment.image(imageUrl) : null;
    const payload = imageSeg ? [plainText, imageSeg] : plainText;

    for (const botId of botList) {
      const bot = Bot?.[botId];
      if (!bot) {
        logger.error(LOG_PREFIX_WS + `机器人 ${botId} 不存在或未登录，无法发送消息`);
        continue;
      }

      for (const groupId of groupList) {
        try {
          bot.pickGroup(groupId).sendMsg(payload);
          if (this.debugMode) logger.info(LOG_PREFIX_WS + `机器人 ${botId} 发送到群 ${groupId}`);
        } catch (error) {
          logger.error(LOG_PREFIX_WS + `机器人 ${botId} 发送到群 ${groupId} 失败: ${toError(error)}`);
        }
      }
    }
  }

  namesOf(client) {
    if (!client?.list) return [];

    try {
      const nameList = client.list();
      if (!Array.isArray(nameList)) return [];
      return [...new Set(nameList.map((name) => textOf(name)).filter(Boolean))];
    } catch {
      return [];
    }
  }

  connectedNames() {
    return [...new Set([
      ...this.namesOf(this.reverseClient),
      ...this.namesOf(this.forwardClient)
    ])].sort();
  }

  isConnected(serverName = '') {
    const onlineSet = new Set(this.connectedNames());
    return serverName ? onlineSet.has(textOf(serverName)) : onlineSet.size > 0;
  }

  groupServers(groupId, config = Config.getConfig()) {
    const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];
    const groupText = String(groupId);

    return serverList.filter((serverItem) => {
      const serverName = textOf(serverItem?.server_name);
      if (!serverName) return false;
      const groupList = Array.isArray(serverItem.group_list) ? serverItem.group_list : [];
      return groupList.some((item) => String(item) === groupText);
    });
  }

  async eachServer(e, taskRun, config = Config.getConfig()) {
    if (!e?.isGroup) return false;

    const serverList = this.groupServers(e.group_id, config);
    if (!serverList.length) {
      if (config?.debug_mode) logger.info(LOG_PREFIX_CLIENT + `群 ${e.group_id} 未关联服务器`);
      return false;
    }

    const onlineSet = new Set(this.connectedNames());

    for (const serverItem of serverList) {
      const serverName = textOf(serverItem.server_name);
      if (!serverName) continue;

      try {
        await taskRun({
          serverItem,
          serverName,
          config,
          debugMode: Boolean(config?.debug_mode),
          isOnline: onlineSet.has(serverName)
        });
      } catch (error) {
        logger.error(LOG_PREFIX_CLIENT + `${serverName} 请求处理失败: ${toError(error)}`);
      }
    }

    return true;
  }

  clientQueue(serverName) {
    const base = [this.reverseClient, this.forwardClient].filter(Boolean);
    const hit = base.filter((client) => this.namesOf(client).includes(serverName));
    return [...hit, ...base.filter((client) => !hit.includes(client))];
  }

  /**
   * @param {string} serverName
   * @param {string} api
   * @param {Record<string, unknown>} data
   * @param {RequestOptions} [options]
   */
  async request(serverName, api, data, options = {}) {
    await this.boot();

    const targetName = textOf(serverName);
    if (!targetName) throw new Error('缺少服务器名称');
    if (!textOf(api)) throw new Error('api 必须是非空字符串');
    if (!isRecord(data)) throw new Error('data 必须是对象');

    const clients = this.clientQueue(targetName);
    if (!clients.length) throw new Error(`服务器 ${targetName} 未建立可用连接`);

    const requestOptions = { ...options, selfName: targetName };

    let lastError = null;
    for (const client of clients) {
      try {
        return await client.request(api.trim(), data, requestOptions);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`服务器 ${targetName} 请求失败`);
  }

  /**
   * @param {any} e
   * @param {string | RegExp} pattern
   * @param {(match: RegExpMatchArray, e: any) => GroupRequest | null | undefined | Promise<GroupRequest | null | undefined>} buildRequest
   * @param {string} [actionName]
   */
  async runGroup(e, pattern, buildRequest, actionName = '请求') {
    if (!e?.isGroup) return false;

    const commandReg = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const commandMatch = String(e.msg ?? '').match(commandReg);
    if (!commandMatch) return false;

    let requestBody;
    try {
      requestBody = await buildRequest(commandMatch, e);
    } catch (error) {
      logger.error(`[MC-PLUGIN] 构建命令请求失败: ${toError(error)}`);
      await e.reply('命令参数解析失败，请检查输入格式');
      return true;
    }

    if (!requestBody) return true;
    if (requestBody.errorReply) {
      await e.reply(requestBody.errorReply);
      return true;
    }

    const { api, data, options, debugAction = actionName } = requestBody;

    await this.eachServer(e, async ({ serverName, debugMode }) => {
      try {
        await this.request(serverName, api, data, options);
      } catch (error) {
        if (debugMode) logger.warn(`[MC-PLUGIN] 向 ${serverName} ${debugAction}失败: ${toError(error)}`);
      }
    });

    return true;
  }
}

export default new McBridge();
