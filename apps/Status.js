import plugin from '../../../lib/plugins/plugin.js'

export class Status extends plugin {
  constructor() {
    super({
      name: 'Minecraft Server Status',
      dsc: '查询Minecraft服务器状态',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '#?mc状态.*$',
        fnc: 'status',
      }]
    })

  }

  async status(e) {
    let msg = e.raw_message.replace(/#?mc状态/, '')
    let address = msg.match(/((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}(:\d{1,5})?|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?(:\d{1,5})?/g)
    if (!address) {
      e.reply('请输入正确的服务器地址', true)
      return true
    }
    address = address[0]
    await e.reply(`正在查询服务器(${address})的状态，请稍后...`, true)
    let isDark = new Date().getHours() > 18 || new Date().getHours() < 6
    await e.reply(segment.image(`https://api.mcstatus.io/v2/widget/java/${address}?dark=${isDark}&rounded=true`))
    return true
  }
}
