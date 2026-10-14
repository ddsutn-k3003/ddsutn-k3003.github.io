// Compi: el robot de la cátedra. Dibujo original en SVG; las expresiones se cambian con data-mood.
export function compiSvg({ size = 72 } = {}) {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${16 + i * 10.5}" y="125" width="8" height="4" rx="1.2"/>`).join('')
  const wheel = (x) => `<g transform="translate(${x} 134.5)"><circle r="5" fill="#1b1b1d"/><g class="spin"><circle cx="2.4" r="1.4" fill="#fbe9eb"/></g></g>`
  return `<svg class="compi-svg" viewBox="0 0 100 142" width="${size}" height="${Math.round((size * 142) / 100)}" aria-hidden="true" focusable="false">
<ellipse cx="50" cy="140.5" rx="34" ry="2.2" fill="#1b1b1d" opacity=".12"/>
<g class="c-all">
 <g class="c-board">
  <rect x="8" y="123" width="84" height="8" rx="4" fill="#6d1327"/>
  <g fill="#fbe9eb">${keys}</g>
  ${wheel(24)}${wheel(76)}
 </g>
 <rect x="34" y="96" width="9" height="22" rx="4" fill="#3b3b3f"/><rect x="57" y="96" width="9" height="22" rx="4" fill="#3b3b3f"/>
 <rect x="30" y="115" width="17" height="8" rx="4" fill="#b4182d"/><rect x="53" y="115" width="17" height="8" rx="4" fill="#b4182d"/>
 <g class="c-torso">
  <rect x="28" y="68" width="44" height="34" rx="12" fill="#6d1327"/>
  <rect x="38" y="90" width="24" height="9" rx="3" fill="none" stroke="#8a2237" stroke-width="1.4"/>
  <text x="50" y="84" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="9" font-weight="700" fill="#fbe9eb">&lt;/&gt;</text>
 </g>
 <g class="arm-l"><path d="M31 76 C22 82 20 92 22 99" stroke="#6d1327" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="22" cy="101" r="4.6" fill="#fbe9eb"/></g>
 <g class="arm-r"><path d="M69 76 C78 82 80 92 78 99" stroke="#6d1327" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="78" cy="101" r="4.6" fill="#fbe9eb"/></g>
 <rect x="44" y="63" width="12" height="8" fill="#3b3b3f"/>
 <g class="c-head">
  <path d="M12 44C12 -6 88 -6 88 44" stroke="#b4182d" stroke-width="4.2" fill="none" stroke-linecap="round"/>
  <rect x="17" y="18" width="66" height="48" rx="9" fill="#1b1b1d"/>
  <rect x="22" y="23" width="56" height="33" rx="5" fill="#26262b"/>
  <path d="M22 28a5 5 0 0 1 5-5h14L28 56h-1a5 5 0 0 1-5-5z" fill="#fff" opacity=".05"/>
  <rect x="24" y="60" width="10" height="2" rx="1" fill="#4a4a50"/><circle cx="70" cy="61" r="1.8" fill="#b4182d" class="led"/>
  <rect x="7" y="32" width="11" height="24" rx="5" fill="#b4182d" stroke="#6d1327" stroke-width="1.5"/>
  <rect x="82" y="32" width="11" height="24" rx="5" fill="#b4182d" stroke="#6d1327" stroke-width="1.5"/>
  <g class="face-look"><g class="face" fill="none" stroke="#fbe9eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
   <g class="f f-neutral"><rect x="34" y="31" width="7" height="11" rx="3.5" fill="#fbe9eb" stroke="none"/><rect x="59" y="31" width="7" height="11" rx="3.5" fill="#fbe9eb" stroke="none"/><path d="M42 48Q50 54 58 48" stroke-width="2.6"/></g>
   <g class="f f-happy"><path d="M34 41L37.5 33L41 41"/><path d="M59 41L62.5 33L66 41"/><path d="M42 47Q50 58 58 47Z" fill="#fbe9eb" stroke-width="1.6"/></g>
   <g class="f f-sleepy"><path d="M34 39H42"/><path d="M58 39H66"/><path d="M46 49H54" stroke-width="2.4"/></g>
   <g class="f f-wow"><circle cx="38" cy="37" r="4.6" stroke-width="2.6"/><circle cx="62" cy="37" r="4.6" stroke-width="2.6"/><circle cx="50" cy="49.5" r="3" stroke-width="2.4"/></g>
   <g class="f f-wink"><rect x="34" y="31" width="7" height="11" rx="3.5" fill="#fbe9eb" stroke="none"/><path d="M58 39H66"/><path d="M42 48Q52 54 60 47" stroke-width="2.6"/></g>
   <g class="f f-code"><rect x="34" y="33" width="7" height="8" rx="3.5" fill="#fbe9eb" stroke="none"/><rect x="59" y="33" width="7" height="8" rx="3.5" fill="#fbe9eb" stroke="none"/><rect class="cursor" x="46.5" y="45" width="7" height="9" fill="#b4182d" stroke="none"/></g>
  </g></g>
 </g>
</g>
<g class="zzz" font-family="'Caveat',cursive" font-weight="700" fill="#b4182d"><text x="86" y="16" font-size="14">z</text><text x="92" y="7" font-size="10">z</text></g>
</svg>`
}

export function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="9" width="56" height="42" rx="9" fill="#1b1b1d"/><rect x="9" y="14" width="46" height="29" rx="5" fill="#26262b"/><rect x="19" y="21" width="6" height="10" rx="3" fill="#fbe9eb"/><rect x="39" y="21" width="6" height="10" rx="3" fill="#fbe9eb"/><path d="M25 36q7 5 14 0" stroke="#fbe9eb" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="26" y="52" width="12" height="5" fill="#3b3b3f"/><rect x="18" y="57" width="28" height="4" rx="2" fill="#b4182d"/></svg>`
}
