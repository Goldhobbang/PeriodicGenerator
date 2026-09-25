// Draw the selected card design directly to a PNG canvas, with no remote assets.
function renderCombinationImage(tokens, details) {
  const width = tokens.length > 1000 ? 3600 : tokens.length > 250 ? 2200 : 1100;
  const padding = 32;
  const cardHeight = 91;
  const gap = 6;
  const rowHeight = cardHeight + 12;
  const swatches = ['#d9eee6', '#eae4f5', '#dcebf8'];
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = '12px "Malgun Gothic", sans-serif';
  const items = [];
  let x = padding;
  let y = padding;
  let maxX = padding;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.literal && token.raw === '\n') { x = padding; y += rowHeight; continue; }
    if (token.literal && /\s/.test(token.raw)) { x += token.raw === '\t' ? 60 : 22; continue; }
    let label = token.raw;
    // The parser uses UTF-16 positions; combine a surrogate pair for one glyph card.
    if (token.literal && /[\uD800-\uDBFF]/.test(label) && tokens[index + 1]?.literal && /[\uDC00-\uDFFF]/.test(tokens[index + 1].raw)) label += tokens[++index].raw;
    const cardWidth = token.element && details.name ? Math.max(70, Math.ceil(probe.measureText(token.element.name).width) + 20) : 70;
    if (x + cardWidth > width - padding && x > padding) { x = padding; y += rowHeight; }
    items.push({ x, y, width: cardWidth, token, label });
    x += cardWidth + gap;
    maxX = Math.max(maxX, x);
  }
  const height = y + rowHeight + padding;
  if (height > 16000) throw new Error('이미지가 너무 깁니다. 입력을 나누어 복사해 주세요.');
  const scale = width <= 2200 && height <= 5000 ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, Math.max(240, maxX + padding)) * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width / scale, height);
  for (const item of items) {
    const { x: left, y: top, width: cardWidth, token, label } = item;
    ctx.beginPath();
    ctx.roundRect(left, top, cardWidth, cardHeight, 7);
    ctx.fillStyle = token.element ? swatches[token.element.number % 3] : '#e9edf0';
    ctx.fill();
    ctx.strokeStyle = token.element ? '#d2dde4' : '#c8d0d6';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = token.element ? '#233b50' : '#5f6d78';
    if (token.element) {
      const element = token.element;
      if (details.number) {
        ctx.font = '10px Consolas, monospace';
        ctx.fillText(String(element.number), left + 10, top + 17);
      }
      if (details.symbol) {
        ctx.font = '32px Georgia, serif';
        ctx.fillText(element.symbol, left + 10, top + 56);
      }
      if (details.name) {
        ctx.font = '10px "Malgun Gothic", sans-serif';
        ctx.fillText(element.name, left + 10, top + 78);
      }
    } else {
      ctx.font = '28px "Malgun Gothic", sans-serif';
      ctx.fillText(label, left + 10, top + 57);
    }
  }
  return canvas;
}
