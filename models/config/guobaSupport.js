import Config from '../../components/Config.js'
import lodash from 'lodash'
import path from 'path'
import { pluginRoot } from '../path.js'

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'mc-plugin',
      title: '我的世界插件',
      author: ['@CikeyQi', '@erzaozi'],
      authorLink: ['https://github.com/erzaozi', 'https://github.com/CikeyQi'],
      link: 'https://github.com/CikeyQi/mc-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '基于 Yunzai 的 Minecraft 消息互通插件',
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: 'noto:video-game',
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: '#1bb61e',
      // 如果想要显示成图片，也可以填写图标路径（绝对路径）
      iconPath: path.join(pluginRoot, 'resources/readme/girl.png'),
    },
    configInfo: {
      schemas: [
        {
          component: "Divider",
          label: "全局行为",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_send_group_name",
          label: "发送群名",
          bottomHelpMessage: "群消息转发到 MC 时是否携带群名",
          component: "Switch",
        },
        {
          field: "mc_qq_display_server_name",
          label: "显示服务器名",
          bottomHelpMessage: "MC 消息转发到群时是否显示服务器名",
          component: "Switch",
        },
        {
          field: "mc_qq_say_way",
          label: "连接词",
          bottomHelpMessage: "玩家名与消息之间的连接词",
          component: "Input",
          componentProps: {
            placeholder: '说：',
          },
        },
        {
          component: "Divider",
          label: "反向连接",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_ws_server",
          label: "启用反向连接",
          bottomHelpMessage: "是否启用反向 WebSocket",
          component: "Switch",
        },
        {
          field: "mc_qq_ws_url",
          label: "路径",
          bottomHelpMessage: "反向 WebSocket 路径",
          component: "Input",
          componentProps: {
            placeholder: '/minecraft/ws',
          },
        },
        {
          field: "mc_qq_ws_port",
          label: "端口",
          bottomHelpMessage: "反向 WebSocket 端口",
          component: "InputNumber",
          componentProps: {
            placeholder: '8080',
            min: 1,
            max: 65535,
            step: 1,
          },
        },
        {
          field: "mc_qq_ws_password",
          label: "令牌",
          bottomHelpMessage: "反向连接 access_token",
          component: "InputPassword",
          componentProps: {
            visible: false,
          },
        },
        {
          component: "Divider",
          label: "服务器列表",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_server_list",
          label: "服务器列表",
          bottomHelpMessage: "请配置群组列表后再使用插件",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                component: "Divider",
                label: "路由映射",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "server_name",
                label: "服务器名称",
                bottomHelpMessage: "必须与 QueQiao 的 server_name 完全一致",
                component: "Input",
                required: true,
              },
              {
                field: "group_list",
                label: "群聊列表",
                bottomHelpMessage: "群聊列表，消息将转发到列表中的群聊",
                component: "GTags",
                componentProps: {
                  placeholder: '请输入群组ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入群组ID',
                    okText: '添加',
                    rules: [
                      { required: true, message: '群组ID不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                field: "bot_self_id",
                label: "机器人列表",
                bottomHelpMessage: "负责发送群消息的机器人 selfId 列表",
                component: "GTags",
                componentProps: {
                  placeholder: '请输入机器人ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入机器人ID',
                    okText: '添加',
                    rules: [
                      { required: true, message: '机器人ID不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                component: "Divider",
                label: "连接设置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "ws_able",
                label: "启用正向连接",
                bottomHelpMessage: "是否启用该服务器的正向连接",
                component: "Switch",
              },
              {
                field: "ws_url",
                label: "URL",
                bottomHelpMessage: "正向 WebSocket 地址",
                component: "Input",
                componentProps: {
                  placeholder: 'ws://127.0.0.1:8081',
                },
              },
              {
                field: "ws_password",
                label: "令牌",
                bottomHelpMessage: "正向连接 access_token",
                component: "Input",
              },
              {
                field: "ws_max_attempts",
                label: "最大重试次数",
                bottomHelpMessage: "最大重连次数，0 表示不限次数",
                component: "InputNumber",
                componentProps: {
                  placeholder: '3',
                  step: 1,
                },
              },
              {
                component: "Divider",
                label: "命令设置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "command_header",
                label: "RCON前缀",
                bottomHelpMessage: "群内 RCON 前缀，例如 /list",
                component: "Input",
                componentProps: {
                  placeholder: '/',
                },
              },
              {
                field: "command_user",
                label: "用户白名单",
                bottomHelpMessage: "群内前缀 RCON 白名单",
                component: "GTags",
                componentProps: {
                  placeholder: '请输入可用指令的用户ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入可用指令的用户ID',
                    okText: '添加',
                    rules: [
                      { required: true, message: '用户ID不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                field: "rcon_command_whitelist",
                label: "命令白名单",
                bottomHelpMessage: "群内前缀 RCON 命令白名单",
                component: "GTags",
                componentProps: {
                  placeholder: '请输入白名单命令',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入白名单命令',
                    placeholder: 'list',
                    okText: '添加',
                    rules: [
                      { required: true, message: '命令不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                component: "Divider",
                label: "同步设置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "mc_qq_chat_image_enable",
                label: "启用CICode图片",
                bottomHelpMessage: "是否将图片转换为 CICode 再发送到 MC",
                component: "Switch",
              },
              {
                field: "mask_word",
                label: "过滤正则",
                bottomHelpMessage: "转发到群前的过滤正则（无需写 /.../g）",
                component: "Input",
              },
            ],
          },
        },
        {
          component: "Divider",
          label: "调试",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "debug_mode",
          label: "调试模式",
          bottomHelpMessage: "是否输出调试日志",
          component: "Switch",
        },
      ],
      getConfigData() {
        let config = Config.getConfig()
        return config
      },

      setConfigData(data, { Result }) {
        let config = {}
        for (let [keyPath, value] of Object.entries(data)) {
          lodash.set(config, keyPath, value)
        }
        config = lodash.merge({}, Config.getConfig(), config)
        config.mc_qq_server_list = data['mc_qq_server_list']
        if (!Config.setConfig(config)) {
          return Result.error('保存失败，请检查文件权限')
        }
        return Result.ok({}, '保存成功~')
      },
    },
  }
}
