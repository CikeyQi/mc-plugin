import Config from "./components/Config.js";
import lodash from "lodash";
import path from "path";
import { pluginRoot } from "./model/path.js";

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
          label: "反向 WebSocket 相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_ws_server",
          label: "WebSocket服务",
          bottomHelpMessage: "启用反向 WebSocket 服务",
          component: "Switch",
        },
        {
          field: "mc_qq_ws_url",
          label: "WebSocket路由",
          bottomHelpMessage: "*非必要请不要修改此项",
          component: "Input",
          componentProps: {
            placeholder: '例：/minecraft/ws',
          },
        },
        {
          field: "mc_qq_ws_port",
          label: "WebSocket端口",
          bottomHelpMessage: "反向 WebSocket 服务监听端口",
          component: "InputNumber",
          componentProps: {
            placeholder: '例：8080',
            min: 1,
            max: 65535,
            step: 1,
          },
        },
        {
          field: "mc_qq_ws_password",
          label: "WebSocket密钥",
          bottomHelpMessage: "反向 WebSocket 服务 Access Token",
          component: "InputPassword",
          componentProps: {
            placeholder: '请输入密钥',
            visible: false,
          },
        },
        {
          component: "Divider",
          label: "信息格式 相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_send_group_name",
          label: "发送群组名称",
          bottomHelpMessage: "是否向MC发送群组名称",
          component: "Switch",
        },
        {
          field: "mc_qq_display_server_name",
          label: "发送服务器名称",
          bottomHelpMessage: "是否向QQ发送服务器名称",
          component: "Switch",
        },
        {
          field: "mc_qq_say_way",
          label: "修饰用户发言",
          bottomHelpMessage: "请输入修饰词",
          component: "Input",
          componentProps: {
            placeholder: '例：说：',
          },
        },
        {
          field: "mc_qq_chat_image_enable",
          label: "发送图片",
          bottomHelpMessage: "搭配ChatImage，可以让图片在游戏内显示",
          component: "Switch",
        },
        {
          component: "Divider",
          label: "服务器 相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "mc_qq_server_list",
          label: "服务器群组配置列表",
          bottomHelpMessage: "请配置群组列表后再使用插件",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "server_name",
                label: "服务器名称",
                bottomHelpMessage: "请输入服务器名称",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '需要与服务器端配置一致，且不能有重复',
                },
              },
              {
                component: "Divider",
                label: "正向 WebSocket 相关配置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "ws_able",
                label: "WebSocket服务",
                bottomHelpMessage: "启用正向 WebSocket 服务",
                component: "Switch",
              },
              {
                field: "ws_url",
                label: "WebSocket地址",
                bottomHelpMessage: "正向 WebSocket 连接地址",
                component: "Input",
                componentProps: {
                  placeholder: '例：ws://127.0.0.1:8081',
                },
              },
              {
                field: "ws_password",
                label: "WebSocket密钥",
                bottomHelpMessage: "正向 WebSocket 服务 Access Token",
                component: "Input",
                componentProps: {
                  placeholder: '请输入密钥',
                },
              },
              {
                field: "ws_max_attempts",
                label: "断连重试次数",
                bottomHelpMessage: "正向 WebSocket 重连最大尝试次数",
                component: "InputNumber",
                componentProps: {
                  placeholder: '例：3',
                  min: 1,
                  max: 999999,
                  step: 1,
                },
              },
              {
                component: "Divider",
                label: "Rcon 相关配置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "rcon_able",
                label: "是否启用Rcon",
                bottomHelpMessage: "若需要向服务器发送指令，请启用Rcon",
                component: "Switch",
              },
              {
                field: "rcon_host",
                label: "Rcon地址",
                bottomHelpMessage: "请输入Rcon地址",
                component: "Input",
                componentProps: {
                  placeholder: '例：127.0.0.1',
                },
              },
              {
                field: "rcon_port",
                label: "Rcon端口",
                bottomHelpMessage: "请输入Rcon端口",
                component: "InputNumber",
                componentProps: {
                  placeholder: '例：25575',
                  min: 1,
                  max: 65535,
                  step: 1,
                },
              },
              {
                field: "rcon_password",
                label: "Rcon密码",
                bottomHelpMessage: "请输入Rcon密码",
                component: "InputPassword",
                componentProps: {
                  placeholder: '与server.properties中的rcon.password一致',
                  visible: false,
                },
              },
              {
                field: "rcon_max_attempts",
                label: "断连重试次数",
                bottomHelpMessage: "Rcon 重连最大尝试次数",
                component: "InputNumber",
                componentProps: {
                  placeholder: '例：3',
                  min: 1,
                  max: 999999,
                  step: 1,
                },
              },
              {
                component: "Divider",
                label: "群组同步 相关配置",
                componentProps: {
                  orientation: "left",
                  plain: true,
                },
              },
              {
                field: "group_list",
                label: "开启同步群组列表",
                bottomHelpMessage: "此群组将与当前服务器同步消息",
                component: "GTags",
                required: true,
                componentProps: {
                  placeholder: '请输入群组ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入群组ID',
                    placeholder: '例：551081559',
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
                label: "推送机器人列表",
                bottomHelpMessage: "将使用此机器人向群组发送消息",
                component: "GTags",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入机器人ID',
                    placeholder: '例：10001',
                    okText: '添加',
                    rules: [
                      { required: true, message: '群组ID不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                field: "command_header",
                label: "指令前缀",
                bottomHelpMessage: "请输入指令前缀",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '例：/',
                },
              },
              {
                field: "command_user",
                label: "可用指令的用户",
                bottomHelpMessage: "请输入可用指令的用户ID",
                component: "GTags",
                required: true,
                componentProps: {
                  placeholder: '请输入可用指令的用户ID',
                  allowAdd: true,
                  allowDel: true,
                  showPrompt: true,
                  promptProps: {
                    content: '请输入可用指令的用户ID',
                    placeholder: '例：10001',
                    okText: '添加',
                    rules: [
                      { required: true, message: '用户ID不能为空' },
                    ],
                  },
                  valueParser: ((value) => value.split(',') || []),
                },
              },
              {
                field: "mask_word",
                label: "屏蔽词正则表达式",
                bottomHelpMessage: "请输入屏蔽词正则表达式",
                component: "Input",
                componentProps: {
                  placeholder: '例：§.',
                },
              },
            ],
          },
        },
        {
          field: "debug_mode",
          label: "调试模式",
          bottomHelpMessage: "是否开启调试模式",
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
        Config.setConfig(config)
        return Result.ok({}, '保存成功~')
      },
    },
  }
}