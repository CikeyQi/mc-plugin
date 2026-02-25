import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/Config.js'
import mcBridge from '../models/mc/index.js'
import { cleanName, findServerByName, syncGroup } from '../models/setting/GroupSync.js'
import { renderStatusText } from '../models/status/StatusText.js'
import { runAppUpdate } from '../models/update/index.js'

export class Setting extends plugin {
  constructor () {
    super({
      name: 'MCQQ-同步设置',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '#?mc(开启|关闭)同步(.*)$',
          fnc: 'setting',
          permission: 'master'
        },
        {
          reg: '#?mc重连$',
          fnc: 'reconnect',
          permission: 'master'
        }
      ]
    })
  }

  async setting (e) {
    if (!e.group_id) {
      await e.reply('请在群内使用此功能')
      return true
    }

    let msgMatch = String(e.msg ?? '').match(this.rule[0].reg)
    let syncAction = msgMatch?.[1] || ''
    let serverName = cleanName(msgMatch?.[2])

    if (!serverName) {
      await e.reply('请输入要同步的服务器名称，例如：#mc开启同步Server1')
      return true
    }

    let config = Config.getConfig()
    let serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : []
    if (!serverList.length) {
      await e.reply('请先在配置文件中添加服务器信息')
      return true
    }

    let serverItem = findServerByName(config, serverName)
    if (!serverItem) {
      await e.reply(`未找到服务器「${serverName}」，发送 #mc状态 查看列表`)
      return true
    }

    let isEnable = syncAction === '开启'
    syncGroup(serverItem, String(e.group_id), String(e.self_id), isEnable)

    if (!Config.setConfig(config)) {
      await e.reply('保存配置失败，请检查文件权限')
      return true
    }

    await e.reply(isEnable ? `已开启与 ${serverName} 的同步` : `已关闭与 ${serverName} 的同步`)
    return true
  }

  async reconnect (e) {
    await e.reply('正在重连全部服务器，请稍后...')

    try {
      await mcBridge.reconnect()

      let onlineList = mcBridge.connectedNames()
      await e.reply(
        onlineList.length
          ? `重连完成，当前已连接: ${onlineList.join(', ')}`
          : '重连完成，当前没有可用连接'
      )
    } catch (error) {
      let errorText = error?.message || 'unknown error'
      logger.error(`[MC-PLUGIN] 执行重连失败: ${errorText}`)
      await e.reply(`重连失败: ${errorText}`)
    }

    return true
  }
}

export class Status extends plugin {
  constructor () {
    super({
      name: 'MCQQ-连接状态',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '#?mc状态$',
          fnc: 'status'
        }
      ]
    })
  }

  async status (e) {
    try {
      let config = Config.getConfig()
      let text = renderStatusText(config, mcBridge.connectedNames())
      await e.reply(text)
    } catch (error) {
      logger.error(error)
      await e.reply('查询失败，请检查配置文件')
    }

    return true
  }
}

export class Update extends plugin {
  constructor () {
    super({
      name: 'MCQQ-更新插件',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#?mc(插件)?(强制)?更新$',
          fnc: 'update'
        }
      ]
    })
  }

  async update () {
    return runAppUpdate(this)
  }
}
