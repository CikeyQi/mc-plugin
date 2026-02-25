import plugin from '../../../lib/plugins/plugin.js'
import Render from '../components/Render.js'
import { buildHelpGroup, getHelpCfg, getHelpList, getThemeData } from '../models/help/index.js'

export class help extends plugin {
  constructor () {
    super({
      name: 'MCQQ-插件帮助',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#?mc帮助$',
          fnc: 'sendHelpPic'
        }
      ]
    })
  }

  async sendHelpPic (e) {
    let helpCfg = getHelpCfg()
    let helpGroup = buildHelpGroup(getHelpList())
    let themeData = await getThemeData(helpCfg, helpCfg)

    return await Render.render('help/index', {
      helpCfg,
      helpGroup,
      ...themeData,
      element: 'default'
    }, { e, scale: 1.6 })
  }
}
