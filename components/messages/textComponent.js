export function toTextComponent(text, color = 'white') {
  return {
    text: String(text ?? ''),
    color
  };
}

export function toTextComponentArray(text, color = 'white') {
  return [toTextComponent(text, color)];
}
