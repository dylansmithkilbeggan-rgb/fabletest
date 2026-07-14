// Premade sticker designs, drawn as inline SVG so the prototype needs no
// image assets. paint-order:stroke puts the white "die-cut" edge behind
// each fill.

const svgWrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${inner}</svg>`

const DIE_CUT = 'stroke="#fff" stroke-width="14" stroke-linejoin="round" style="paint-order:stroke"'

const art = {
  sunny: svgWrap(`
    <g ${DIE_CUT}>
      <g stroke="#fff" stroke-width="26" stroke-linecap="round">
        <path d="M100 22v14M100 164v14M22 100h14M164 100h14M45 45l10 10M145 145l10 10M155 45l-10 10M55 145l-10 10" />
      </g>
      <g stroke="#F59E0B" stroke-width="9" stroke-linecap="round">
        <path d="M100 22v14M100 164v14M22 100h14M164 100h14M45 45l10 10M145 145l10 10M155 45l-10 10M55 145l-10 10" />
      </g>
      <circle cx="100" cy="100" r="46" fill="#FBBF24"/>
    </g>
    <circle cx="84" cy="94" r="6" fill="#78350F"/>
    <circle cx="116" cy="94" r="6" fill="#78350F"/>
    <path d="M82 112q18 16 36 0" fill="none" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
  `),
  bolt: svgWrap(`
    <polygon points="112,18 58,110 94,110 82,182 146,86 108,86" fill="#2563eb" ${DIE_CUT}/>
    <polygon points="106,34 72,98 106,98 98,146 130,94 96,94" fill="#60A5FA"/>
  `),
  planet: svgWrap(`
    <g ${DIE_CUT}>
      <circle cx="100" cy="100" r="48" fill="#8B5CF6"/>
      <ellipse cx="100" cy="106" rx="86" ry="24" fill="none" stroke="#F472B6" stroke-width="12"/>
    </g>
    <circle cx="82" cy="88" r="12" fill="#A78BFA"/>
    <circle cx="116" cy="112" r="8" fill="#A78BFA"/>
    <circle cx="112" cy="78" r="5" fill="#C4B5FD"/>
  `),
  rainbow: svgWrap(`
    <g fill="none" stroke-linecap="round">
      <path d="M40 140a60 60 0 0 1 120 0" stroke="#fff" stroke-width="58"/>
      <path d="M40 140a60 60 0 0 1 120 0" stroke="#EF4444" stroke-width="12"/>
      <path d="M52 140a48 48 0 0 1 96 0" stroke="#F59E0B" stroke-width="12"/>
      <path d="M64 140a36 36 0 0 1 72 0" stroke="#22C55E" stroke-width="12"/>
      <path d="M76 140a24 24 0 0 1 48 0" stroke="#2563eb" stroke-width="12"/>
    </g>
    <g ${DIE_CUT}>
      <ellipse cx="44" cy="142" rx="22" ry="14" fill="#E0F2FE"/>
      <ellipse cx="156" cy="142" rx="22" ry="14" fill="#E0F2FE"/>
    </g>
  `),
  cat: svgWrap(`
    <g ${DIE_CUT}>
      <path d="M52 58 L66 26 L88 52 Z" fill="#374151"/>
      <path d="M148 58 L134 26 L112 52 Z" fill="#374151"/>
      <circle cx="100" cy="106" r="58" fill="#4B5563"/>
    </g>
    <path d="M58 62 L66 40 L80 56 Z" fill="#F9A8D4"/>
    <path d="M142 62 L134 40 L120 56 Z" fill="#F9A8D4"/>
    <rect x="62" y="88" width="34" height="20" rx="10" fill="#111827"/>
    <rect x="104" y="88" width="34" height="20" rx="10" fill="#111827"/>
    <path d="M96 98h8" stroke="#111827" stroke-width="5"/>
    <path d="M94 126q6 8 12 0" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
    <g stroke="#E5E7EB" stroke-width="4" stroke-linecap="round">
      <path d="M44 116h22M44 130l22-6M156 116h-22M156 130l-22-6"/>
    </g>
  `),
  ghost: svgWrap(`
    <path d="M100 26c-34 0-54 26-54 60v76l18-14 18 14 18-14 18 14 18-14 18 14V86c0-34-20-60-54-60z" fill="#F3F4F6" ${DIE_CUT.replace('#fff', '#dbeafe')}/>
    <circle cx="82" cy="92" r="9" fill="#1F2937"/>
    <circle cx="118" cy="92" r="9" fill="#1F2937"/>
    <ellipse cx="100" cy="120" rx="10" ry="13" fill="#1F2937"/>
    <circle cx="70" cy="112" r="7" fill="#FBCFE8"/>
    <circle cx="130" cy="112" r="7" fill="#FBCFE8"/>
  `),
  heart: svgWrap(`
    <path d="M100 170 C40 128 28 92 46 66 C60 46 92 46 100 72 C108 46 140 46 154 66 C172 92 160 128 100 170 Z" fill="#EF4444" ${DIE_CUT}/>
    <path d="M62 74 C68 62 84 60 92 70" fill="none" stroke="#FCA5A5" stroke-width="9" stroke-linecap="round"/>
  `),
  shroom: svgWrap(`
    <g ${DIE_CUT}>
      <path d="M100 30c-42 0-66 30-66 54 0 10 8 16 20 16h92c12 0 20-6 20-16 0-24-24-54-66-54z" fill="#EF4444"/>
      <path d="M78 100h44v42c0 16-10 26-22 26s-22-10-22-26z" fill="#FDE68A"/>
    </g>
    <circle cx="72" cy="66" r="10" fill="#FEF3C7"/>
    <circle cx="112" cy="52" r="12" fill="#FEF3C7"/>
    <circle cx="140" cy="76" r="8" fill="#FEF3C7"/>
    <circle cx="92" cy="128" r="4" fill="#B45309"/>
    <circle cx="108" cy="140" r="4" fill="#B45309"/>
  `),
}

const toDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

export const PRODUCTS = [
  { id: 'sunny', name: 'Sunny Side', price: 3.0, size: '7 cm die-cut', tag: 'Bestseller' },
  { id: 'bolt', name: 'Blue Bolt', price: 2.5, size: '8 cm die-cut', tag: null },
  { id: 'planet', name: 'Lil Planet', price: 3.5, size: '8 cm die-cut', tag: 'New' },
  { id: 'rainbow', name: 'Rainbow Days', price: 3.0, size: '7 cm die-cut', tag: null },
  { id: 'cat', name: 'Cool Cat', price: 3.5, size: '7 cm die-cut', tag: 'Bestseller' },
  { id: 'ghost', name: 'Friendly Boo', price: 2.5, size: '7 cm die-cut', tag: null },
  { id: 'heart', name: 'Big Heart', price: 2.5, size: '6 cm die-cut', tag: null },
  { id: 'shroom', name: 'Shroomie', price: 3.5, size: '8 cm die-cut', tag: 'New' },
].map((p) => ({ ...p, image: toDataUri(art[p.id]) }))
