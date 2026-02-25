import { pickOptions, textOf, toError } from './utils.js'

const buildForwardList = (config, logPrefix = '') => {
  let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
  let serverMap = new Map()

  for (let serverItem of serverList) {
    if (!serverItem?.ws_able) continue

    let serverName = textOf(serverItem.server_name)
    let serverUrl = textOf(serverItem.ws_url)
    if (!serverName || !serverUrl) {
      logger.warn(logPrefix + `远程服务器配置 ${serverName || '未命名'} 不完整，已跳过`)
      continue
    }

    serverMap.set(serverName, {
      url: serverUrl,
      selfName: serverName,
      accessToken: textOf(serverItem.ws_password) || undefined
    })
  }

  return [...serverMap.values()]
}

const buildForwardOptions = (config) => {
  return pickOptions(config, [
    'headers',
    'reconnect',
    'reconnectIntervalMs',
    'reconnectMaxIntervalMs',
    'connectTimeoutMs',
    'heartbeatIntervalMs',
    'heartbeatTimeoutMs',
    'requestTimeoutMs',
    'maxPendingRequests',
    'maxPayloadBytes',
    'autoConnect'
  ])
}

const buildReverseOptions = (config) => {
  return {
    ...pickOptions(config, [
      'strictHeaders',
      'rejectDuplicateOrigin',
      'connectTimeoutMs',
      'heartbeatIntervalMs',
      'heartbeatTimeoutMs',
      'requestTimeoutMs',
      'maxPendingRequests',
      'maxPayloadBytes',
      'autoConnect'
    ]),
    ...(textOf(config.mc_qq_ws_password) ? { accessToken: textOf(config.mc_qq_ws_password) } : {})
  }
}

const bindClientEvents = ({ client, modeName, onEvent, logPrefix = '' }) => {
  client.on('connection_open', (serverName) => {
    logger.mark(logPrefix + logger.green(serverName) + ` 已连接 (${modeName})`)
  })

  client.on('connection_close', (serverName, closeCode, closeReason) => {
    logger.mark(logPrefix + logger.yellow(serverName) + ` 已断开 (${modeName}) code=${closeCode} reason=${closeReason || '-'}`)
  })

  client.on('connection_reconnect', (serverName, retryCount, delayMs) => {
    logger.info(logPrefix + `${serverName} 正在重连 (${modeName}) attempt=${retryCount} delayMs=${delayMs}`)
  })

  client.on('connection_error', (serverName, error) => {
    logger.error(logPrefix + logger.red(serverName || 'unknown') + ` 连接错误 (${modeName}): ${toError(error)}`)
  })

  client.on('event', (eventData) => {
    try {
      onEvent(eventData)
    } catch (error) {
      logger.error(logPrefix + `处理入站事件失败: ${toError(error)}`)
    }
  })
}

export { buildForwardList, buildForwardOptions, buildReverseOptions, bindClientEvents }