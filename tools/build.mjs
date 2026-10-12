// app.html(본문) → index.html(배포용 완성 페이지). 실행: node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const body = readFileSync(new URL('app.html', root), 'utf8');

// 링크 미리보기에 쓰는 주소와 소개글
const SITE = 'https://whatcanigetforyoutoday.github.io/';
const DESC = '회사 근처 걸어갈 수 있는 식당 중에서 오늘 점심·저녁 메뉴를 랜덤으로 골라드려요';

const head = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${DESC}">
<!-- 카카오톡·슬랙 등에 링크를 보낼 때 보이는 미리보기 -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="오늘 뭐 먹지">
<meta property="og:title" content="오늘 뭐 먹지">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}icons/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
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
