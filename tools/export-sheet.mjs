// 식당·카페 목록을 엑셀로 내보내기: node tools/export-sheet.mjs  →  식당목록.xlsx
// 비싼 곳·저녁만 판단 규칙은 app.html에 있는 것을 그대로 읽어 써요 (규칙이 한 곳에만 있도록)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const app = readFileSync(new URL('app.html', root), 'utf8');
const grab = name => {
  const m = new RegExp(`const ${name} = (/.+/[a-z]*);`).exec(app);
  if (!m) throw new Error(`app.html에서 ${name} 규칙을 찾지 못했어요`);
  return eval(m[1]);
};
const PRICEY_CAT = grab('PRICEY_CAT'), PRICEY_NAME = grab('PRICEY_NAME'), NOT_PRICEY = grab('NOT_PRICEY');
const DINNER_NAME = grab('DINNER_NAME'), DINNER_CAT = grab('DINNER_CAT');
const priceyAuto = r => (PRICEY_CAT.test(r.kakaoCat || '') || PRICEY_NAME.test(r.name)) && !NOT_PRICEY.test(r.name + (r.kakaoCat || ''));
const dinnerAuto = r => DINNER_NAME.test(r.name) || DINNER_CAT.test(r.kakaoCat || '');

const ov = existsSync(new URL('data/overrides.json', root)) ? read('data/overrides.json') : { meal: {}, cafe: {} };
const DAY = ['일', '월', '화', '수', '목', '금', '토'];
const WHEN = { all: '언제나', dinner: '저녁만', lunch: '점심만' };

function row(r, kind) {
  const o = (ov[kind] || {})[r.id] || {};
  const pick = (k, d) => (o[k] !== undefined ? o[k] : d);
  return {
    id: r.id,
    name: pick('name', r.name),
    cat: pick('cat', r.cat),
    pricey: kind === 'meal' ? (pick('pricey', priceyAuto(r)) ? 'O' : 'X') : '',
    when: WHEN[pick('when', kind === 'meal' && dinnerAuto(r) ? 'dinner' : 'all')],
    open: pick('open', ''), close: pick('close', ''),
    off: (pick('off', []) || []).map(i => DAY[i]).join(','),
    hide: pick('hide', false) ? 'O' : '',
    note: pick('note', ''),
    kakaoCat: r.kakaoCat || '', address: r.address || '', dist: r.dist, kakao: (r.kakao || '').replace(/^http:/, 'https:'),
  };
}

const meal = read('data/restaurants.json').map(r => row(r, 'meal'));
const cafe = read('data/cafes.json').map(r => row(r, 'cafe'));
const tmp = fileURLToPath(new URL('tools/_rows.json', root));
writeFileSync(tmp, JSON.stringify({ meal, cafe }));
const out = fileURLToPath(new URL('식당목록.xlsx', root));
execFileSync('python', [fileURLToPath(new URL('tools/write_xlsx.py', root)), tmp, out], { stdio: 'inherit' });
console.log(`식당 ${meal.length}곳 · 카페 ${cafe.length}곳 → 식당목록.xlsx`);
