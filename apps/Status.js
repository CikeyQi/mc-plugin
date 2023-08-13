import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'

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
    msg = msg.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '')
    let address = msg.match(/((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}(:\d{1,5})?|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?(:\d{1,5})?/g)
    if (!address) {
      e.reply('请输入正确的服务器地址', true)
      return true
    }
    address = address[0]
    await e.reply(`正在查询服务器(${address})的状态，请稍后...`, true)
    try {
      var res = await fetch(`https://api.mcstatus.io/v2/status/java/${address}`)
    } catch (err) {
      e.reply('查询失败，与查询服务器连接失败，请稍后再试', true)
      return true
    }
    if (res.status !== 200) {
      e.reply('查询失败，请稍后再试', true)
      return true
    }
    let data = await res.json()
    let buffer = await this.createListImage(data)
    await e.reply(segment.image(buffer))
    return true
  }

  async createListImage(data) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
      @font-face {
        font-family: 'Minecraft';
        src: url(../resources/fonts/Minecraft.ttf) format('truetype');
        }
        body {
          background-color: #F2F2F2;
          font-family: Minecraft, sans-serif;
          padding: 20px;
        }
    
        .title {
          font-size: 32px;
          font-weight: bold;
          color: #333333;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        }
    
        .dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          margin-right: 10px;
        }
    
        .table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          background-color: rgba(255, 255, 255, 0.8);
        }
    
        .table th,
        .table td {
          padding: 12px;
          border: 1px solid #CCCCCC;
          text-align: center;
        }
    
        .table th {
          font-weight: bold;
          background-color: #EEEEEE;
          color: #333333;
        }
    
        .table tr:nth-child(even) {
          background-color: #F7F7F7;
        }
    
        .table tr:hover {
          background-color: #EAEAEA;
        }
        
        .label-cell {
          font-weight: bold;
        }
        
        .online-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          color: #FFFFFF;
          font-weight: bold;
        }
        
        .online {
          background-color: #00C853;
        }
        
        .offline {
          background-color: #FF1744;
        }
    
        .server-icon {
          position: absolute;
          top: 20px;
          right: 40px;
          width: 80px;
          height: 80px;
          border-radius: 20%;
        }
    
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 14px;
          color: #777777;
        }
      </style>
    </head>
    <body>
      <h1 class="title">
      <span class="dot ${data.online ? 'online' : 'offline'}"></span>
      Server Information
      </h1>
      <img class="server-icon" src="${data.icon ? data.icon : 'https://api.mcstatus.io/v2/icon'}" alt="Server Icon">
      <table class="table">
        <tr>
          <th>Label</th>
          <th>Value</th>
        </tr>
        <tr>
          <td class="label-cell">Status</td>
          <td>
            <span class="online-status ${data.online ? 'online' : 'offline'}">
              ${data.online ? 'Online' : 'Offline'}
            </span>
          </td>
        </tr>
        <tr>
          <td class="label-cell">Host</td>
          <td>${data.host}</td>
        </tr>
        <tr>
          <td class="label-cell">Port</td>
          <td>${data.port}</td>
        </tr>
        <tr>
          <td class="label-cell">MOTD</td>
          <td><pre>${data.motd.html}</pre></td>
        </tr>
        <tr>
          <td class="label-cell">Version</td>
          <td>${data.version.name_raw}</td>
        </tr>
        <tr>
          <td class="label-cell">Players</td>
          <td>${data.players.online} / ${data.players.max}</td>
        </tr>
        <tr>
          <td class="label-cell">Mods</td>
          <td>
            ${data.mods.length > 0
              ? data.mods.map(mod => `${mod.name} (${mod.version})`).join(', ')
              : 'N/A'
            }
          </td>
        </tr>
        <tr>
          <td class="label-cell">Plugins</td>
          <td>
            ${data.plugins.length > 0
              ? data.plugins.map(plugins => `${plugins.name} (${plugins.version})`).join(', ')
              : 'N/A'
            }
          </td>
        </tr>
        <tr>
          <td class="label-cell">EULA Blocked</td>
          <td>${data.eula_blocked ? 'Yes' : 'No'}</td>
        </tr>
        <tr>
          <td class="label-cell">Protocol Version</td>
          <td>${data.version.protocol} (${data.version.name_clean})</td>
        </tr>
        <tr>
          <td class="label-cell">Software</td>
          <td>${data.software ? data.software : 'N/A'}</td>
        </tr>
      </table>
      <div class="footer">Created By Yunzai-Bot & MC-Plugin</div>
    </body>
    </html>
    `;
  
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const buffer = await page.screenshot({ fullPage: true });
    
    await browser.close();
  
    return buffer;
  }
}
