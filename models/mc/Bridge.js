import Config from '../../components/Config.js'
import { LOG_PREFIX_CLIENT, LOG_PREFIX_WS } from '../../components/logging/prefixes.js'
import { createClient, createReverseClient } from '@cikeyqi/queqiao-node-sdk'
import { bindClientEvents, buildForwardList, buildForwardOptions, buildReverseOptions } from './bridge/client.js'
import { sendGroupMessage } from './bridge/dispatch.js'
import { formatEvent, resolveEventData } from './bridge/event.js'
import { clientQueue, connectedNames, namesOf, namesForRoute, statusOf } from './bridge/route.js'
import { isRecord, textOf, toError, toJson } from './bridge/utils.js'

/**
 * @typedef {import('@cikeyqi/queqiao-node-sdk').QueQiaoClient} QueQiaoClient
 * @typedef {import('@cikeyqi/queqiao-node-sdk').RequestOptions} RequestOptions
 *
 * @typedef GroupRequest
 * @property {string} api
 * @property {Record<string, unknown>} data
 * @property {RequestOptions} [options]
 * @property {string} [debugAction]
 * @property {string} [errorReply]
 */

export class McBridge {
  constructor () {
    /** @type {QueQiaoClient | null} */
    this.forwardClient = null
    /** @type {QueQiaoClient | null} */
    this.reverseClient = null
    /** @type {boolean} */
    this.debugMode = false
    /** @type {boolean} */
    this.booted = false
    /** @type {Promise<void> | null} */
    this.bootTask = null

    this.boot()
  }

  async boot (force = false) {
    if (!force && this.booted) return
    if (!force && this.bootTask) return this.bootTask
    if (force && this.bootTask) await this.bootTask

    this.bootTask = this.startClients()
      .then(() => {
        this.booted = true
      })
      .catch((error) => {
        this.booted = false
        logger.error(LOG_PREFIX_WS + `初始化失败: ${toError(error)}`)
      })
      .finally(() => {
        this.bootTask = null
      })

    return this.bootTask
  }

  async reconnect () {
    Config.reloadConfig()
    this.booted = false
    await this.boot(true)
  }

  async startClients () {
    let config = Config.getConfig()
    if (!config) {
      logger.error(LOG_PREFIX_WS + '无法获取配置，QueQiao 服务无法启动')
      return
    }

    this.debugMode = Boolean(config.debug_mode)
    await this.closeClients()

    if (config.mc_qq_ws_server) {
      await this.startReverse(config)
    }
    await this.startForward(config)
  }

  async closeClients () {
    let closeJobs = [
      this.forwardClient?.close?.(),
      this.reverseClient?.close?.()
    ].filter(Boolean).map((job) => Promise.resolve(job).catch(() => undefined))

    await Promise.allSettled(closeJobs)
    this.forwardClient = null
    this.reverseClient = null
  }

  async startForward (config) {
    let forwardList = buildForwardList(config, LOG_PREFIX_WS)
    if (!forwardList.length) {
      if (this.debugMode) logger.info(LOG_PREFIX_WS + '未配置可用的正向连接')
      return
    }

    let forwardOptions = buildForwardOptions(config)

    this.forwardClient = createClient(
      forwardList,
      Object.keys(forwardOptions).length ? forwardOptions : undefined
    )

    this.bindEvents(this.forwardClient, 'forward')

    try {
      await this.forwardClient.connect()
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `正向连接启动失败: ${toError(error)}`)
    }
  }

  async startReverse (config) {
    let serverPort = Number(config.mc_qq_ws_port)
    let serverPath = textOf(config.mc_qq_ws_url)
    if (!serverPort || !serverPath) {
      logger.error(LOG_PREFIX_WS + '反向连接端口或路径未配置')
      return
    }

    let reverseOptions = buildReverseOptions(config)

    this.reverseClient = createReverseClient(
      { port: serverPort, path: serverPath },
      Object.keys(reverseOptions).length ? reverseOptions : undefined
    )

    this.bindEvents(this.reverseClient, 'reverse')

    try {
      await this.reverseClient.connect()
      logger.mark(LOG_PREFIX_WS + `监听地址: ${logger.green(`ws://localhost:${serverPort}${serverPath}`)}`)
    } catch (error) {
      logger.error(LOG_PREFIX_WS + `反向连接启动失败: ${toError(error)}`)
    }
  }

  bindEvents (client, modeName) {
    bindClientEvents({
      client,
      modeName,
      logPrefix: LOG_PREFIX_WS,
      onEvent: (eventData) => this.handleEvent(eventData)
    })
  }

  handleEvent (eventData) {
    let rawEvent = resolveEventData(eventData)
    if (!rawEvent) return

    if (!textOf(rawEvent.server_name)) {
      let names = this.connectedNames()
      if (names.length === 1) {
        rawEvent = { ...rawEvent, server_name: names[0] }
      }
    }

    if (this.debugMode) {
      logger.mark(LOG_PREFIX_WS + ' 收到事件: ' + logger.green(toJson(rawEvent)))
    }

    let config = Config.getConfig()
    let messageText = formatEvent(rawEvent, config)
    if (!messageText) return

    let serverName = textOf(rawEvent.server_name)
    let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
    let serverItem = serverList.find((item) => textOf(item.server_name) === serverName)

    if (!serverItem) {
      if (this.debugMode) logger.info(LOG_PREFIX_WS + `服务器 ${serverName || 'unknown'} 未在配置中，忽略消息`)
      return
    }

    this.dispatchGroups(messageText, serverItem)
  }

  dispatchGroups (messageText, serverItem) {
    return sendGroupMessage({
      messageText,
      serverItem,
      debugMode: this.debugMode,
      logPrefix: LOG_PREFIX_WS
    })
  }

  namesOf (client) {
    return namesOf(client)
  }

  statusOf (client) {
    return statusOf(client)
  }

  namesForRoute (client) {
    return namesForRoute(client)
  }

  connectedNames () {
    return connectedNames(this)
  }

  isConnected (serverName = '') {
    let onlineSet = new Set(this.connectedNames())
    return serverName ? onlineSet.has(textOf(serverName)) : onlineSet.size > 0
  }

  groupServers (groupId, config = Config.getConfig()) {
    let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
    let groupText = String(groupId)

    return serverList.filter((serverItem) => {
      let serverName = textOf(serverItem?.server_name)
      if (!serverName) return false
      let groupList = Array.isArray(serverItem.group_list) ? serverItem.group_list : []
      return groupList.some((item) => String(item) === groupText)
    })
  }

  configServers (config = Config.getConfig()) {
    return Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
  }

  findServerByName (serverName, config = Config.getConfig()) {
    let targetName = textOf(serverName)
    if (!targetName) return null

    return this.configServers(config).find((serverItem) => {
      return textOf(serverItem?.server_name) === targetName
    }) || null
  }

  parseServerSuffix (inputText, config = Config.getConfig()) {
    let rawText = String(inputText ?? '').trim()
    if (!rawText) return { bodyText: '', serverName: '' }

    let nameList = this.configServers(config)
      .map((serverItem) => textOf(serverItem?.server_name))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)

    for (let serverName of nameList) {
      if (rawText === serverName) {
        return { bodyText: '', serverName }
      }

      if (rawText.endsWith(` ${serverName}`)) {
        return {
          bodyText: rawText.slice(0, -serverName.length).trimEnd(),
          serverName
        }
      }
    }

    return { bodyText: rawText, serverName: '' }
  }

  resolveCommandTargets (e, targetServerName = '', config = Config.getConfig()) {
    let explicitServerName = textOf(targetServerName)

    if (explicitServerName) {
      let serverItem = this.findServerByName(explicitServerName, config)
      if (!serverItem) {
        return {
          ok: false,
          errorReply: `未找到服务器「${explicitServerName}」`
        }
      }

      return {
        ok: true,
        isSpecified: true,
        config,
        targets: [{ serverItem, serverName: explicitServerName }]
      }
    }

    if (!e?.isGroup) {
      return {
        ok: false,
        errorReply: '私聊使用时请在命令末尾指定服务器名称'
      }
    }

    let serverList = this.groupServers(e.group_id, config)
    if (!serverList.length) {
      return {
        ok: false,
        errorReply: '当前群未同步任何服务器'
      }
    }

    return {
      ok: true,
      isSpecified: false,
      config,
      targets: serverList.map((serverItem) => ({
        serverItem,
        serverName: textOf(serverItem?.server_name)
      })).filter((item) => item.serverName)
    }
  }

  async eachServer (e, taskRun, config = Config.getConfig()) {
    if (!e?.isGroup) return false

    let serverList = this.groupServers(e.group_id, config)
    if (!serverList.length) {
      if (config?.debug_mode) logger.info(LOG_PREFIX_CLIENT + `群 ${e.group_id} 未关联服务器`)
      return false
    }

    let onlineSet = new Set(this.connectedNames())

    for (let serverItem of serverList) {
      let serverName = textOf(serverItem.server_name)
      if (!serverName) continue

      try {
        await taskRun({
          serverItem,
          serverName,
          config,
          debugMode: Boolean(config?.debug_mode),
          isOnline: onlineSet.has(serverName)
        })
      } catch (error) {
        logger.error(LOG_PREFIX_CLIENT + `${serverName} 请求处理失败: ${toError(error)}`)
      }
    }

    return true
  }

  clientQueue (serverName) {
    return clientQueue(this, serverName)
  }

  /**
   * @param {string} serverName
   * @param {string} api
   * @param {Record<string, unknown>} data
   * @param {RequestOptions} [options]
   */
  async request (serverName, api, data, options = {}) {
    await this.boot()

    let targetName = textOf(serverName)
    if (!targetName) throw new Error('缺少服务器名称')
    if (!textOf(api)) throw new Error('api 必须是非空字符串')
    if (!isRecord(data)) throw new Error('data 必须是对象')

    let clients = this.clientQueue(targetName)
    if (!clients.length) throw new Error(`服务器 ${targetName} 未建立可用连接`)

    let requestOptions = { ...options, selfName: targetName }
    let apiName = api.trim()

    let lastError = null
    for (let client of clients) {
      try {
        return await client.request(apiName, data, requestOptions)
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error(`服务器 ${targetName} 请求失败`)
  }

  /**
   * @param {any} e
   * @param {string | RegExp} pattern
   * @param {(match: RegExpMatchArray, e: any) => GroupRequest | null | undefined | Promise<GroupRequest | null | undefined>} buildRequest
   * @param {string} [actionName]
   */
  async runGroup (e, pattern, buildRequest, actionName = '请求') {
    if (!e?.isGroup) return false

    let commandReg = pattern instanceof RegExp ? pattern : new RegExp(pattern)
    let commandMatch = String(e.msg ?? '').match(commandReg)
    if (!commandMatch) return false

    let requestBody
    try {
      requestBody = await buildRequest(commandMatch, e)
    } catch (error) {
      logger.error(`[MC-PLUGIN] 构建命令请求失败: ${toError(error)}`)
      await e.reply('命令参数解析失败，请检查输入格式')
      return true
    }

    if (!requestBody) return true
    if (requestBody.errorReply) {
      await e.reply(requestBody.errorReply)
      return true
    }

    let { api, data, options, debugAction = actionName } = requestBody

    await this.eachServer(e, async ({ serverName, debugMode }) => {
      try {
        await this.request(serverName, api, data, options)
      } catch (error) {
        if (debugMode) logger.warn(`[MC-PLUGIN] 向 ${serverName} ${debugAction}失败: ${toError(error)}`)
      }
    })

    return true
  }
}

export default new McBridge()
