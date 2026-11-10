import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('L4 bonus section explains actual eligibility factors and gives a case comparison', () => {
  const content = read('src/content/poradnik/l4/jak-obliczyc-podstawe-l4.tsx');
  assert.match(content, /<h2>Kiedy premia wlicza się do podstawy L4\?<\/h2>/);
  for (const text of ['Składki:', 'Wypłata podczas L4:', 'Okres premii:', 'miesięczna premia sprzedażowa 400 zł', 'także za czas choroby']) {
    assert.ok(content.includes(text), `Missing L4 explanation: ${text}`);
  }
});

test('Vacation bonus section distinguishes fixed, monthly variable, longer-period and one-off bonuses', () => {
  const content = read('src/content/poradnik/vacation/jak-obliczyc-wynagrodzenie-urlopowe.tsx');
  assert.match(content, /<h2>Które premie liczą się do wynagrodzenia urlopowego\?<\/h2>/);
  for (const text of ['Stała co miesiąc:', 'Zmienna co miesiąc:', 'Kwartalna lub roczna:', 'Jednorazowa:', '200, 400 i 600 zł', '1200 zł']) {
    assert.ok(content.includes(text), `Missing vacation explanation: ${text}`);
  }
});

test('VAZO brand hover remains white rather than inheriting generic link hover blue', () => {
  const css = read('src/poradnik/poradnik.css');
  assert.match(css, /\.guide-brand:hover, \.guide-brand:focus-visible \{ color: #fff; text-decoration: none; \}/);
});

test('Registry includes a primary legal reference for vacation bonus treatment', () => {
  const registry = read('src/content/poradnik/index.ts');
  assert.match(registry, /PIP — Nie wystarczy nazwa: premia/);
  assert.match(registry, /https:\/\/eli\.gov\.pl\/eli\/DU\/1997\/14\/ogl\/pol/);
  assert.match(registry, /reviewedAt: '2026-11-10'/);
});
