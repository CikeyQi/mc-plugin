import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/Config.js';
import mcBridge from '../services/mcBridge.js';

const cleanName = (inputText) => String(inputText || '').trim();

const syncGroup = (serverItem, groupId, selfId, isEnable) => {
  const groupList = Array.isArray(serverItem.group_list) ? serverItem.group_list.map(String) : [];
  const botList = Array.isArray(serverItem.bot_self_id) ? serverItem.bot_self_id.map(String) : [];

  if (isEnable) {
    serverItem.group_list = [...new Set([...groupList, groupId])];
    serverItem.bot_self_id = [...new Set([...botList, selfId])];
    return;
  }

  serverItem.group_list = groupList.filter((item) => item !== groupId);
  serverItem.bot_self_id = botList.filter((item) => item !== selfId);
};

export class Setting extends plugin {
  constructor() {
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
    });
  }

  async setting(e) {
    if (!e.group_id) {
      await e.reply('请在群内使用此功能');
      return true;
    }

    const msgMatch = String(e.msg ?? '').match(this.rule[0].reg);
    const syncAction = msgMatch?.[1] || '';
    const serverName = cleanName(msgMatch?.[2]);

    if (!serverName) {
      await e.reply('请输入要同步的服务器名称，例如：#mc开启同步Server1');
      return true;
    }

    const config = Config.getConfig();
    const serverList = Array.isArray(config?.mc_qq_server_list) ? config.mc_qq_server_list : [];
    if (!serverList.length) {
      await e.reply('请先在配置文件中添加服务器信息');
      return true;
    }

    const serverItem = serverList.find((item) => cleanName(item.server_name) === serverName);
    if (!serverItem) {
      await e.reply(`未找到服务器「${serverName}」，发送 #mc状态 查看列表`);
      return true;
    }

    const isEnable = syncAction === '开启';
    syncGroup(serverItem, String(e.group_id), String(e.self_id), isEnable);

    if (!Config.setConfig(config)) {
      await e.reply('保存配置失败，请检查文件权限');
      return true;
    }

    await e.reply(isEnable
      ? `已开启与 ${serverName} 的同步`
      : `已关闭与 ${serverName} 的同步`
    );

    return true;
  }

  async reconnect(e) {
    await e.reply('正在重连全部服务器，请稍后...');

    try {
      await mcBridge.reconnect();

      const onlineList = mcBridge.connectedNames();
      await e.reply(
        onlineList.length
          ? `重连完成，当前已连接: ${onlineList.join(', ')}`
          : '重连完成，当前没有可用连接'
      );
    } catch (error) {
      const errorText = error?.message || 'unknown error';
      logger.error(`[MC-PLUGIN] 执行重连失败: ${errorText}`);
      await e.reply(`重连失败: ${errorText}`);
    }

    return true;
  }
}
