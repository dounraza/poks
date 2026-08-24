import { useState } from "react"

type Card = { rank: string; suit: string }
type PlayerStatus = "active" | "folded" | "allin" | "waiting" | "empty"

type Player = {
  id: number
  name: string
  chips: number
  cards: Card[]
  bet: number
  status: PlayerStatus
  isDealer: boolean
  isHero: boolean
}

// 9 seats evenly distributed, starting from bottom (hero)
const SEAT_ANGLES = [270, 310, 350, 30, 70, 110, 150, 190, 230]

// Radii for info panels (% of container half-dimensions)
const RX_INFO = 37
const RY_INFO = 38
// Radii for chairs — further from center
const RX_CHAIR = 47
const RY_CHAIR = 50

function posAt(angleDeg: number, rx: number, ry: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    left: `${50 + rx * Math.cos(rad)}%`,
    top: `${50 + ry * Math.sin(rad)}%`,
  }
}

const RED_SUITS = new Set(["♥", "♦"])

const COMMUNITY: Card[] = [
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♥" },
  { rank: "10", suit: "♦" },
  { rank: "7", suit: "♣" },
  { rank: "2", suit: "♠" },
]

const INITIAL_PLAYERS: Player[] = [
  { id: 0, name: "You", chips: 4200, cards: [{ rank: "A", suit: "♥" }, { rank: "A", suit: "♦" }], bet: 200, status: "active", isDealer: false, isHero: true },
  { id: 1, name: "Viktor K.", chips: 8750, cards: [], bet: 400, status: "active", isDealer: false, isHero: false },
  { id: 2, name: "Marina S.", chips: 1200, cards: [], bet: 0, status: "folded", isDealer: false, isHero: false },
  { id: 3, name: "Damien R.", chips: 12400, cards: [], bet: 400, status: "active", isDealer: true, isHero: false },
  { id: 4, name: "Chen Wei", chips: 6600, cards: [], bet: 2400, status: "allin", isDealer: false, isHero: false },
  { id: 5, name: "Sofia M.", chips: 3100, cards: [], bet: 200, status: "active", isDealer: false, isHero: false },
  { id: 6, name: "James T.", chips: 9800, cards: [], bet: 0, status: "folded", isDealer: false, isHero: false },
  { id: 7, name: "Kaito N.", chips: 5500, cards: [], bet: 400, status: "active", isDealer: false, isHero: false },
  { id: 8, name: "— Open —", chips: 0, cards: [], bet: 0, status: "empty", isDealer: false, isHero: false },
]

// Leather chair SVG — unique gradient IDs per instance via uid prop
function ChairSVG({ uid, size = 80 }: { uid: string; size?: number }) {
  const h = Math.round(size * 240 / 220)
  const b = `bl${uid}`; const s = `sl${uid}`; const al = `aL${uid}`; const ar = `aR${uid}`; const lw = `lw${uid}`; const sh = `sh${uid}`
  return (
    <svg viewBox="0 0 220 240" width={size} height={h} xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <radialGradient id={b} cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#2e2e2e" /><stop offset="50%" stopColor="#161616" /><stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id={s} cx="50%" cy="22%" r="70%">
          <stop offset="0%" stopColor="#272727" /><stop offset="55%" stopColor="#131313" /><stop offset="100%" stopColor="#080808" />
        </radialGradient>
        <radialGradient id={al} cx="30%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#252525" /><stop offset="100%" stopColor="#0d0d0d" />
        </radialGradient>
        <radialGradient id={ar} cx="70%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#252525" /><stop offset="100%" stopColor="#0d0d0d" />
        </radialGradient>
        <radialGradient id={lw} cx="50%" cy="0%" r="110%">
          <stop offset="0%" stopColor="#4a2c14" /><stop offset="100%" stopColor="#1c0e05" />
        </radialGradient>
        <filter id={sh} x="-25%" y="-15%" width="150%" height="145%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>

      <g filter={`url(#${sh})`}>
        {/* Back legs */}
        <rect x="63" y="168" width="10" height="44" rx="3" fill={`url(#${lw})`} />
        <rect x="147" y="168" width="10" height="44" rx="3" fill={`url(#${lw})`} />
        <rect x="64" y="186" width="8" height="3" rx="1" fill="#3d2010" />
        <rect x="148" y="186" width="8" height="3" rx="1" fill="#3d2010" />

        {/* Chair back body */}
        <path d="M 48 54 Q 48 36 60 32 L 160 32 Q 172 36 172 54 L 172 158 Q 172 168 160 171 L 60 171 Q 48 168 48 158 Z" fill={`url(#${b})`} />
        <path d="M 50 54 Q 50 38 61 34 L 159 34 Q 170 38 170 54 L 170 159 Q 170 166 159 169 L 61 169 Q 50 166 50 159 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
        {/* Sheen */}
        <path d="M 60 40 Q 74 33 100 37 L 112 41 Q 86 45 70 57 Z" fill="rgba(255,255,255,0.06)" />

        {/* Tufting — 3×4 grid */}
        {([0,1,2] as number[]).flatMap(col =>
          ([0,1,2,3] as number[]).map(row => {
            const cx = 80 + col * 30; const cy = 57 + row * 27
            return (
              <g key={`${col}-${row}`}>
                <path d={`M ${cx} ${cy-10} L ${cx+11} ${cy} L ${cx} ${cy+10} L ${cx-11} ${cy} Z`} fill="#0c0c0c" stroke="rgba(255,255,255,0.055)" strokeWidth="0.7" />
                <circle cx={cx} cy={cy} r="3" fill="#111" stroke="rgba(201,168,76,0.4)" strokeWidth="0.6" />
                <circle cx={cx} cy={cy} r="1" fill="#0a0a0a" />
              </g>
            )
          })
        )}

        {/* Back top cap */}
        <path d="M 48 54 Q 48 36 60 32 L 160 32 Q 172 36 172 54 L 172 65 Q 110 71 48 65 Z" fill="#1b1b1b" />
        <path d="M 52 52 Q 52 38 63 35 L 157 35 Q 168 38 168 52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.9" />

        {/* Left arm */}
        <path d="M 16 96 Q 14 89 18 85 L 51 85 Q 54 89 54 97 L 54 161 Q 54 170 46 172 L 21 172 Q 13 168 13 160 L 13 104 Q 13 99 16 96 Z" fill={`url(#${al})`} />
        <path d="M 13 102 Q 13 97 17 94 L 21 92 Q 18 97 18 103 L 18 160 Q 18 167 23 170 L 13 160 Z" fill="rgba(0,0,0,0.28)" />
        <ellipse cx="33" cy="87" rx="19" ry="6.5" fill="#1d1d1d" />
        <ellipse cx="33" cy="85" rx="19" ry="6" fill="#252525" />
        <ellipse cx="29" cy="83.5" rx="10" ry="2.5" fill="rgba(255,255,255,0.065)" />
        <path d="M 13 158 Q 13 168 21 172 L 46 172 Q 54 170 54 161 L 54 168 Q 54 176 45 178 L 19 178 Q 11 175 11 165 Z" fill="#0e0e0e" />
        {[0,1,2,3,4].map(i => <circle key={i} cx={16 + i * 6} cy={172} r="1.8" fill="#c9a84c" opacity="0.7" key={`nl${i}`} />)}

        {/* Right arm */}
        <path d="M 204 96 Q 206 89 202 85 L 169 85 Q 166 89 166 97 L 166 161 Q 166 170 174 172 L 199 172 Q 207 168 207 160 L 207 104 Q 207 99 204 96 Z" fill={`url(#${ar})`} />
        <path d="M 207 102 Q 207 97 203 94 L 199 92 Q 202 97 202 103 L 202 160 Q 202 167 197 170 L 207 160 Z" fill="rgba(255,255,255,0.02)" />
        <ellipse cx="187" cy="87" rx="19" ry="6.5" fill="#1d1d1d" />
        <ellipse cx="187" cy="85" rx="19" ry="6" fill="#252525" />
        <ellipse cx="191" cy="83.5" rx="10" ry="2.5" fill="rgba(255,255,255,0.06)" />
        <path d="M 207 158 Q 207 168 199 172 L 174 172 Q 166 170 166 161 L 166 168 Q 166 176 175 178 L 201 178 Q 209 175 209 165 Z" fill="#0e0e0e" />
        {[0,1,2,3,4].map(i => <circle key={i} cx={204 - i * 6} cy={172} r="1.8" fill="#c9a84c" opacity="0.7" key={`nr${i}`} />)}

        {/* Seat cushion */}
        <path d="M 15 154 Q 14 147 24 144 L 196 144 Q 206 147 205 154 L 205 169 Q 205 177 195 179 L 25 179 Q 15 177 15 169 Z" fill={`url(#${s})`} />
        <path d="M 28 147 Q 56 142 102 144 L 120 146 Q 73 149 44 159 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M 18 153 Q 18 147 27 145 L 193 145 Q 202 147 202 153" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.1" />
        <path d="M 15 169 Q 15 177 25 179 L 195 179 Q 205 177 205 169 L 205 173 Q 205 183 193 185 L 27 185 Q 15 183 15 173 Z" fill="#0c0c0c" />

        {/* Front legs */}
        <rect x="27" y="181" width="13" height="46" rx="3" fill={`url(#${lw})`} />
        <rect x="29" y="193" width="9" height="3.5" rx="1.5" fill="#4a2c14" />
        <rect x="29" y="203" width="9" height="3.5" rx="1.5" fill="#4a2c14" />
        <rect x="28" y="221" width="11" height="5" rx="2" fill="#3a200f" />
        <rect x="28" y="183" width="4" height="36" rx="1.5" fill="rgba(255,255,255,0.045)" />

        <rect x="180" y="181" width="13" height="46" rx="3" fill={`url(#${lw})`} />
        <rect x="182" y="193" width="9" height="3.5" rx="1.5" fill="#4a2c14" />
        <rect x="182" y="203" width="9" height="3.5" rx="1.5" fill="#4a2c14" />
        <rect x="181" y="221" width="11" height="5" rx="2" fill="#3a200f" />
        <rect x="180" y="183" width="4" height="36" rx="1.5" fill="rgba(255,255,255,0.045)" />
      </g>
    </svg>
  )
}

function CardFace({ card, small = false }: { card: Card; small?: boolean }) {
  const isRed = RED_SUITS.has(card.suit)
  const color = isRed ? "#c0212c" : "#1a1a1a"
  const w = small ? "w-7 h-10" : "w-10 h-14"
  return (
    <div className={`card-face relative ${w} rounded-sm flex flex-col justify-between p-0.5 select-none`}>
      <span style={{ color, fontSize: small ? "0.55rem" : "0.7rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1 }}>{card.rank}</span>
      <span style={{ color, fontSize: small ? "0.65rem" : "0.85rem", lineHeight: 1, textAlign: "center" }}>{card.suit}</span>
      <span style={{ color, fontSize: small ? "0.55rem" : "0.7rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1, transform: "rotate(180deg)" }}>{card.rank}</span>
    </div>
  )
}

function CardBack({ small = false }: { small?: boolean }) {
  const w = small ? "w-7 h-10" : "w-10 h-14"
  return <div className={`card-back relative ${w} rounded-sm`} />
}

// Single player slot: chair behind + info panel in front
function PlayerSlot({ player, angle }: { player: Player; angle: number }) {
  const chairPos = posAt(angle, RX_CHAIR, RY_CHAIR)
  const infoPos = posAt(angle, RX_INFO, RY_INFO)
  const chairRotation = angle - 270

  const isFolded = player.status === "folded"
  const isAllIn = player.status === "allin"
  const isHero = player.isHero
  const isActive = player.status === "active"
  const isEmpty = player.status === "empty"

  const borderColor = isHero ? "border-sky-400/60"
    : isActive ? "border-yellow-600/50"
    : isFolded ? "border-gray-700/25"
    : isAllIn ? "border-red-500/55"
    : "border-gray-700/20"

  const panelBg = isHero ? "bg-slate-900/92"
    : isFolded ? "bg-gray-900/55"
    : isEmpty ? "bg-gray-900/30"
    : "bg-gray-900/88"

  const glowClass = isHero ? "seat-glow-hero" : isActive ? "seat-glow-active" : ""

  return (
    <>
      {/* ── Chair ── */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: chairPos.left,
          top: chairPos.top,
          transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`,
          zIndex: isEmpty ? 4 : 7,
          filter: `drop-shadow(0 8px 20px rgba(0,0,0,0.8)) ${isFolded ? "brightness(0.55) saturate(0.4)" : isEmpty ? "brightness(0.4)" : "brightness(1)"}`,
          opacity: isFolded ? 0.7 : isEmpty ? 0.45 : 1,
          transition: "filter 0.3s, opacity 0.3s",
        }}
      >
        <ChairSVG uid={`p${player.id}`} size={82} />
      </div>

      {/* ── Info panel ── */}
      <div
        className="absolute"
        style={{
          left: infoPos.left,
          top: infoPos.top,
          transform: "translate(-50%, -50%)",
          zIndex: 12,
        }}
      >
        <div
          className={`relative flex flex-col items-center gap-1 px-2 pt-2 pb-1.5 rounded-lg border ${borderColor} ${panelBg} ${glowClass} min-w-[82px]`}
          style={{ backdropFilter: "blur(10px)" }}
        >
          {isEmpty ? (
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "#444", letterSpacing: "0.1em" }}>OPEN</span>
          ) : (
            <>
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${isHero ? "border-sky-400/50 bg-sky-900/50" : "border-gray-600/40 bg-gray-800/60"} ${isFolded ? "opacity-35" : ""}`}
                style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", color: isHero ? "#7dd3fc" : "#c9a84c" }}
              >
                {player.name.charAt(0)}
              </div>

              {/* Name */}
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.56rem", color: isFolded ? "#4b4b4b" : isHero ? "#7dd3fc" : "#c9a84c", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {player.name}
              </span>

              {/* Chips */}
              {player.chips > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: isFolded ? "#3a3a3a" : "#86efac" }}>
                  ${player.chips.toLocaleString()}
                </span>
              )}

              {/* Cards — inclinées selon l'angle du siège */}
              <div
                className={`flex gap-0.5 mt-0.5 ${isFolded ? "opacity-20" : ""}`}
                style={{ transform: `rotate(${angle - 270}deg)` }}
              >
                {isHero
                  ? player.cards.map((c, i) => <CardFace key={i} card={c} small />)
                  : <><CardBack small /><CardBack small /></>
                }
              </div>

              {/* Bet */}
              {player.bet > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="chip w-3 h-3 bg-red-600" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#fca5a5" }}>${player.bet}</span>
                </div>
              )}

              {/* Status */}
              {isFolded && <span style={{ fontSize: "0.48rem", color: "#555", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}>FOLDED</span>}
              {isAllIn && <span style={{ fontSize: "0.48rem", color: "#ef4444", fontFamily: "var(--font-display)", letterSpacing: "0.1em" }}>ALL-IN</span>}

              {/* Dealer button */}
              {player.isDealer && (
                <div className="dealer-btn absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-gray-900" style={{ fontSize: "0.44rem", fontWeight: 900 }}>D</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [players] = useState<Player[]>(INITIAL_PLAYERS)
  const [pot] = useState(4800)
  const [heroAction, setHeroAction] = useState<string | null>(null)

  return (
    <div className="room-bg w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Overhead ambient glow */}
      <div className="absolute pointer-events-none" style={{ width: "65vw", height: "45vw", background: "radial-gradient(ellipse, rgba(35,95,55,0.16) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", filter: "blur(50px)" }} />

      {/* Table container */}
      <div className="relative" style={{ width: "min(88vw, 1080px)", height: "min(78vh, 660px)" }}>

        {/* Rail */}
        <div className="table-rail absolute rounded-[50%]" style={{ inset: "6%", border: "2px solid rgba(201,168,76,0.15)" }} />

        {/* Felt */}
        <div className="table-felt absolute rounded-[50%]" style={{ inset: "10%" }}>
          <div className="absolute rounded-[50%] pointer-events-none" style={{ inset: "-2%", border: "1px solid rgba(201,168,76,0.1)" }} />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              {COMMUNITY.map((card, i) => <CardFace key={i} card={card} />)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="chip w-5 h-5 bg-blue-600" />
              <div className="chip w-5 h-5 bg-red-600" />
              <div className="chip w-5 h-5 bg-gray-100" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "#e8c97a", letterSpacing: "0.08em" }}>
                POT: ${pot.toLocaleString()}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.55rem", color: "rgba(201,168,76,0.22)", letterSpacing: "0.28em", marginTop: "0.2rem" }}>
              GRAND CASINO POKER
            </div>
          </div>
        </div>

        {/* 9 player slots — each with chair + info panel */}
        {players.map((player, i) => (
          <PlayerSlot key={player.id} player={player} angle={SEAT_ANGLES[i]} />
        ))}
      </div>

      {/* Hero action bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ zIndex: 20 }}>
        {heroAction ? (
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#c9a84c", letterSpacing: "0.15em", background: "rgba(0,0,0,0.75)", padding: "0.45rem 1.4rem", borderRadius: "0.5rem", border: "1px solid rgba(201,168,76,0.28)" }}>
            {heroAction}
          </div>
        ) : (
          [
            { label: "FOLD",     bg: "rgba(75,18,18,0.88)", border: "rgba(200,50,50,0.5)" },
            { label: "CHECK",    bg: "rgba(18,48,28,0.88)", border: "rgba(50,175,80,0.5)" },
            { label: "CALL $400",bg: "rgba(18,38,68,0.88)", border: "rgba(60,130,220,0.5)" },
            { label: "RAISE",    bg: "rgba(58,38,10,0.88)", border: "rgba(201,168,76,0.55)" },
          ].map(({ label, bg, border }) => (
            <button
              key={label}
              onClick={() => setHeroAction(label.split(" ")[0])}
              className="action-btn px-5 py-2 rounded-lg text-xs"
              style={{ background: bg, border: `1px solid ${border}`, color: "#f5f0e8", fontFamily: "var(--font-display)", letterSpacing: "0.1em", cursor: "pointer", backdropFilter: "blur(8px)" }}
            >
              {label}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
