/* Atomic-number order. Standard element symbols and Korean element names. */
const ELEMENTS = `H 수소
He 헬륨
Li 리튬
Be 베릴륨
B 붕소
C 탄소
N 질소
O 산소
F 플루오린
Ne 네온
Na 나트륨
Mg 마그네슘
Al 알루미늄
Si 규소
P 인
S 황
Cl 염소
Ar 아르곤
K 칼륨
Ca 칼슘
Sc 스칸듐
Ti 타이타늄
V 바나듐
Cr 크로뮴
Mn 망가니즈
Fe 철
Co 코발트
Ni 니켈
Cu 구리
Zn 아연
Ga 갈륨
Ge 저마늄
As 비소
Se 셀레늄
Br 브로민
Kr 크립톤
Rb 루비듐
Sr 스트론튬
Y 이트륨
Zr 지르코늄
Nb 나이오븀
Mo 몰리브데넘
Tc 테크네튬
Ru 루테늄
Rh 로듐
Pd 팔라듐
Ag 은
Cd 카드뮴
In 인듐
Sn 주석
Sb 안티모니
Te 텔루륨
I 아이오딘
Xe 제논
Cs 세슘
Ba 바륨
La 란타넘
Ce 세륨
Pr 프라세오디뮴
Nd 네오디뮴
Pm 프로메튬
Sm 사마륨
Eu 유로퓸
Gd 가돌리늄
Tb 터븀
Dy 디스프로슘
Ho 홀뮴
Er 어븀
Tm 툴륨
Yb 이터븀
Lu 루테튬
Hf 하프늄
Ta 탄탈럼
W 텅스텐
Re 레늄
Os 오스뮴
Ir 이리듐
Pt 백금
Au 금
Hg 수은
Tl 탈륨
Pb 납
Bi 비스무트
Po 폴로늄
At 아스타틴
Rn 라돈
Fr 프랑슘
Ra 라듐
Ac 악티늄
Th 토륨
Pa 프로트악티늄
U 우라늄
Np 넵투늄
Pu 플루토늄
Am 아메리슘
Cm 퀴륨
Bk 버클륨
Cf 캘리포늄
Es 아인슈타이늄
Fm 페르뮴
Md 멘델레븀
No 노벨륨
Lr 로렌슘
Rf 러더포듐
Db 더브늄
Sg 시보귬
Bh 보륨
Hs 하슘
Mt 마이트너륨
Ds 다름슈타튬
Rg 뢴트게늄
Cn 코페르니슘
Nh 니호늄
Fl 플레로븀
Mc 모스코븀
Lv 리버모륨
Ts 테네신
Og 오가네손`.split('\n').map((row, index) => {
  const [symbol, name] = row.split(' ');
  return { symbol, name, number: index + 1 };
});
const ELEMENT_MAP = new Map(ELEMENTS.map(element => [element.symbol.toLowerCase(), element]));

// O(n) time and memory: store optimal suffix costs and reconstruct once.
function segmentWord(word) {
  const lower = word.toLowerCase();
  const costs = new Array(word.length + 1);
  costs[word.length] = { missing: 0, count: 0 };
  for (let i = word.length - 1; i >= 0; i--) {
    let best = null;
    for (const size of [2, 1]) {
      if (i + size > word.length) continue;
      const element = ELEMENT_MAP.get(lower.slice(i, i + size));
      if (!element) continue;
      const next = costs[i + size];
      const candidate = { missing: next.missing, count: next.count + 1, size, element };
      if (!best || candidate.missing < best.missing || (candidate.missing === best.missing && candidate.count < best.count)) best = candidate;
    }
    const skip = { missing: costs[i + 1].missing + 1, count: costs[i + 1].count, size: 1, element: null };
    if (!best || skip.missing < best.missing || (skip.missing === best.missing && skip.count < best.count)) best = skip;
    costs[i] = best;
  }
  const tokens = [];
  for (let i = 0; i < word.length;) {
    const { size, element } = costs[i];
    tokens.push({ raw: word.slice(i, i + size), element });
    i += size;
  }
  return tokens;
}

function formatCombination(tokens, language = 'en', separator = language === 'ko' ? '·' : '') {
  return tokens.map((token, index) => {
    const prefix = index && !token.literal && !tokens[index - 1].literal ? separator : '';
    return prefix + (token.element ? (language === 'ko' ? token.element.name : token.element.symbol) : token.raw);
  }).join('');
}

// Enumerate only paths with the fewest unmatched letters. The best path comes
// first; the remaining paths are generated on demand, without recursion or an
// exponential upfront list. Literal runs never join words across whitespace.
function* combinationIterator(text) {
  const edges = new Array(text.length);
  const costs = new Array(text.length + 1);
  costs[text.length] = { missing: 0, count: 0 };
  for (let i = text.length - 1; i >= 0; i--) {
    const candidates = [];
    if (!/[A-Za-z]/.test(text[i])) {
      const size = /[\uD800-\uDBFF]/.test(text[i]) && /[\uDC00-\uDFFF]/.test(text[i + 1] || '') ? 2 : 1;
      candidates.push({ size, token: { raw: text.slice(i, i + size), literal: true }, ...costs[i + size] });
    } else {
      for (const size of [2, 1]) {
        const raw = text.slice(i, i + size);
        const element = /^[A-Za-z]+$/.test(raw) ? ELEMENT_MAP.get(raw.toLowerCase()) : null;
        if (i + size <= text.length && element) candidates.push({ size, token: { raw: text.slice(i, i + size), element }, missing: costs[i + size].missing, count: costs[i + size].count + 1 });
      }
      candidates.push({ size: 1, token: { raw: text[i], element: null }, missing: costs[i + 1].missing + 1, count: costs[i + 1].count });
    }
    candidates.sort((a, b) => a.missing - b.missing || a.count - b.count || b.size - a.size);
    costs[i] = { missing: candidates[0].missing, count: candidates[0].count };
    edges[i] = candidates.filter(candidate => candidate.missing === costs[i].missing);
  }
  const pending = [{ index: 0, path: null }];
  while (pending.length) {
    const { index, path } = pending.pop();
    if (index === text.length) {
      const tokens = [];
      for (let node = path; node; node = node.previous) tokens.push(node.token);
      yield tokens.reverse();
      continue;
    }
    for (let j = edges[index].length - 1; j >= 0; j--) {
      const edge = edges[index][j];
      pending.push({ index: index + edge.size, path: { token: edge.token, previous: path } });
    }
  }
}

function convertText(text, language = 'en', separator = language === 'ko' ? '·' : '') {
  const parts = (text.match(/[A-Za-z]+|[^A-Za-z]+/g) || []).map(raw => {
    if (!/^[A-Za-z]/.test(raw)) return { raw, tokens: null, output: raw };
    const tokens = segmentWord(raw);
    return { raw, tokens, output: formatCombination(tokens, language, separator) };
  });
  return { parts, output: parts.map(part => part.output).join('') };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { ELEMENTS, segmentWord, convertText, combinationIterator, formatCombination };
