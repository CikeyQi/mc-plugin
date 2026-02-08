export function buildMinecraftComponents(e, config) {
  const components = [];
  const prefixGroup = Boolean(config?.mc_qq_send_group_name);
  const saySuffix = config?.mc_qq_say_way || '说：';
  const imageAsCICode = Boolean(config?.mc_qq_chat_image_enable);

  if (prefixGroup && e.group_name) {
    components.push({
      text: `[${e.group_name}] `,
      color: 'aqua'
    });
  }

  const nickname = e.sender?.nickname || e.sender?.card || String(e.user_id ?? '未知用户');
  components.push({ text: nickname, color: 'green' });
  components.push({ text: ` ${saySuffix} `, color: 'white' });

  const elements = Array.isArray(e.message)
    ? e.message
    : [{ type: 'text', text: e.msg ?? '' }];

  elements.forEach((element) => {
    switch (element.type) {
      case 'text':
        components.push({
          text: String(element.text ?? '').replace(/\r/g, '').replace(/\n/g, '\n * '),
          color: 'white'
        });
        break;
      case 'image': {
        const imageUrl = element.url ? String(element.url) : '';
        if (imageAsCICode) {
          components.push({
            text: `[[CICode,url=${imageUrl},name=图片]]`
          });
        } else {
          components.push({
            text: `[图片]`,
            color: 'light_purple',
            hoverEvent: {
              action: 'show_text',
              value: {
                text: '点击跳转至浏览器查看',
                color: 'light_purple'
              }
            },
            clickEvent: {
              action: 'open_url',
              value: imageUrl
            }
          });
        }
        break;
      }
      default:
        components.push({
          text: `[${element.type}] ${element.text || ''}`.trim(),
          color: 'white'
        });
        break;
    }
  });

  return components;
}
