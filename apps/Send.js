import plugin from '../../../lib/plugins/plugin.js'
import mcBridge from '../models/mc/index.js'
import {
  buildActionbarRequest,
  buildBroadcastRequest,
  buildPrivateRequest,
  buildTitleRequest
} from '../models/mc/QuickSend.js'
import { allowCommand, formatCommandResult } from '../models/chat/index.js'

const SPECIFIED_SERVER_MASTER_REPLY = '指定服务器执行仅主人可用'

const readMatch = (e, pattern) => {
  let commandReg = pattern instanceof RegExp ? pattern : new RegExp(pattern)
  return String(e.msg ?? '').match(commandReg)
}

const parseTargetText = (rawText) => {
  return mcBridge.parseServerSuffix(String(rawText ?? ''))
}

const resolveTargets = async (e, targetServerName) => {
  let route = mcBridge.resolveCommandTargets(e, targetServerName)
  if (!route.ok) {
    await e.reply(route.errorReply)
    return null
  }

  if (route.isSpecified && !e.isMaster) {
    await e.reply(SPECIFIED_SERVER_MASTER_REPLY)
    return null
  }

  return route
}

const runRoutedRequest = async (e, pattern, buildPayload, actionName) => {
  let match = readMatch(e, pattern)
  if (!match) return false

  let payload
  try {
    payload = await buildPayload(match, e)
  } catch (error) {
    logger.error(`[MC-PLUGIN] 构建命令请求失败: ${error?.message || 'unknown error'}`)
    await e.reply('命令参数解析失败，请检查输入格式')
    return true
  }

  if (!payload) return true

  let { requestBody, targetServerName = '' } = payload
  if (!requestBody) return true
  if (requestBody.errorReply) {
    await e.reply(requestBody.errorReply)
    return true
  }

  let route = await resolveTargets(e, targetServerName)
  if (!route) return true

  let { api, data, options, debugAction = actionName } = requestBody
  let debugMode = Boolean(route.config?.debug_mode)

  for (let { serverName } of route.targets) {
    try {
      await mcBridge.request(serverName, api, data, options)
    } catch (error) {
      if (debugMode) {
        logger.warn(`[MC-PLUGIN] 向${serverName} ${debugAction}失败: ${error?.message || 'unknown error'}`)
      }
    }
  }

  return true
}

const parseCommandText = (rawText) => String(rawText ?? '').trim().replace(/^\/+/, '').trim()

export class ActionBar extends plugin {
  constructor () {
    super({
      name: 'MCQQ-动作栏消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc动作栏\\s+(.+)$', fnc: 'actionBar' }]
    })
  }

  async actionBar (e) {
    return runRoutedRequest(e, this.rule[0].reg, (match) => {
      let { bodyText, serverName } = parseTargetText(match[1])
      return {
        requestBody: buildActionbarRequest(bodyText),
        targetServerName: serverName
      }
    }, '发送动作栏')
  }
}

export class Private extends plugin {
  constructor () {
    super({
      name: 'MCQQ-私聊消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc私聊\\s+(\\S+)\\s+(.+)$', fnc: 'private' }]
    })
  }

  async private (e) {
    return runRoutedRequest(e, this.rule[0].reg, (match) => {
      let targetName = String(match?.[1] ?? '').trim()
      let { bodyText, serverName } = parseTargetText(match[2])
      return {
        requestBody: buildPrivateRequest({ targetName, targetText: bodyText }),
        targetServerName: serverName
      }
    }, '发送私聊')
  }
}

export class Title extends plugin {
  constructor () {
    super({
      name: 'MCQQ-标题消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc标题\\s+(.+)$', fnc: 'title' }]
    })
  }

  async title (e) {
    return runRoutedRequest(e, this.rule[0].reg, (match) => {
      let { bodyText, serverName } = parseTargetText(match[1])
      return {
        requestBody: buildTitleRequest(bodyText, 'title', '请输入要发送的标题内容'),
        targetServerName: serverName
      }
    }, '发送标题')
  }
}

export class Subtitle extends plugin {
  constructor () {
    super({
      name: 'MCQQ-副标题消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc副标题\\s+(.+)$', fnc: 'subTitle' }]
    })
  }

  async subTitle (e) {
    return runRoutedRequest(e, this.rule[0].reg, (match) => {
      let { bodyText, serverName } = parseTargetText(match[1])
      return {
        requestBody: buildTitleRequest(bodyText, 'subtitle', '请输入要发送的副标题内容'),
        targetServerName: serverName
      }
    }, '发送副标题')
  }
}

export class Broadcast extends plugin {
  constructor () {
    super({
      name: 'MCQQ-广播消息',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc广播\\s+(.+)$', fnc: 'broadcast' }]
    })
  }

  async broadcast (e) {
    return runRoutedRequest(e, this.rule[0].reg, (match) => {
      let { bodyText, serverName } = parseTargetText(match[1])
      return {
        requestBody: buildBroadcastRequest(bodyText),
        targetServerName: serverName
      }
    }, '发送广播')
  }
}

export class Command extends plugin {
  constructor () {
    super({
      name: 'MCQQ-RCON命令',
      event: 'message',
      priority: 1008,
      rule: [{ reg: '^#?mc命令\\s+(.+)$', fnc: 'command' }]
    })
  }

  async command (e) {
    let match = readMatch(e, this.rule[0].reg)
    if (!match) return false

    let { bodyText, serverName } = parseTargetText(match[1])
    let commandText = parseCommandText(bodyText)
    if (!commandText) {
      await e.reply('请输入要执行的命令')
      return true
    }

    let route = await resolveTargets(e, serverName)
    if (!route) return true

    let debugMode = Boolean(route.config?.debug_mode)
    let sentCount = 0

    for (let { serverName: currentServer, serverItem } of route.targets) {
      if (!route.isSpecified && !allowCommand(serverItem, e, commandText)) continue
      sentCount += 1

      try {
        let replyData = await mcBridge.request(
          currentServer,
          'send_rcon_command',
          { command: commandText },
          { timeoutMs: 5000 }
        )

        let replyText = formatCommandResult(replyData)
        let showServerName = route.targets.length > 1
        await e.reply(showServerName ? `[${currentServer}] ${replyText}` : replyText)

        if (debugMode) logger.info(`[MC-PLUGIN] 已向 ${currentServer} 发送命令: ${commandText}`)
      } catch (error) {
        let errorText = error?.message || 'unknown error'
        logger.error(`[MC-PLUGIN] 向${currentServer} 发送命令失败: ${errorText}`)
        await e.reply(`向${currentServer} 发送命令失败: ${errorText}`)
      }
    }

    if (!sentCount) {
      await e.reply('你没有权限执行该命令')
    }

    return true
  }
}
