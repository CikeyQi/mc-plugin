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
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E8%92%99%E5%BE%B7%E5%B9%BC%E7%A8%9A%E5%9B%AD%EF%BC%88%E5%B7%B2%E6%BB%A1%EF%BC%89-green?style=flat-square" alt="QQ Chat Group">
  </a>
    <a href="https://jq.qq.com/?_wv=1027&k=OtkECVdE">
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E7%92%83%E6%9C%88%E5%B9%BC%E7%A8%9A%E5%9B%AD%EF%BC%88%E5%B7%B2%E6%BB%A1%EF%BC%89-yellow?style=flat-square" alt="QQ Chat Group">
  </a>
    <a href="https://jq.qq.com/?_wv=1027&k=FZUabhdf">
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E7%A8%BB%E5%A6%BB%E5%B9%BC%E7%A8%9A%E5%9B%AD-purple?style=flat-square" alt="QQ Chat Group">
  </a>
</p>

<p align="center">
  <a href="https://gitee.com/CikeyQi/mc-plugin">项目地址</a>
  ·
  <a href="#安装插件">开始使用</a>
  ·
  <a href="#配置接口">配置接口</a>
</p>




❤：本项目是移植于 17TheWord 大佬的 [nonebot-plugin-mcqq](https://github.com/17TheWord/nonebot-plugin-mcqq)，在使用Nonebot或熟悉Python的同学请传送

<!-- - 支持QQ群、QQ频道
- 支持多个服务器与多个群聊的互通 -->

# 文档

- [原插件文档](https://17theword.github.io/mc_qq/)
- 本插件文档正在制作中，请先参考原插件文档

# 支持的服务端列表

- Spigot API
    - `MC_QQ_Spigot_XXX.jar` + `nonebot-plugin-mcqq`
- MinecraftServer
    - `MC_QQ_Minecraft_Server` + `nonebot-plugin-mcqq`
- ForgeServer
    - `MC_QQ_Minecraft_Server` + `nonebot-plugin-mcqq`
- Fabric
    - `MC_QQ_Minecraft_Server` + `nonebot-plugin-mcqq`

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

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。