// Renders App Store screenshots (1320x2868, 6.9") from the running web build.
// 1) npx expo start --web --port 8081   2) node design/screenshots.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP = process.env.APP_URL || 'http://localhost:8081/';
const outDir = path.resolve(__dirname, '..', 'store', 'screenshots');
const tmp = path.resolve(__dirname, '.tmp');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmp, { recursive: true });

const font = (pkg, dir, file) =>
  pathToFileURL(path.resolve(__dirname, '..', 'node_modules', '@expo-google-fonts', pkg, dir, file)).href;

const shots = [
  {
    name: '01-split',
    theme: 'dark',
    eyebrow: 'SPLIT THE BILL',
    headline: 'Every cent,<br><em>accounted for.</em>',
    demo: { people: 3, tipPct: 20, appearance: 'dark', currency: 'USD' },
    params: { bill: '84.21' },
  },
  {
    name: '02-ruler',
    theme: 'dark',
    eyebrow: 'ANY TIP YOU LIKE',
    headline: 'Swipe the ruler.<br><em>Feel every click.</em>',
    demo: { people: 1, tipPct: 23, appearance: 'dark', currency: 'USD' },
    params: { bill: '126.40', ruler: '1' },
  },
  {
    name: '03-roundup',
    theme: 'light',
    eyebrow: 'ROUND UP',
    headline: 'Clean numbers<br><em>for everyone.</em>',
    demo: { people: 4, tipPct: 18, roundUp: true, appearance: 'light', currency: 'USD' },
    params: { bill: '249.75' },
  },
  {
    name: '04-settings',
    theme: 'dark',
    eyebrow: 'MADE TO FIT',
    headline: 'Tip before tax.<br><em>Any currency.</em>',
    demo: { people: 2, tipPct: 20, appearance: 'dark', currency: 'USD', excludeTax: true, taxRate: 8.75 },
    params: { bill: '96.50', sheet: '1' },
  },
  {
    name: '05-light',
    theme: 'light',
    eyebrow: 'NO ADS · NO TRACKING',
    headline: 'Just a beautiful<br><em>tip calculator.</em>',
    demo: { people: 2, tipPct: 15, appearance: 'light', currency: 'EUR' },
    params: { bill: '68.40' },
  },
];

const palette = {
  dark: { bg: '#0E0D0B', text: '#F6F0E6', dim: '#A89F91', accent: '#F4B740', frame: '#2A2620', app: '#0E0D0B' },
  light: { bg: '#F4EEE3', text: '#1D1A15', dim: '#6C6458', accent: '#A06A08', frame: '#1D1A15', app: '#F4EEE3' },
};

function html(s, appImage) {
  const p = palette[s.theme];
  const W = 393, H = 852, BAR = 50, B = 11;
  const scale = 0.805;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:Fraunces;font-weight:600;src:url('${font('fraunces', '600SemiBold', 'Fraunces_600SemiBold.ttf')}')}
  @font-face{font-family:Fraunces;font-weight:600;font-style:italic;src:url('${font('fraunces', '600SemiBold_Italic', 'Fraunces_600SemiBold_Italic.ttf')}')}
  @font-face{font-family:Inter;font-weight:600;src:url('${font('inter', '600SemiBold', 'Inter_600SemiBold.ttf')}')}
  html,body{margin:0;width:440px;height:956px;overflow:hidden;background:${p.bg}}
  body{position:relative;font-family:Inter}
  .glow{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 62%, ${s.theme === 'dark' ? 'rgba(244,183,64,0.16)' : 'rgba(240,174,53,0.22)'}, transparent 70%)}
  .cap{position:absolute;top:58px;left:0;right:0;text-align:center}
  .eyebrow{font-weight:600;font-size:12.5px;letter-spacing:2.4px;color:${p.accent}}
  h1{margin:12px 0 0;font-family:Fraunces;font-weight:600;font-size:38px;line-height:1.08;letter-spacing:-0.8px;color:${p.text}}
  h1 em{font-style:italic;color:${p.accent}}
  .device{position:absolute;left:50%;top:222px;width:${W + B * 2}px;height:${H + B * 2}px;transform:translateX(-50%) scale(${scale});transform-origin:top center;
    border-radius:62px;background:${p.frame};box-shadow:0 30px 80px rgba(0,0,0,${s.theme === 'dark' ? 0.6 : 0.25}), inset 0 0 0 1.5px rgba(255,255,255,0.08)}
  .screen{position:absolute;left:${B}px;top:${B}px;width:${W}px;height:${H}px;border-radius:52px;overflow:hidden;background:${p.app}}
  .bar{height:${BAR}px;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0 38px;box-sizing:border-box;color:${p.text};font-weight:600;font-size:16px}
  .island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:120px;height:35px;border-radius:20px;background:#000}
  .app{width:${W}px;height:${H - BAR}px;display:block}
  </style></head><body><div class="glow"></div>
  <div class="cap"><div class="eyebrow">${s.eyebrow}</div><h1>${s.headline}</h1></div>
  <div class="device"><div class="screen">
    <div class="bar"><span>9:41</span><span class="island"></span>
      <svg width="72" height="14" viewBox="0 0 72 14" fill="${p.text}">
        <rect x="0" y="9" width="3.4" height="4.5" rx="1"/><rect x="5" y="6.5" width="3.4" height="7" rx="1"/><rect x="10" y="4" width="3.4" height="9.5" rx="1"/><rect x="15" y="1.2" width="3.4" height="12.3" rx="1"/>
        <path d="M30.5 3.4a9.6 9.6 0 0 1 13 0l-1.4 1.5a7.6 7.6 0 0 0-10.2 0zM33 6.1a6 6 0 0 1 8 0l-1.4 1.5a4 4 0 0 0-5.2 0zM35.6 8.9a2.2 2.2 0 0 1 2.8 0L37 10.4z"/>
        <rect x="47.5" y="1.5" width="21" height="11" rx="3.2" fill="none" stroke="${p.text}" stroke-opacity="0.4"/><rect x="49.5" y="3.5" width="17" height="7" rx="1.8"/><rect x="69.6" y="5" width="1.6" height="4" rx="0.8" fill-opacity="0.4"/>
      </svg></div>
    <img class="app" src="${appImage}">
  </div></div></body></html>`;
}

(async () => {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3 });
  for (const s of shots) {
    // Pass 1: the app itself, full-bleed at 3x, at the device's screen size below the status bar.
    const q = new URLSearchParams({ demo: JSON.stringify(s.demo), ...s.params });
    await page.setViewport({ width: 393, height: 852 - 50, deviceScaleFactor: 3 });
    await page.goto(`${APP}?${q.toString()}`, { waitUntil: 'load' });
    await page.waitForSelector('[aria-label="Settings"]', { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1800)); // let count-up animations settle
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const appPng = path.join(tmp, `app-${s.name}.png`);
    await page.screenshot({ path: appPng, type: 'png' });

    // Pass 2: compose caption + device frame around it.
    const file = path.join(tmp, `${s.name}.html`);
    fs.writeFileSync(file, html(s, pathToFileURL(appPng).href));
    await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3 });
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const target = path.join(outDir, `${s.name}.png`);
    await page.screenshot({ path: target, type: 'png' });
    const b = fs.readFileSync(target);
    console.log(s.name, `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`);
  }
  await browser.close();
})();
