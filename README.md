![mc-plugin](https://socialify.git.ci/CikeyQi/mc-plugin/image?description=1&font=Raleway&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto)

<img decoding="async" align=right src="resources/readme/girl.png" width="35%">

# MC-PLUGIN🍐

- 一个适用于 [Yunzai 系列机器人框架](https://github.com/yhArcadia/Yunzai-Bot-plugins-index) 的 Minecraft Server 消息互通插件

- 移植于 17TheWord 大佬的 [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)，在使用 Nonebot 的同学请传送

- **使用中遇到问题请加 QQ 群咨询：[707331865](https://qm.qq.com/q/TXTIS9KhO2)**

> [!TIP]
> 群里开了个 Minecraft 服务器，发现一个很好的消息互通插件，就是 17TheWord 大佬的 [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)，但发现 Yunzai 没有，于是把插件移植了过来

## 安装插件

#### 1. 克隆仓库

```
git clone https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
```

> [!NOTE]
> 如果你的网络环境较差，无法连接到 Github，可以使用 [GitHub Proxy](https://mirror.ghproxy.com/) 提供的文件代理加速下载服务
>
> ```
> git clone https://mirror.ghproxy.com/https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
> ```

#### 2. 安装依赖

```
pnpm install --filter=mc-plugin
```

## 插件配置

> [!WARNING]
> 非常不建议手动修改配置文件，本插件已兼容 [Guoba-plugin](https://github.com/guoba-yunzai/guoba-plugin) ，请使用锅巴插件对配置项进行修改

- 请在 [Releases](https://github.com/CikeyQi/mc-plugin/releases) 中下载对应 Minecraft 端的模组、插件或日志监听程序并安装

- 启动一遍 Minecraft 服务器，等待生成配置文件，配置文件一般生成在 模组、插件或日志监听程序所在目录下的 `MC_QQ` 文件夹中的 `config.yml` 文件中，配置文件相关设置请查看文档：[Minecraft 端配置文件](https://github.com/17TheWord/nonebot-plugin-mcqq/wiki/4.-Minecraft%E7%AB%AF%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)，更改配置文件需要重启 Minecraft 服务器才能生效

- 使用 [Guoba-plugin](https://github.com/guoba-yunzai/guoba-plugin) 插件修改插件配置文件。如果机器人服务器有公网请使用反向 WebSocket ，如果 Minecraft 端有公网，请使用正向 WebSocket，只需要连接一个即可开启消息同步。如果需要执行命令请配置 Rcon ，RCON 功能需要 Minecraft 端有公网。更改配置文件需要重启机器人才能生效

- 请将 Minecraft 端配置文件中的 `server_name` 与锅巴中的 `服务器群组配置列表-服务器名称` 保持一致才能正确识别配置（区分大小写）

- 发送 `#mc状态` 如果 WebSocket 已连接即可正常同步消息，如果 Rcon 已连接即可命令控制服务器，如果没有内容说明你没有配置锅巴中的 `服务器群组配置列表` 项

## 功能列表

请使用 `#mc帮助` 获取完整帮助

- [x] 玩家加入 / 离开服务器消息
- [x] 玩家聊天信息发送到群内
- [x] 玩家死亡信息
- [x] 群内使用指令
- [x] 群员聊天文本发送到服务器
- [x] 特殊消息支持
- [x] 多服务器连接
- [x] 断线自动重连
- [x] 正向 / 反向 WebSocke t连接
- [x] 使用 [@kitUIN/ChatImage](https://github.com/kitUIN/ChatImage) 在游戏内显示图片

## 常见问题

1. 什么环境才能使用本插件？
   - 需要机器人所在服务器和 Minecraft 服务器任意一个可以被另一个访问（在同一内网或至少其中一个有公网）
2. 支持哪些服务端？
   - `Spigot插件端`，`Minecraft原版端`，`Fabric端`，`Forge端` 均支持

## 支持与贡献

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力， 当然，你可以对我 [爱发电](https://afdian.net/a/sumoqi) 赞助，呜咪~❤️

有意见或者建议也欢迎提交 [Issues](https://github.com/CikeyQi/mc-plugin/issues) 和 [Pull requests](https://github.com/CikeyQi/mc-plugin/pulls)。

## 相关项目

- [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)：基于 NoneBot 的与 Minecraft Server 互通消息的插件

## 许可证

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。
