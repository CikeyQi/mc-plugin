<p align="center">
  </a>
    <img src="./resources/readme/header.png">
  </a>
</p>

# MC-PLUGIN

🎉 基于 Yunzai-Bot 的与Minecraft Server互通消息的插件 🎉

❤：本项目是移植于 17TheWord 大佬的 [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)，在使用Nonebot或熟悉Python的同学请传送

## 安装插件

#### 1. 挂载至 Yunzai-Bot 目录

```
cd Yunzai-Bot
```

#### 2. 克隆本仓库至 plugins 目录

- 使用 Ghproxy（国内服务器推荐使用此方法）

```
git clone https://mirror.ghproxy.com/https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
```

- 使用 Github

```
git clone https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
```

#### 3. 安装依赖

```
pnpm install --filter=mc-plugin
```

#### 4. 重启 Yunzai

```
pnpm restart
```

# 文档

非常不建议手动修改配置文件，本插件已兼容 [Guoba-plugin](https://github.com/guoba-yunzai/guoba-plugin) ，请使用锅巴插件对配置项进行修改

- [插件Wiki](https://github.com/CikeyQi/mc-plugin/wiki)

<br>

# 支持的服务端列表

- Spigot API
    - `MC_QQ_Spigot_xxx.jar` + `mc-plugin` (插件方式)
- ForgeServer
    - `MC_QQ_Forge_xxx.jar` + `mc-plugin` (Mod方式)
    - `Minecraft_Server-xxx.jar` + `mc-plugin` (读日志)
- Fabric
    - `MC_QQ_Fabric_xxx.jar` + `mc-plugin` (Mod方式)
    - `Minecraft_Server-xxx.jar` + `mc-plugin` (读日志)
- MinecraftServer
    - `Minecraft_Server-xxx.jar` + `mc-plugin` (读日志)

# 功能

- 推送消息列表
    - 服务器 -> QQ
        - [x] 加入 / 离开 服务器消息
        - [x] 玩家聊天信息
        - [x] 玩家死亡信息（死亡信息为英文，非插件服务端不适用。）
    - QQ -> 服务器
        - [x] 指令
        - [x] 群员聊天文本
        - [x] 图片、视频等内容转换为 `[图片]`、`[视频]`

- 特殊消息支持
    - 群聊
        - [x] @ 消息
        - [x] 回复消息（转换成@消息）
    - 频道
        - [x] @ 消息
        - [x] 回复消息（转换成@消息）
    - 未支持的消息已被替换，如： `[图片]`、 `[视频]` 等等

# 致谢

- [@17TheWord](https://github.com/17TheWord) ：服务端文件授权。

## 许可证

本项目使用 [MIT](./LICENSE) 作为开源许可证。
