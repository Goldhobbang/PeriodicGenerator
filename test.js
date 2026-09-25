const assert = require('node:assert/strict');
const { ELEMENTS, segmentWord, convertText } = require('./elements.js');
assert.equal(ELEMENTS.length, 118);
assert.equal(new Set(ELEMENTS.map(e => e.symbol.toLowerCase())).size, 118);
assert.equal(convertText('life is fun').output, 'LiFe IS FUN');
assert.equal(convertText('BACON').output, 'BaCoN');
assert.equal(convertText('snack').output, 'SnAcK');
assert.equal(convertText('bag').output, 'BAg'); // Greedy Ba would leave g unmatched.
assert.equal(convertText('life', 'ko').output, '리튬·철');
assert.equal(convertText('  LiFe\tIS\nFUN! 한글 123 😀').output, '  LiFe\tIS\nFUN! 한글 123 😀');
assert.equal(convertText('jQ').output, 'jQ');
assert.equal(convertText('').output, '');
assert.equal(convertText('he he').output, 'He He');
assert.equal(convertText('h e').output, 'H e');
assert.equal(convertText('<script>alert(1)</script>').output.includes('<'), true);
for (const element of ELEMENTS) assert.equal(convertText(element.symbol).output, element.symbol);
// Compare DP scores against exhaustive search for short words, including unmatched letters.
const symbols = new Set(ELEMENTS.map(e => e.symbol.toLowerCase()));
function brute(word) {
  if (!word) return [0, 0];
  const skipped = brute(word.slice(1));
  const options = [[skipped[0] + 1, skipped[1]]];
  for (const n of [1, 2]) if (word.length >= n && symbols.has(word.slice(0, n))) {
    const score = brute(word.slice(n));
    options.push([score[0], score[1] + 1]);
  }
  return options.sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
}
let seed = 42;
for (let i = 0; i < 400; i++) {
  let word = '';
  for (let j = 0; j < 7; j++) { seed = (seed * 1664525 + 1013904223) >>> 0; word += 'abcdefghijklmnopqrstuvwxyz'[seed % 26]; }
  const tokens = segmentWord(word);
  assert.equal(tokens.map(t => t.raw).join(''), word);
  assert.deepEqual([tokens.filter(t => !t.element).length, tokens.filter(t => t.element).length], brute(word));
}
assert.equal(convertText('a'.repeat(3000)).output.length, 3000);
console.log('Passed: 118 elements, conversion, whitespace, fallback, 400 exhaustive comparisons, long input.');

// Alternative paths: completeness, uniqueness, paging and exact formatting.
const { combinationIterator, formatCombination } = require('./elements.js');
const all = text => [...combinationIterator(text)];
assert.deepEqual(all('sin').map(tokens => formatCombination(tokens)), ['SiN', 'SIn', 'SIN']);
assert.equal(all('sin sin').length, 9);
assert.equal(all('bag').length, 1);
assert.equal(all('jQ').length, 1);
assert.deepEqual(all('İ BK').map(tokens => formatCombination(tokens)), ['İ BK']);
assert.equal(formatCombination(all('sin  sin!\n')[1], 'en', ' / '), 'Si / N  S / In!\n');
assert.equal(formatCombination(all('life')[0], 'ko', ''), '리튬철');
assert.equal(formatCombination(all('life')[0], 'ko', '<&>'), '리튬<&>철');
assert.equal(convertText('life is', 'en', '-').output, 'Li-Fe I-S');
function exhaustive(word) {
  if (!word) return [[]];
  const options = [];
  for (const size of [2, 1]) {
    const element = ELEMENTS.find(e => e.symbol.toLowerCase() === word.slice(0, size));
    if (word.length >= size && element) for (const tail of exhaustive(word.slice(size))) options.push([{ raw: word.slice(0, size), element }, ...tail]);
  }
  for (const tail of exhaustive(word.slice(1))) options.push([{ raw: word[0], element: null }, ...tail]);
  const missing = tokens => tokens.filter(t => !t.element).length;
  const min = Math.min(...options.map(missing));
  return options.filter(tokens => missing(tokens) === min);
}
for (const word of ['bacon', 'snack', 'sin', 'banana', 'jhello', 'co', 'sc', 'nana', 'asif']) {
  const actual = all(word);
  const key = tokens => tokens.map(t => t.element?.symbol || `?${t.raw}`).join('|');
  assert.deepEqual(actual.map(key).sort(), exhaustive(word).map(key).sort());
  assert.equal(new Set(actual.map(key)).size, actual.length);
  assert.equal(formatCombination(actual[0]), convertText(word).output);
}
const lazy = combinationIterator('sin '.repeat(750));
for (let i = 0; i < 6; i++) {
  const next = lazy.next();
  assert.equal(next.done, false);
  assert.equal(next.value.map(t => t.raw).join(''), 'sin '.repeat(750));
}
console.log('Passed: complete alternative enumeration, literal preservation, custom separators, lazy paging on 3,000 characters.');
