const helpCfgTpl = {
  themeSet: false,
  title: 'MC-PLUGIN 帮助',
  subTitle: 'Yunzai-Bot & mc-plugin',
  colWidth: 265,
  theme: 'all',
  themeExclude: ['default'],
  colCount: 2,
  bgBlur: true
}

const helpListTpl = [
  {
    group: 'MC设置',
    list: [
      { icon: 1, title: '#mc状态', desc: '查询连接状态' },
      { icon: 2, title: '#mc重连', desc: '重连全部连接' },
      { icon: 3, title: '#mc开启同步 <服务器名>', desc: '将当前群聊与指定服务器同步' },
      { icon: 4, title: '#mc关闭同步 <服务器名>', desc: '关闭当前群聊与服务器同步' },
      { icon: 5, title: '#mc动作栏 <文本> [服务器名]', desc: '发送动作栏（指定服务器仅主人）' },
      { icon: 6, title: '#mc私聊 <玩家> <文本> [服务器名]', desc: '发送私聊（私聊使用需指定服务器）' },
      { icon: 7, title: '#mc标题 <文本> [服务器名]', desc: '发送标题（指定服务器仅主人）' },
      { icon: 8, title: '#mc副标题 <文本> [服务器名]', desc: '发送副标题（指定服务器仅主人）' },
      { icon: 9, title: '#mc广播 <文本> [服务器名]', desc: '发送广播（指定服务器仅主人）' },
      { icon: 10, title: '#mc命令 <命令> [服务器名]', desc: '发送RCON命令（权限/白名单限制）' }
    ]
  }
]

const clone = (data) => JSON.parse(JSON.stringify(data))

const getHelpCfg = () => clone(helpCfgTpl)
const getHelpList = () => clone(helpListTpl)

export { getHelpCfg, getHelpList }
