<div align="center">

# MC-PLUGIN

_🎉 基于 Yunzai-Bot 的与Minecraft Server互通消息的插件 🎉_

</div>

<p align="center">
  </a>
    <img src="./resources/readme/header.png">
  </a>
</p>

---

<span id="header"></span>

<p align="center">
  <img src="https://img.shields.io/badge/Nodejs-16.x+-6BA552.svg" alt="Nodejs">
  <img src="https://img.shields.io/badge/Yunzai_Bot-v3-red.svg" alt="NoneBot">
  <br>
  </a>
    <a href="https://qm.qq.com/q/RnQteOmD84">
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E7%8C%AB%E5%A8%98%E4%B9%90%E5%9B%AD-pink?style=flat-square" alt="QQ Chat Group">
  </a>
</p>

<p align="center">
  <a href="https://github.com/CikeyQi/mc-plugin">项目地址</a>
  ·
  <a href="#安装">开始使用</a>
  ·
  <a href="#文档">配置文档</a>
</p>

<br>

❤：本项目是移植于 17TheWord 大佬的 [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)，在使用Nonebot或熟悉Python的同学请传送

# 安装

#### 1. 挂载至 Yunzai-Bot 目录

```
cd Yunzai-Bot
```

#### 2. 克隆本仓库至 plugins 目录

- 使用 Gitee（国内服务器推荐使用此方法）

```
git clone https://mirror.ghproxy.com/https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
```

- 使用 Github

```
git clone https://github.com/CikeyQi/mc-plugin.git ./plugins/mc-plugin
```

#### 3. 重启 Yunzai

```
pnpm restart
```

<br>

# 文档

- [插件Wiki](https://github.com/CikeyQi/mc-plugin/wiki)

<br>

# 支持的服务端列表

- Spigot API
    - `MC_QQ_Spigot_XXX.jar` + `mc-plugin`
- MinecraftServer
    - `MC_QQ_Minecraft_Server` + `mc-plugin`
- ForgeServer
    - `MC_QQ_Minecraft_Server` + `mc-plugin`
- Fabric
    - `MC_QQ_Minecraft_Server` + `mc-plugin`

<br>

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

- 附加功能
    - 相关查询
        - [x] 服务器状态查询
        - [ ] 正版玩家查询
        - [ ] 物品查询
        - [ ] 合成表查询

<br>

# 致谢

- [@17TheWord](https://github.com/17TheWord) ：服务端文件授权。

<br>

## 许可证

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。
