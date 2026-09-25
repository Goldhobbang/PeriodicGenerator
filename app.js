const input = document.querySelector('#sentence');
const cards = document.querySelector('#cards');
const result = document.querySelector('#result');
const copy = document.querySelector('#copy');
let copyTimer;

function render() {
  clearTimeout(copyTimer);
  copy.querySelector('span').textContent = '복사';
  document.querySelector('#copy-status').textContent = '';
  const language = document.querySelector('input[name="language"]:checked').value;
  const converted = convertText(input.value, language);
  result.textContent = converted.output || '입력한 문장이 여기에 나타나요.';
  result.classList.toggle('empty', !input.value);
  copy.disabled = !input.value.trim();
  document.querySelector('#clear').disabled = !input.value;
  document.querySelector('#char-count').textContent = `${input.value.length.toLocaleString()} / 3,000`;
  const fragment = document.createDocumentFragment();
  let count = 0;
  let missing = 0;
  for (const part of converted.parts) {
    if (!part.tokens) {
      fragment.append(document.createTextNode(part.raw));
      continue;
    }
    const word = document.createElement('span');
    word.className = 'word';
    for (const token of part.tokens) {
      const tile = document.createElement('span');
      if (token.element) {
        count++;
        const element = token.element;
        tile.className = `element tone-${element.number % 3}`;
        tile.title = `${element.symbol} · ${element.name} · 원자 번호 ${element.number}`;
        tile.setAttribute('aria-label', tile.title);
        const number = document.createElement('small');
        number.textContent = element.number;
        const main = document.createElement('strong');
        main.textContent = language === 'ko' ? element.name : element.symbol;
        main.className = language === 'ko' ? 'korean' : '';
        const subtitle = document.createElement('span');
        subtitle.textContent = language === 'ko' ? element.symbol : element.name;
        tile.append(number, main, subtitle);
      } else {
        missing++;
        tile.className = 'element unmatched';
        const main = document.createElement('strong');
        main.textContent = token.raw;
        const subtitle = document.createElement('span');
        subtitle.textContent = '변환 불가';
        tile.append(main, subtitle);
        tile.title = `${token.raw}: 대응하는 원소 기호가 없어요`;
      }
      word.append(tile);
    }
    fragment.append(word);
  }
  cards.replaceChildren(fragment);
  if (!input.value) {
    const placeholder = document.createElement('span');
    placeholder.className = 'placeholder';
    placeholder.textContent = '첫 단어를 입력하면 원소들이 모이기 시작해요.';
    cards.append(placeholder);
  }
  const status = document.querySelector('#status');
  status.textContent = !input.value ? '입력을 기다리고 있어요' : missing ? `원소 ${count}개 · 변환되지 않은 영문 ${missing}글자` : count ? `✓ 원소 ${count}개로 변환 완료` : '영어 단어를 입력해 주세요. 다른 문자는 그대로 유지됩니다.';
  status.classList.toggle('has-missing', missing > 0);
}
input.addEventListener('input', render);
document.querySelectorAll('input[name="language"]').forEach(radio => radio.addEventListener('change', render));
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.example; render(); input.focus(); }));

copy.addEventListener('click', async () => {
  const text = convertText(input.value, document.querySelector('input[name="language"]:checked').value).output;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); copied = true; }
  } catch { /* A local file or denied permission may need the legacy fallback. */ }
  if (!copied) {
    const previous = document.activeElement;
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.className = 'clipboard-fallback';
    document.body.append(temporary);
    temporary.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    temporary.remove();
    previous?.focus();
  }
  copy.querySelector('span').textContent = copied ? '복사 완료!' : '복사 실패';
  document.querySelector('#copy-status').textContent = copied ? '변환된 문자열을 복사했습니다.' : '자동 복사가 차단되었습니다. 출력 문자열을 선택해 직접 복사해 주세요.';
  if (!copied) {
    const range = document.createRange();
    range.selectNodeContents(result);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    result.focus();
  }
  copyTimer = setTimeout(() => { copy.querySelector('span').textContent = '복사'; }, 2000);
});
render();
