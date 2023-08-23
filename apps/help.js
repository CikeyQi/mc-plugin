import plugin from '../../../lib/plugins/plugin.js'
import Render from '../components/Render.js'
import { style } from '../resources/help/imgs/config.js'
import _ from 'lodash'

export class help extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'QQ_MC',
            /** 功能描述 */
            dsc: 'MC插件帮助',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#?mc帮助$',
                    /** 执行方法 */
                    fnc: 'sendHelpPic'
                }
            ]
        })
    }
    async sendHelpPic(e) {
        const helpCfg = {
            "themeSet": false,
            "title": "#mc-plugin帮助",
            "subTitle": "Yunzai-Bot & mc-plugin",
            "colWidth": 265,
            "theme": "all",
            "themeExclude": [
                "default"
            ],
            "colCount": 2,
            "bgBlur": true
        }
        const helpList = [
            {
                "group": "MC设置",
                "list": [
                    {
                        "icon": 1,
                        "title": "#mc设置ws路由",
                        "desc": "设置ws路由地址"
                    },
                    {
                        "icon": 5,
                        "title": "#mc设置ws端口",
                        "desc": "设置ws端口"
                    },
                    {
                        "icon": 7,
                        "title": "#mc设置rcon状态",
                        "desc": "设置rcon开启或关闭"
                    },
                    {
                        "icon": 11,
                        "title": "#mc设置rcon地址",
                        "desc": "设置rcon地址"
                    },
                    {
                        "icon": 54,
                        "title": "#mc设置rcon端口",
                        "desc": "设置rcon端口"
                    },
                    {
                        "icon": 86,
                        "title": "#mc设置rcon密码",
                        "desc": "设置rcon密码"
                    },
                    {
                        "icon": 3,
                        "title": "#mc设置群名显示",
                        "desc": "服务器中群名显示开启或关闭"
                    },
                    {
                        "icon": 38,
                        "title": "#mc设置(开启|关闭)同步",
                        "desc": "控制本群消息与服务器消息同步"
                    },
                    {
                        "icon": 36,
                        "title": "#mc设置命令响应头",
                        "desc": "自定义响MC命令应头'/','~'"
                    }
                ],
            },
            {
                "group": "MC查询",
                "list": [
                    {
                        "icon": 62,
                        "title": "#mc状态",
                        "desc": "查询服务器状态"
                    },
                ]
            }
        ]
        let helpGroup = []
        _.forEach(helpList, (group) => {
            _.forEach(group.list, (help) => {
                let icon = help.icon * 1
                if (!icon) {
                    help.css = 'display:none'
                } else {
                    let x = (icon - 1) % 10
                    let y = (icon - x - 1) / 10
                    help.css = `background-position:-${x * 50}px -${y * 50}px`
                }
            })
            helpGroup.push(group)
        })

        let themeData = await this.getThemeData(helpCfg, helpCfg)
        return await Render.render('help/index', {
            helpCfg,
            helpGroup,
            ...themeData,
            element: 'default'
        }, { e, scale: 1.6 })
    }

    async getThemeCfg() {
        let resPath = '{{_res_path}}/help/imgs/'
        return {
            main: `${resPath}/main.png`,
            bg: `${resPath}/bg.jpg`,
            style: style
        }
    }

    async getThemeData(diyStyle, sysStyle) {
        let helpConfig = _.extend({}, sysStyle, diyStyle)
        let colCount = Math.min(5, Math.max(parseInt(helpConfig?.colCount) || 3, 2))
        let colWidth = Math.min(500, Math.max(100, parseInt(helpConfig?.colWidth) || 265))
        let width = Math.min(2500, Math.max(800, colCount * colWidth + 30))
        let theme = await this.getThemeCfg()
        let themeStyle = theme.style || {}
        let ret = [`
          body{background-image:url(${theme.bg});width:${width}px;}
          .container{background-image:url(${theme.main});width:${width}px;}
          .help-table .td,.help-table .th{width:${100 / colCount}%}
          `]
        let css = function (sel, css, key, def, fn) {
            let val = (function () {
                for (let idx in arguments) {
                    if (!_.isUndefined(arguments[idx])) {
                        return arguments[idx]
                    }
                }
            })(themeStyle[key], diyStyle[key], sysStyle[key], def)
            if (fn) {
                val = fn(val)
            }
            ret.push(`${sel}{${css}:${val}}`)
        }
        css('.help-title,.help-group', 'color', 'fontColor', '#ceb78b')
        css('.help-title,.help-group', 'text-shadow', 'fontShadow', 'none')
        css('.help-desc', 'color', 'descColor', '#eee')
        css('.cont-box', 'background', 'contBgColor', 'rgba(43, 52, 61, 0.8)')
        css('.cont-box', 'backdrop-filter', 'contBgBlur', 3, (n) => diyStyle.bgBlur === false ? 'none' : `blur(${n}px)`)
        css('.help-group', 'background', 'headerBgColor', 'rgba(34, 41, 51, .4)')
        css('.help-table .tr:nth-child(odd)', 'background', 'rowBgColor1', 'rgba(34, 41, 51, .2)')
        css('.help-table .tr:nth-child(even)', 'background', 'rowBgColor2', 'rgba(34, 41, 51, .4)')
        return {
            style: `<style>${ret.join('\n')}</style>`,
            colCount
        }
    }
}