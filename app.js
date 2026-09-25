const input = document.querySelector('#sentence');
const cards = document.querySelector('#cards');
const result = document.querySelector('#result');
const copy = document.querySelector('#copy');
const separator = document.querySelector('#separator');
const more = document.querySelector('#more');
const combinationStatus = document.querySelector('#combination-status');
let copyTimer;
let iterator;
let nextCombination;
let combinations = [];
let selectedIndex = 0;
let customSeparator = false;
const language = () => document.querySelector('input[name="language"]:checked').value;
const selectedText = () => formatCombination(combinations[selectedIndex] || [], language(), separator.value);

function updateOutput() {
  clearTimeout(copyTimer);
  copy.querySelector('span').textContent = '복사';
  document.querySelector('#copy-status').textContent = '';
  result.textContent = selectedText() || '입력한 문장이 여기에 나타나요.';
  result.classList.toggle('empty', !input.value);
  copy.disabled = !input.value.trim();
  const tokens = combinations[selectedIndex] || [];
  const count = tokens.filter(token => token.element).length;
  const missing = tokens.filter(token => !token.element && !token.literal).length;
  const status = document.querySelector('#status');
  status.textContent = !input.value ? '입력을 기다리고 있어요' : missing ? `원소 ${count}개 · 변환되지 않은 영문 ${missing}글자` : count ? `✓ 원소 ${count}개로 변환 완료` : '영어 단어를 입력해 주세요. 다른 문자는 그대로 유지됩니다.';
  status.classList.toggle('has-missing', missing > 0);
  combinationStatus.textContent = combinations.length ? `${combinations.length}개 조합 · ${selectedIndex + 1}번 선택${nextCombination.done ? ' · 모두 확인했어요' : ''}` : '조합을 선택하면 아래 문자열에 반영돼요';
  more.hidden = !combinations.length || nextCombination.done;
}

function makeTile(token) {
  const tile = document.createElement('span');
  const main = document.createElement('strong');
  const subtitle = document.createElement('span');
  if (token.element) {
    const element = token.element;
    tile.className = `element tone-${element.number % 3}`;
    tile.title = `${element.symbol} · ${element.name} · 원자 번호 ${element.number}`;
    const number = document.createElement('small');
    number.textContent = element.number;
    main.textContent = language() === 'ko' ? element.name : element.symbol;
    main.className = language() === 'ko' ? 'korean' : '';
    subtitle.textContent = language() === 'ko' ? element.symbol : element.name;
    tile.append(number);
  } else {
    tile.className = 'element unmatched';
    main.textContent = token.raw;
    subtitle.textContent = '변환 불가';
    tile.title = `${token.raw}: 대응하는 원소 기호가 없어요`;
  }
  tile.append(main, subtitle);
  return tile;
}

function selectCombination(index, focus = false) {
  selectedIndex = index;
  cards.querySelectorAll('.combination').forEach((button, i) => {
    button.classList.toggle('selected', i === index);
    button.setAttribute('aria-pressed', String(i === index));
    button.querySelector('.selection-label').textContent = i === index ? '선택됨' : '선택';
    if (i === index && focus) {
      button.focus({ preventScroll: true });
      // Scroll only the results panel, never the surrounding page.
      const top = button.getBoundingClientRect().top - cards.getBoundingClientRect().top + cards.scrollTop;
      if (top < cards.scrollTop) cards.scrollTop = top;
      else if (top + button.offsetHeight > cards.scrollTop + cards.clientHeight) cards.scrollTop = top + button.offsetHeight - cards.clientHeight;
    }
  });
  updateOutput();
}

function appendCombination(tokens, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'combination';
  button.setAttribute('aria-label', `조합 ${index + 1}: ${formatCombination(tokens, language(), ' · ')}`);
  const heading = document.createElement('span');
  heading.className = 'combination-heading';
  const title = document.createElement('span');
  title.textContent = `조합 ${index + 1}${index === 0 ? ' · 추천' : ''}`;
  const selection = document.createElement('span');
  selection.className = 'selection-label';
  heading.append(title, selection);
  const tiles = document.createElement('span');
  tiles.className = 'combination-tiles';
  for (const token of tokens) tiles.append(token.literal ? document.createTextNode(token.raw) : makeTile(token));
  button.append(heading, tiles);
  button.addEventListener('click', () => selectCombination(index));
  button.addEventListener('keydown', event => {
    const target = event.key === 'ArrowDown' ? Math.min(index + 1, combinations.length - 1) : event.key === 'ArrowUp' ? Math.max(index - 1, 0) : event.key === 'Home' ? 0 : event.key === 'End' ? combinations.length - 1 : null;
    if (target !== null) { event.preventDefault(); selectCombination(target, true); }
  });
  cards.append(button);
}

function loadMore(amount = 5) {
  for (let i = 0; i < amount && !nextCombination.done; i++) {
    combinations.push(nextCombination.value);
    appendCombination(nextCombination.value, combinations.length - 1);
    nextCombination = iterator.next();
  }
  selectCombination(selectedIndex);
}

function resetCombinations() {
  combinations = [];
  selectedIndex = 0;
  cards.replaceChildren();
  cards.scrollTop = 0;
  iterator = combinationIterator(input.value);
  nextCombination = input.value ? iterator.next() : { done: true };
  document.querySelector('#clear').disabled = !input.value;
  document.querySelector('#char-count').textContent = `${input.value.length.toLocaleString()} / 3,000`;
  loadMore(1);
  if (!input.value) {
    const placeholder = document.createElement('span');
    placeholder.className = 'placeholder';
    placeholder.textContent = '첫 단어를 입력하면 원소들이 모이기 시작해요.';
    cards.append(placeholder);
  }
}
input.addEventListener('input', resetCombinations);
separator.addEventListener('input', () => { customSeparator = true; updateOutput(); });
document.querySelectorAll('input[name="language"]').forEach(radio => radio.addEventListener('change', () => {
  if (!customSeparator) separator.value = ' ';
  const scrollTop = cards.scrollTop;
  cards.replaceChildren();
  combinations.forEach(appendCombination);
  if (!combinations.length) resetCombinations();
  else selectCombination(selectedIndex);
  cards.scrollTop = scrollTop;
}));
more.addEventListener('click', () => {
  const firstNewIndex = combinations.length;
  loadMore();
  selectCombination(firstNewIndex, true);
});
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; resetCombinations(); input.focus(); });
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.example; resetCombinations(); input.focus(); }));

copy.addEventListener('click', async () => {
  const text = selectedText();
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); copied = true; }
  } catch { /* Local files or denied permission may need the legacy fallback. */ }
  if (!copied) {
    const previous = document.activeElement;
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.className = 'clipboard-fallback';
    document.body.append(temporary);
    temporary.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    temporary.remove();
    previous?.focus({ preventScroll: true });
  }
  copy.querySelector('span').textContent = copied ? '복사 완료!' : '복사 실패';
  document.querySelector('#copy-status').textContent = copied ? '선택한 조합을 구분자와 함께 복사했습니다.' : '자동 복사가 차단되었습니다. 출력 문자열을 선택해 직접 복사해 주세요.';
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
resetCombinations();
