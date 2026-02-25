import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/Config.js'
import mcBridge from '../models/mc/index.js'
import { allowCommand, readCommand, toMcMessage, formatCommandResult } from '../models/chat/index.js'

export class Main extends plugin {
  constructor () {
    super({
      name: 'MCQQ-聊天消息',
      event: 'message',
      priority: 1009,
      rule: [{ reg: '', fnc: 'handleSync', log: true }]
    })
  }

  async handleSync (e) {
    if (!e.isGroup) return false

    let config = Config.getConfig()
    await mcBridge.eachServer(e, async ({ serverItem, serverName, debugMode }) => {
      let commandText = readCommand(e.msg, serverItem)
      if (commandText !== null) {
        if (allowCommand(serverItem, e, commandText)) {
          await this.sendCommand(e, serverName, commandText, debugMode)
        }
        return
      }

      try {
        await mcBridge.request(serverName, 'broadcast', { message: toMcMessage(e, config, serverItem) })
      } catch (error) {
        if (debugMode) {
          logger.warn(`[MC-PLUGIN] 向 ${serverName} 同步群聊失败: ${error?.message || 'unknown error'}`)
        }
      }
    }, config)

    return false
  }

  async sendCommand (e, serverName, commandText, debugMode) {
    if (!commandText) {
      await e.reply('请输入要执行的命令')
      return
    }

    try {
      let replyData = await mcBridge.request(serverName, 'send_rcon_command', { command: commandText }, { timeoutMs: 5000 })
      await e.reply(formatCommandResult(replyData))
      if (debugMode) logger.info(`[MC-PLUGIN] 已向 ${serverName} 发送命令: ${commandText}`)
    } catch (error) {
      let errorText = error?.message || 'unknown error'
      logger.error(`[MC-PLUGIN] 向 ${serverName} 发送命令失败: ${errorText}`)
      await e.reply(`向 ${serverName} 发送命令失败: ${errorText}`)
    }
  }
}
