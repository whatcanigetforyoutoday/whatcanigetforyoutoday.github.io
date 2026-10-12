// 회사 반경 안의 음식점·카페를 카카오 로컬 API로 모아 data/ 폴더에 저장해요.
// 실행: node collect.mjs            (kakao_key.txt 에 REST API 키 한 줄)
//       node collect.mjs 1500       (반경을 m로 바꿀 때)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const COMPANY = { name: '우리 회사', address: '서울 강남구 도산대로 313' };
const RADIUS = Number(process.argv[2]) || 1000;

const KEY = readFileSync(new URL('./kakao_key.txt', import.meta.url), 'utf8').trim();
if (!KEY) throw new Error('kakao_key.txt 에 REST API 키를 넣어 주세요');

const sleep = ms => new Promise(r => setTimeout(r, ms));
let calls = 0;
async function kakao(path, params) {
  const url = `https://dapi.kakao.com${path}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    calls++;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KEY}` } });
    if (res.ok) { await sleep(60); return res.json(); }
    const body = await res.text();
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * (attempt + 1)); continue; }
    throw new Error(`카카오 API 오류 ${res.status}: ${body}`);
  }
  throw new Error('카카오 API가 계속 응답하지 않아요. 잠시 후 다시 실행해 주세요.');
}

function distM(a, b) {
  const R = 6371000, toR = x => x * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 한 사각형에 45곳(카카오 최대)이 넘으면 4등분해서 다시 조회해요.
async function searchRect(code, [x1, y1, x2, y2], out, depth = 0) {
  const rect = [x1, y1, x2, y2].map(v => v.toFixed(7)).join(',');
  const first = await kakao('/v2/local/search/category.json', { category_group_code: code, rect, page: 1, size: 15 });
  const total = first.meta.total_count;
  if (total > 45 && depth < 8) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    for (const r of [[x1, y1, mx, my], [mx, y1, x2, my], [x1, my, mx, y2], [mx, my, x2, y2]])
      await searchRect(code, r, out, depth + 1);
    return;
  }
  let page = 1, data = first;
  while (true) {
    for (const d of data.documents) out.set(d.id, d);
    if (data.meta.is_end || page >= 3) break;
    data = await kakao('/v2/local/search/category.json', { category_group_code: code, rect, page: ++page, size: 15 });
  }
}

// 카카오 분류 → 사이트 분류
function mealCat(c) {
  const p = c.split(' > ');
  const sub = p[1] || '', subsub = p[2] || '';
  if (sub === '한식') return /육류|고기|곱창|갈비|삼겹|족발/.test(subsub) ? '고기' : '한식';
  if (sub === '중식' || subsub === '퓨전중식') return '중식';
  if (sub === '일식' || subsub === '퓨전일식' || /코코이찌방야|아비꼬/.test(c)) return '일식';
  if (subsub === '퓨전한식' || /샤브샤브|한식뷔페|도시락|구내식당/.test(c)) return '한식';
  if (sub === '패스트푸드' || sub === '치킨') return '버거·치킨';
  if (sub === '양식') return '양식';
  if (sub === '아시아음식') return '아시안';
  if (sub === '분식') return '분식';
  if (sub === '샐러드' || /샐러드|포케/.test(subsub)) return '샐러드';
  if (sub === '술집') return '술집';
  return '기타';
}
function cafeCat(c) {
  if (/베이커리|제과/.test(c)) return '베이커리';
  if (/아이스크림|빙수/.test(c)) return '아이스크림·빙수';
  if (/디저트|도넛|떡|케이크|와플/.test(c)) return '디저트';
  if (/공차|찻집|전통차|티하우스|밀크티|차,티|티카페/.test(c)) return '티';
  return '커피';
}
const isSnack = c => /> 간식/.test(c);   // 음식점 중 간식(베이커리·디저트)은 카페 탭으로

function toItem(d, cat, company) {
  const lat = +(+d.y).toFixed(6), lng = +(+d.x).toFixed(6);
  return {
    id: 'k' + d.id, name: d.place_name, cat, kakaoCat: d.category_name.replace(/^음식점 > |^카페 > /, ''),
    address: d.road_address_name || d.address_name, phone: d.phone || '',
    lat, lng, dist: Math.round(distM(company, { lat, lng })),
    kakao: d.place_url, naver: '', menus: [], note: ''
  };
}

async function main() {
  const geo = await kakao('/v2/local/search/address.json', { query: COMPANY.address });
  const a = geo.documents[0];
  if (!a) throw new Error(`주소를 찾지 못했어요: ${COMPANY.address}`);
  const company = { ...COMPANY, lat: +(+a.y).toFixed(6), lng: +(+a.x).toFixed(6) };
  console.log(`회사 좌표: ${company.lat}, ${company.lng} (반경 ${RADIUS}m)`);

  // 반경을 감싸는 사각형
  const dLat = RADIUS / 111000, dLng = RADIUS / (111000 * Math.cos(company.lat * Math.PI / 180));
  const box = [company.lng - dLng, company.lat - dLat, company.lng + dLng, company.lat + dLat];

  const food = new Map(), cafe = new Map();
  await searchRect('FD6', box, food);
  await searchRect('CE7', box, cafe);

  const inside = d => distM(company, { lat: +d.y, lng: +d.x }) <= RADIUS;
  let restaurants = [], cafes = [];
  for (const d of food.values()) {
    if (!inside(d)) continue;
    if (isSnack(d.category_name)) cafes.push(toItem(d, cafeCat(d.category_name), company));
    else { const cat = mealCat(d.category_name); if (cat !== '술집') restaurants.push(toItem(d, cat, company)); }   // 술집은 목록에서 제외
  }
  for (const d of cafe.values()) if (inside(d)) cafes.push(toItem(d, cafeCat(d.category_name), company));
  const byDist = (x, y) => x.dist - y.dist;
  // 카카오에 같은 가게가 두 번 등록된 경우(이름·주소가 같음) 하나만 남겨요
  const dedupe = arr => { const seen = new Set(); return arr.filter(r => { const k = r.name.replace(/\s+/g, '') + '|' + r.address; if (seen.has(k)) return false; seen.add(k); return true; }); };
  restaurants = dedupe(restaurants.sort(byDist)); cafes = dedupe(cafes.sort(byDist));

  mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
  const save = (f, v) => writeFileSync(new URL(`./data/${f}`, import.meta.url), JSON.stringify(v, null, 1));
  save('company.json', company);
  save('restaurants.json', restaurants);
  save('cafes.json', cafes);

  const count = arr => Object.entries(arr.reduce((m, r) => (m[r.cat] = (m[r.cat] || 0) + 1, m), {}))
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`식당 ${restaurants.length}곳 (${count(restaurants)})`);
  console.log(`카페·디저트 ${cafes.length}곳 (${count(cafes)})`);
  console.log(`API 호출 ${calls}회 · data/ 폴더에 저장했어요`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
