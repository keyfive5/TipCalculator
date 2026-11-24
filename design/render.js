// Renders icon/splash PNGs with headless Chrome. Usage: node design/render.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { mark } = require('./mark');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = path.resolve(__dirname, '..', 'assets');
const tmp = path.resolve(__dirname, '.tmp');
fs.mkdirSync(tmp, { recursive: true });

const blur = `<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>`;

function svgDoc(inner, { bg, scale = 1, size = 1024 }) {
  const bgRect = bg === 'icon'
    ? `<defs><radialGradient id="bg" cx="0.5" cy="0.42" r="0.75">
         <stop offset="0" stop-color="#2A241B"/><stop offset="0.55" stop-color="#15120E"/><stop offset="1" stop-color="#0A0907"/>
       </radialGradient>
       <radialGradient id="glow" cx="0.5" cy="0.47" r="0.42">
         <stop offset="0" stop-color="#F4B740" stop-opacity="0.28"/><stop offset="1" stop-color="#F4B740" stop-opacity="0"/>
       </radialGradient></defs>
       <rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>`
    : '';
  const t = (1 - scale) * 512;
  return `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style></head>
  <body><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>${blur}</defs>${bgRect}<g transform="translate(${t} ${t}) scale(${scale})">${inner}</g></svg></body></html>`;
}

function render(name, html, size, transparent) {
  const file = path.join(tmp, name + '.html');
  fs.writeFileSync(file, html);
  const target = path.join(out, name + '.png');
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${size},${size}`, `--screenshot=${target}`,
    ...(transparent ? ['--default-background-color=00000000'] : []),
    require('url').pathToFileURL(file).href,
  ], { stdio: 'ignore' });
  console.log('wrote', target);
}

render('icon', svgDoc(mark(), { bg: 'icon', scale: 0.92 }), 1024, false);
render('splash-icon', svgDoc(mark(), { scale: 1 }), 1024, true);
render('android-icon-foreground', svgDoc(mark(), { scale: 0.62 }), 1024, true);
render('android-icon-monochrome', svgDoc(mark({ mono: true }), { scale: 0.62 }), 1024, true);
render('favicon', svgDoc(mark(), { bg: 'icon', scale: 0.92, size: 48 }), 48, false);
