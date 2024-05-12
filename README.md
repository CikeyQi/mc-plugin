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

- Minecraft 端安装后会自行生成配置文件，相关设置请查看文档：[Minecraft端配置文件](https://github.com/17TheWord/nonebot-plugin-mcqq/wiki/4.-Minecraft%E7%AB%AF%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)

- 请将Minecraft端配置文件中的 `server_name` 与锅巴中的 `服务器群组配置列表-服务器名称` 保持一致（区分大小写）

## 功能列表

请使用 `#mc帮助` 获取完整帮助

- [x] 玩家加入 / 离开服务器消息
- [x] 玩家聊天信息发送到群内
- [x] 玩家死亡信息（死亡信息为英文，非插件服务端不适用）
- [x] 群内使用指令
- [x] 群员聊天文本发送到服务器
- [x] 特殊消息支持
- [x] 多服务器连接
- [x] 断线自动重连

## 常见问题

1. 什么环境才能使用本插件？
   - 需要机器人所在服务器和 Minecraft 服务器均可互相访问（在同一内网或都有公网）
   - Minecraft 服务器除了游戏端口 `25565` 还需要另一个端口做 Rcon 服务端口
   - 机器人服务器需要有一个端口做 WebSocket 服务端口
2. 支持哪些服务端？
   - `Spigot插件端`，`Minecraft原版端`，`Fabric端`，`Forge端` 均支持

## 支持与贡献

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力， 当然，你可以对我 [爱发电](https://afdian.net/a/sumoqi) 赞助，呜咪~❤️

有意见或者建议也欢迎提交 [Issues](https://github.com/CikeyQi/mc-plugin/issues) 和 [Pull requests](https://github.com/CikeyQi/mc-plugin/pulls)。

## 相关项目

- [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)：基于 NoneBot 的与 Minecraft Server 互通消息的插件

## 许可证

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。
