type Scene = "water" | "theme" | "temple" | "citrus" | "orchard" | "rice" | "falls" | "festival" | "heritage" | "eco" | "forest-falls" | "craft";

const scenes: Record<string, Scene> = {
  "amazing-bay": "water",
  "son-tien-amazing-world": "theme",
  "ong-pagoda": "temple",
  "tan-trieu-orchards": "citrus",
  "nam-hue-orchard": "citrus",
  "phu-dien-fields": "rice",
  "binh-loc-orchards": "orchard",
  "da-han-waterfall": "falls",
  "long-khanh-fruit-festival": "festival",
  "ta-thiet": "heritage",
  "loc-ninh-meeting-house": "heritage",
  "my-le-eco-resort": "eco",
  "dak-mai-waterfall": "forest-falls",
  "community-cultural-experiences": "craft",
};
export const placeIllustrationIds = Object.keys(scenes);

const labels: Record<Scene, { vi: string; en: string }> = {
  water: { vi: "Sóng nước và máng trượt", en: "Waves and water slides" },
  theme: { vi: "Đường chân trời vui chơi", en: "A playful skyline" },
  temple: { vi: "Mái miếu và đèn lồng", en: "Temple roof and lanterns" },
  citrus: { vi: "Vườn bưởi và trái chín", en: "Pomelo trees and fruit" },
  orchard: { vi: "Vườn cây theo mùa", en: "Seasonal orchard" },
  rice: { vi: "Ruộng lúa và bờ vùng", en: "Rice fields and field paths" },
  falls: { vi: "Dòng thác qua ghềnh đá", en: "Water over rocky ledges" },
  festival: { vi: "Sắc màu ngày hội trái cây", en: "A fruit festival palette" },
  heritage: { vi: "Nét gợi nhớ di tích", en: "A heritage-inspired scene" },
  eco: { vi: "Hồ nước và nhà nghỉ sinh thái", en: "A lake and eco lodges" },
  "forest-falls": { vi: "Thác giữa tán rừng", en: "A waterfall under forest canopy" },
  craft: { vi: "Họa tiết thủ công địa phương", en: "Local craft motifs" },
};

const palettes: Record<Scene, { sky: string; hill: string; accent: string; deep: string }> = {
  water: { sky: "#ccebf0", hill: "#9cc9bd", accent: "#ef9760", deep: "#287f91" },
  theme: { sky: "#e2dff1", hill: "#b9b1d6", accent: "#ed9c5b", deep: "#695e9b" },
  temple: { sky: "#efe2cb", hill: "#bdc7a0", accent: "#c64f40", deep: "#604d40" },
  citrus: { sky: "#d9ebcd", hill: "#8db27c", accent: "#e7a73f", deep: "#437550" },
  orchard: { sky: "#d9e9d0", hill: "#91b787", accent: "#db7753", deep: "#476f58" },
  rice: { sky: "#cfe7db", hill: "#a8c27e", accent: "#d5bd66", deep: "#47755d" },
  falls: { sky: "#d9e9e4", hill: "#91aa91", accent: "#9dcfd4", deep: "#53695c" },
  festival: { sky: "#f1dfc7", hill: "#a7c090", accent: "#d75f4e", deep: "#6e6148" },
  heritage: { sky: "#e8e5d6", hill: "#a9bb9a", accent: "#ba694e", deep: "#5d6251" },
  eco: { sky: "#d5e9e5", hill: "#8caf87", accent: "#c68b58", deep: "#4d7061" },
  "forest-falls": { sky: "#cfddd0", hill: "#688873", accent: "#a4d5d1", deep: "#345b4d" },
  craft: { sky: "#eadfcd", hill: "#b8a27e", accent: "#c7684d", deep: "#6b5541" },
};

export function PlaceIllustration({ placeId, placeName, locale, compact = false }: {
  placeId: string;
  placeName: string;
  locale: string;
  compact?: boolean;
}) {
  const scene = scenes[placeId];
  if (!scene) return null;
  const p = palettes[scene];
  const en = locale === "en";

  return <svg className={`place-illustration${compact ? " compact" : ""}`} viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${en ? "Illustration for" : "Minh họa cho"} ${placeName}: ${en ? labels[scene].en : labels[scene].vi}`} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`sky-${placeId}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.sky}/><stop offset="1" stopColor="#f8f3df"/></linearGradient>
      <linearGradient id={`water-${placeId}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.accent}/><stop offset="1" stopColor={p.deep}/></linearGradient>
      <pattern id={`rows-${placeId}`} width="82" height="42" patternUnits="userSpaceOnUse"><path d="M0 38 Q41 8 82 38" fill="none" stroke="#eff0cf" strokeWidth="5" opacity=".75"/></pattern>
    </defs>
    <rect width="1200" height="640" fill={`url(#sky-${placeId})`}/>
    <circle cx="955" cy="120" r="58" fill="#f4c46d" opacity=".9"/>
    <path d="M0 355 Q160 240 325 340 T655 315 T950 325 T1200 278 V640 H0Z" fill={p.hill}/>
    <path d="M0 430 Q190 335 390 412 T790 390 T1200 365 V640 H0Z" fill={p.deep} opacity=".8"/>
    <SceneArt scene={scene} accent={p.accent} deep={p.deep} />
    {!compact && <g className="illustration-note"><rect y="572" width="1200" height="68" fill="#203c34" opacity=".78"/><text x="42" y="618" fill="#fffdf6" fontSize="28" fontFamily="Arial, sans-serif" fontWeight="700">{en ? "NaiVerse illustration · not a site photo" : "Minh họa NaiVerse · không phải ảnh thực địa"}</text></g>}
  </svg>;
}

function SceneArt({ scene, accent, deep }: { scene: Scene; accent: string; deep: string }) {
  if (scene === "water") return <g>
    <path d="M0 470 Q145 425 285 470 T570 470 T855 470 T1200 455 V600 H0Z" fill={`url(#water-amazing-bay)`}/>
    <path d="M90 432 C175 432 180 330 265 330 C340 330 337 390 420 390" fill="none" stroke="#fff4d7" strokeWidth="38" strokeLinecap="round"/>
    <path d="M90 432 C175 432 180 330 265 330 C340 330 337 390 420 390" fill="none" stroke={accent} strokeWidth="24" strokeLinecap="round"/>
    <path d="M65 520 Q130 495 195 520 T325 520 M500 548 Q565 523 630 548 T760 548 M890 510 Q955 485 1020 510 T1150 510" fill="none" stroke="#d5f4eb" strokeWidth="9" opacity=".85"/>
    <Palm x={880} y={390} color={deep}/><Palm x={1050} y={410} color={deep}/>
  </g>;
  if (scene === "theme") return <g>
    <path d="M0 495 Q200 430 420 490 T850 480 T1200 450 V600 H0Z" fill={deep}/>
    <circle cx="380" cy="365" r="125" fill="none" stroke="#fff5e7" strokeWidth="13"/><circle cx="380" cy="365" r="12" fill={accent}/>
    {[0,1,2,3,4,5,6,7].map((n) => <g key={n} transform={`rotate(${n * 45} 380 365)`}><line x1="380" y1="365" x2="380" y2="240" stroke="#fff5e7" strokeWidth="8"/><circle cx="380" cy="242" r="18" fill={accent}/></g>)}
    <Tower x={710} y={365} color={accent} deep={deep}/><Tower x={865} y={395} color="#eac675" deep={deep}/>
  </g>;
  if (scene === "temple") return <g>
    <path d="M245 450 600 245 955 450Z" fill={deep}/><path d="M330 440 600 295 870 440Z" fill="#f4e5c8"/>
    <path d="M205 450 Q600 405 995 450 L960 487 Q600 450 240 487Z" fill={accent}/>
    <path d="M340 340 Q600 305 860 340 L830 370 Q600 344 370 370Z" fill={accent}/>
    <path d="M410 450V540 M515 450V540 M685 450V540 M790 450V540" stroke={deep} strokeWidth="26"/>
    <Lantern x={265} y={510} color={accent}/><Lantern x={935} y={510} color={accent}/>
  </g>;
  if (scene === "citrus" || scene === "orchard") return <g>
    {[250,480,720,960].map((x, i) => <g key={x}><path d={`M${x} 500V${330 + (i % 2) * 25}`} stroke="#614b39" strokeWidth="24"/><circle cx={x} cy={315 + (i % 2) * 25} r="94" fill={deep}/><circle cx={x - 35} cy={290 + (i % 2) * 25} r="44" fill="#8bb875"/><circle cx={x + 32} cy={310 + (i % 2) * 25} r="40" fill="#9cc684"/>{[[-35,15],[26,-8],[0,48]].map(([dx,dy], j) => <circle key={j} cx={x + dx} cy={350 + (i % 2) * 25 + dy} r={scene === "citrus" ? 18 : 14} fill={scene === "citrus" ? accent : "#d77b55"}/>)}</g>)}
    <path d="M0 548 Q300 510 600 548 T1200 535 V600 H0Z" fill="#789967"/>
  </g>;
  if (scene === "rice") return <g>
    <path d="M0 470 Q200 405 400 470 T800 470 T1200 450 V600 H0Z" fill="#c5b75e"/><path d="M0 470 Q200 405 400 470 T800 470 T1200 450 V600 H0Z" fill={`url(#rows-${"phu-dien-fields"})`}/>
    <path d="M80 530 Q250 480 430 530 T790 530 T1150 510" fill="none" stroke="#ede8b9" strokeWidth="10"/>
    <g fill="#4d7858"><path d="M215 448V348l-45-65 70 50 10-85 18 85 62-50-38 66v99Z"/><path d="M900 447V340l-42-60 66 44 15-80 17 80 62-44-42 63v105Z"/></g>
  </g>;
  if (scene === "falls" || scene === "forest-falls") return <g>
    {[120,270,430,760,930,1080].map((x, i) => <g key={x}><path d={`M${x} 420V${260 + (i % 3) * 26}`} stroke={deep} strokeWidth="24"/><circle cx={x} cy={260 + (i % 3) * 26} r={76 - (i % 2) * 10} fill={deep}/><circle cx={x - 29} cy={240 + (i % 3) * 26} r="32" fill={scene === "forest-falls" ? "#78986f" : "#aac68c"}/></g>)}
    <path d="M420 338H790L748 400 712 435 685 520 630 558 585 500 555 430 478 397Z" fill="#777c6c"/>
    <path d="M482 356H730L698 411 675 454 645 525 611 504 591 436 540 404Z" fill={accent}/>
    <path d="M0 548 Q180 515 360 548 T720 548 T1200 530 V610 H0Z" fill="#408392" opacity=".85"/>
  </g>;
  if (scene === "festival") return <g>
    <path d="M170 265 Q600 425 1030 260" fill="none" stroke={deep} strokeWidth="8"/>
    {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${205 + i * 112} ${300 + (i % 3) * 15} l50 0 -25 48Z`} fill={i % 2 ? accent : "#eac675"}/>)}
    <Basket x={400} y={405} color={accent}/><Basket x={630} y={380} color="#edc16b"/><Basket x={850} y={415} color="#d97656"/>
    <path d="M220 540H980" stroke="#f4e8d4" strokeWidth="12"/>
  </g>;
  if (scene === "heritage") return <g>
    <path d="M280 430 600 270 920 430Z" fill={deep}/><path d="M350 420 600 300 850 420Z" fill="#e9d5b5"/>
    <path d="M250 425H950V470H250Z" fill={accent}/><path d="M330 465V550 M470 465V550 M730 465V550 M870 465V550" stroke="#f1e5cd" strokeWidth="28"/>
    <path d="M245 550H955" stroke={deep} strokeWidth="28"/><rect x="555" y="440" width="90" height="110" rx="42" fill={deep}/>
    <Tree x={150} y={465} color={deep}/><Tree x={1050} y={465} color={deep}/>
  </g>;
  if (scene === "eco") return <g>
    <path d="M0 475 Q175 440 350 475 T700 475 T1050 465 T1200 460V610H0Z" fill="#488c91"/>
    <path d="M0 515 Q180 480 360 515 T720 515 T1200 500" fill="none" stroke="#c8ece0" strokeWidth="8"/>
    <Cabin x={330} y={385} color={accent} deep={deep}/><Cabin x={670} y={355} color="#e5c17e" deep={deep}/><Cabin x={950} y={405} color={accent} deep={deep}/>
    <Tree x={160} y={470} color={deep}/><Tree x={1090} y={470} color={deep}/>
  </g>;
  return <g>
    <path d="M230 510H970" stroke={deep} strokeWidth="28" strokeLinecap="round"/>
    <Basket x={410} y={350} color={accent}/><Basket x={800} y={350} color="#dfb767"/>
    <path d="M500 480V340 M500 360 450 315 M500 390 555 335 M700 480V335 M700 365 640 315 M700 400 760 340" stroke={deep} strokeWidth="18" strokeLinecap="round"/>
    <circle cx="600" cy="300" r="22" fill={accent}/><circle cx="620" cy="345" r="18" fill="#eac675"/><circle cx="580" cy="382" r="18" fill="#8db27c"/>
  </g>;
}

function Palm({ x, y, color }: { x: number; y: number; color: string }) {
  return <g fill={color}><path d={`M${x} ${y + 100} Q${x - 5} ${y + 35} ${x + 12} ${y}`} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"/><path d={`M${x + 10} ${y + 5}q-80-75-145-25 70 0 136 42q-30-98-100-99 68 38 100 99q14-96 92-103-64 51-83 111q85-58 140-13-90 8-150 40Z`}/></g>;
}
function Tree({ x, y, color }: { x: number; y: number; color: string }) { return <g><path d={`M${x} ${y}v85`} stroke="#66513b" strokeWidth="18"/><circle cx={x} cy={y - 25} r="52" fill={color}/><circle cx={x - 32} cy={y - 10} r="31" fill={color} opacity=".8"/></g>; }
function Tower({ x, y, color, deep }: { x: number; y: number; color: string; deep: string }) { return <g><path d={`M${x} ${y + 125}v-115l45-52 45 52v115Z`} fill={color}/><path d={`M${x - 12} ${y + 15}h115l-58-66Z`} fill={deep}/><rect x={x + 36} y={y + 61} width="22" height="64" rx="11" fill="#f7edda"/></g>; }
function Lantern({ x, y, color }: { x: number; y: number; color: string }) { return <g><path d={`M${x} ${y - 35}v-25m-22 35h44l-5 45h-34Z`} fill={color}/><path d={`M${x} ${y + 20}v20`} stroke="#6b5541" strokeWidth="4"/></g>; }
function Basket({ x, y, color }: { x: number; y: number; color: string }) { return <g><path d={`M${x - 74} ${y}h148l-18 104h-112Z`} fill={color}/><path d={`M${x - 51} ${y}q51-106 102 0`} fill="none" stroke="#73563a" strokeWidth="12"/><path d={`M${x - 45} ${y + 36}h90m-98 28h106m-110 28h114`} stroke="#fff4dc" strokeWidth="7" opacity=".75"/></g>; }
function Cabin({ x, y, color, deep }: { x: number; y: number; color: string; deep: string }) { return <g><path d={`M${x - 100} ${y}  ${x} ${y - 70} ${x + 100} ${y}Z`} fill={deep}/><rect x={x - 80} y={y} width="160" height="100" rx="8" fill={color}/><rect x={x - 18} y={y + 40} width="36" height="60" fill={deep}/></g>; }
