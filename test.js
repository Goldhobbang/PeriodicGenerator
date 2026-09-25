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
