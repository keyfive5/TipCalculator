// Generates the Tipwise mark (a torn gold receipt with a % sign) as SVG markup.
// Used by design/render.js to produce app icons and splash images.
function receiptPath(x0, y0, w, h, r, teeth, toothH) {
  const x1 = x0 + w, yb = y0 + h;
  const tw = w / teeth;
  let d = `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${yb} `;
  for (let i = teeth; i > 0; i--) {
    const x = x0 + i * tw;
    d += `L${x - tw / 2} ${yb + toothH} L${x - tw} ${yb} `;
  }
  d += `V${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
  return d;
}

function mark({ gold = '#F4B740', gold2 = '#E9A12A', ink = '#1B1406', mono = false } = {}) {
  const fill = mono ? '#FFFFFF' : 'url(#gold)';
  const glyph = mono ? '#000000' : ink;
  const dots = Array.from({ length: 9 }, (_, i) =>
    `<circle cx="${337 + i * 43.75}" cy="742" r="9" fill="${glyph}" opacity="${mono ? 1 : 0.28}"/>`).join('');
  return `
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${gold}"/>
      <stop offset="1" stop-color="${gold2}"/>
    </linearGradient>
  </defs>
  <g transform="rotate(-7 512 512)">
    ${mono ? '' : `<path d="${receiptPath(262, 190, 500, 610, 84, 7, 46)}" fill="#000" opacity="0.35" transform="translate(0 26)" filter="url(#blur)"/>`}
    <path d="${receiptPath(262, 190, 500, 610, 84, 7, 46)}" fill="${fill}"/>
    ${mono ? `<g fill="none" stroke="#000" stroke-width="44" stroke-linecap="round">` : `<g fill="none" stroke="${glyph}" stroke-width="44" stroke-linecap="round">`}
      <circle cx="420" cy="388" r="60"/>
      <circle cx="604" cy="592" r="60"/>
      <line x1="414" y1="640" x2="610" y2="340"/>
    </g>
    ${dots}
  </g>`;
}
module.exports = { mark };
