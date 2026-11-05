import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/template.mjs';

test('html is the default filter and escapes markup', () => {
  assert.equal(
    render('<b>{{x}}</b>', { x: `a&b<c>"d"'e'` }),
    '<b>a&amp;b&lt;c&gt;&quot;d&quot;&#39;e&#39;</b>'
  );
});

test('js emits a complete string literal', () => {
  assert.equal(render('url({{x|js}})', { x: `it's "q"` }), 'url("it\'s \\"q\\"")');
});

test('jsstr is safe inside either quote style', () => {
  const value = `it's "q" \\ </script>`;
  for (const q of [`'`, '"']) {
    const source = `${q}${render('{{x|jsstr}}', { x: value })}${q}`;
    assert.equal(new Function(`return ${source}`)(), value);
    assert.ok(!source.includes('</script'));
  }
});

test('json embeds any value and neutralises </script', () => {
  assert.equal(render('{{x|json}}', { x: { a: '</script>' } }), '{"a":"\\u003c/script>"}');
});

test('dotted paths and whitespace inside braces', () => {
  assert.equal(render('{{ meta.title }}', { meta: { title: 'T' } }), 'T');
});

test('falsy but defined values render', () => {
  assert.equal(render('{{n}}|{{s}}', { n: 0, s: '' }), '0|');
});

test('unknown slot or filter is an error naming the source', () => {
  assert.throws(
    () => render('{{missing}}', {}, 'shell.html'),
    /shell\.html: unknown slot \{\{missing\}\}/
  );
  assert.throws(() => render('{{x|nope}}', { x: 1 }, 'a.js'), /a\.js: unknown filter 'nope'/);
  assert.throws(() => render('{{x|constructor}}', { x: 1 }), /unknown filter/);
});

test('text without slots passes through, including JS braces', () => {
  const code = 'const o={a:{b:1}};if(x){y()}${`${z}`}';
  assert.equal(render(code, {}), code);
});
