// app.html(본문) → index.html(배포용 완성 페이지). 실행: node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const body = readFileSync(new URL('app.html', root), 'utf8');

const head = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="회사·집 근처 식당과 카페 중 걸어갈 수 있는 곳을 랜덤으로 골라주는 점심·저녁 메뉴 추첨기">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#DDE5EB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151B26" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="오늘 뭐 먹지">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="format-detection" content="telephone=no">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;

const tail = `
<script>
// 오프라인에서도 열리도록 서비스 워커 등록
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('서비스 워커 등록 실패', err)));
}
</script>
</body>
</html>
`;

writeFileSync(new URL('index.html', root), head + body + tail);
console.log('index.html 만들었어요');
