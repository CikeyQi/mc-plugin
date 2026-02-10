import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/Config.js';
import mcBridge from '../services/mcBridge.js';

export class Status extends plugin {
  constructor() {
    super({
      name: 'MCQQ-连接状态',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '#?mc(状态| status)$',
          fnc: 'status'
        }
      ]
    });
  }

  async status(e) {
    try {
      const config = Config.getConfig();
      const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];
      const onlineSet = new Set(mcBridge.connectedNames());

      const textList = ['当前连接状态：'];
      for (const serverItem of serverList) {
        const serverName = String(serverItem.server_name || '未命名');
        textList.push('');
        textList.push(`- 服务器名称：${serverName}`);
        textList.push(`- 连接状态：${onlineSet.has(serverName) ? '已连接' : '未连接'}`);
      }

      await e.reply(textList.join('\n'));
    } catch (error) {
      logger.error(error);
      await e.reply('查询失败，请检查配置文件');
    }

    return true;
  }
}
