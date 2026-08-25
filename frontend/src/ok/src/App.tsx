import { useState, useEffect, useMemo } from "react"
import { io, Socket } from "socket.io-client"

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

const SEAT_ANGLES = [270, 310, 350, 30, 70, 110, 150, 190, 230]
const RX_INFO = 42
const RY_INFO = 28
const RX_CHAIR = 52
const RY_CHAIR = 38

function posAt(angleDeg: number, rx: number, ry: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    left: `${50 + rx * Math.cos(rad)}%`,
    top: `${50 + ry * Math.sin(rad)}%`,
  }
}

const RED_SUITS = new Set(["♥", "♦"])

// Helper to convert backend seat data to UI Player type
const transformSeatsToPlayers = (backendSeats: any[], seatNames: string[] | null, heroSeat: number | null): Player[] => {
  return backendSeats.map((s, i) => {
    if (!s) return { id: i, name: "— Open —", chips: 0, cards: [], bet: 0, status: "empty", isDealer: false, isHero: false }
    
    return {
      id: i,
      name: seatNames ? (seatNames[i] || `Siège ${i}`) : `Siège ${i}`,
      chips: s.stack,
      cards: [], 
      bet: s.betSize,
      status: "active",
      isDealer: false,
      isHero: i === heroSeat,
    }
  })
}

// ... (ChairSVG, CardFace, CardBack - truncated for brevity in this output, but I will include them)

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
          <rect x="63" y="168" width="10" height="44" rx="3" fill={`url(#${lw})`} />
          <rect x="147" y="168" width="10" height="44" rx="3" fill={`url(#${lw})`} />
          <rect x="64" y="186" width="8" height="3" rx="1" fill="#3d2010" />
          <rect x="148" y="186" width="8" height="3" rx="1" fill="#3d2010" />
          <path d="M 48 54 Q 48 36 60 32 L 160 32 Q 172 36 172 54 L 172 158 Q 172 168 160 171 L 60 171 Q 48 168 48 158 Z" fill={`url(#${b})`} />
          <path d="M 50 54 Q 50 38 61 34 L 159 34 Q 170 38 170 54 L 170 159 Q 170 166 159 169 L 61 169 Q 50 166 50 159 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
          <path d="M 60 40 Q 74 33 100 37 L 112 41 Q 86 45 70 57 Z" fill="rgba(255,255,255,0.06)" />
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
          <path d="M 48 54 Q 48 36 60 32 L 160 32 Q 172 36 172 54 L 172 65 Q 110 71 48 65 Z" fill="#1b1b1b" />
          <path d="M 52 52 Q 52 38 63 35 L 157 35 Q 168 38 168 52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.9" />
          <path d="M 16 96 Q 14 89 18 85 L 51 85 Q 54 89 54 97 L 54 161 Q 54 170 46 172 L 21 172 Q 13 168 13 160 L 13 104 Q 13 99 16 96 Z" fill={`url(#${al})`} />
          <path d="M 13 102 Q 13 97 17 94 L 21 92 Q 18 97 18 103 L 18 160 Q 18 167 23 170 L 13 160 Z" fill="rgba(0,0,0,0.28)" />
          <ellipse cx="33" cy="87" rx="19" ry="6.5" fill="#1d1d1d" />
          <ellipse cx="33" cy="85" rx="19" ry="6" fill="#252525" />
          <ellipse cx="29" cy="83.5" rx="10" ry="2.5" fill="rgba(255,255,255,0.065)" />
          <path d="M 13 158 Q 13 168 21 172 L 46 172 Q 54 170 54 161 L 54 168 Q 54 176 45 178 L 19 178 Q 11 175 11 165 Z" fill="#0e0e0e" />
          <path d="M 204 96 Q 206 89 202 85 L 169 85 Q 166 89 166 97 L 166 161 Q 166 170 174 172 L 199 172 Q 207 168 207 160 L 207 104 Q 207 99 204 96 Z" fill={`url(#${ar})`} />
          <path d="M 207 102 Q 207 97 203 94 L 199 92 Q 202 97 202 103 L 202 160 Q 202 167 197 170 L 207 160 Z" fill="rgba(255,255,255,0.02)" />
          <ellipse cx="187" cy="87" rx="19" ry="6.5" fill="#1d1d1d" />
          <ellipse cx="187" cy="85" rx="19" ry="6" fill="#252525" />
          <ellipse cx="191" cy="83.5" rx="10" ry="2.5" fill="rgba(255,255,255,0.06)" />
          <path d="M 207 158 Q 207 168 199 172 L 174 172 Q 166 170 166 161 L 166 168 Q 166 176 175 178 L 201 178 Q 209 175 209 165 Z" fill="#0e0e0e" />
          <path d="M 15 154 Q 14 147 24 144 L 196 144 Q 206 147 205 154 L 205 169 Q 205 177 195 179 L 25 179 Q 15 177 15 169 Z" fill={`url(#${s})`} />
          <path d="M 28 147 Q 56 142 102 144 L 120 146 Q 73 149 44 159 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M 18 153 Q 18 147 27 145 L 193 145 Q 202 147 202 153" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.1" />
          <path d="M 15 169 Q 15 177 25 179 L 195 179 Q 205 177 205 169 L 205 173 Q 205 183 193 185 L 27 185 Q 15 183 15 173 Z" fill="#0c0c0c" />
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
    const w = small ? "w-14 h-20" : "w-14 h-20"
    return (
      <div className={`card-face relative ${w} rounded-md flex flex-col justify-between p-1 select-none`}>
        <span style={{ color, fontSize: "0.95rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1 }}>{card.rank}</span>
        <span style={{ color, fontSize: "1.1rem", lineHeight: 1, textAlign: "center" }}>{card.suit}</span>
        <span style={{ color, fontSize: "0.95rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1, transform: "rotate(180deg)" }}>{card.rank}</span>
      </div>
    )
  }
  
  function CardBack({ small = false }: { small?: boolean }) {
    const w = small ? "w-14 h-20" : "w-14 h-20"
    return <div className={`card-back relative ${w} rounded-md`} />
  }
  
  function PlayerSlot({ player, angle }: { player: Player; angle: number }) {
    const chairPos = posAt(angle, RX_CHAIR, RY_CHAIR)
    const infoPos = posAt(angle, RX_INFO, RY_INFO)
    const chairRotation = angle - 270
    const isFolded = player.status === "folded"
    const isEmpty = player.status === "empty"
    const isHero = player.isHero
    return (
      <>
        <div
          className="absolute pointer-events-none select-none flex flex-col items-center"
          style={{
            left: chairPos.left,
            top: chairPos.top,
            transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`,
            zIndex: isEmpty ? 4 : 7,
            filter: `drop-shadow(0 8px 20px rgba(0,0,0,0.8)) ${isFolded ? "brightness(0.55) saturate(0.4)" : isEmpty ? "brightness(0.4)" : "brightness(1)"}`,
            opacity: isFolded ? 0.7 : isEmpty ? 0.45 : 1,
            transition: "filter 0.3s, opacity 0.3s",
          >
            <ChairSVG uid={`p${player.id}`} size={82} />
            {/* Seat number display */}
            <div className="text-white font-bold text-xs mt-1" style={{ textShadow: "0 0 4px #000" }}>{player.id}</div>
          </div>

          {/* Cards — aligned on table */}
          {!isEmpty && (
            <div
              className={`absolute flex flex-col items-center gap-0.5 ${isFolded ? "opacity-20" : ""}`}
              style={{
                left: infoPos.left,
                top: infoPos.top,
                transform: `translate(-50%, -50%) rotate(${angle - 270}deg)`,
                zIndex: 10,
              }}
            >
              <div className="text-white text-xs font-bold bg-black/50 px-2 py-0.5 rounded">{player.name}</div>
              <div className="flex gap-0.5">
                {isHero
                  ? player.cards.map((c, i) => <CardFace key={i} card={c} small />)
                  : <><CardBack small /><CardBack small /></>
                }
              </div>
            </div>
          )}
          </>
          )
          }
export default function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [heroSeat, setHeroSeat] = useState<number | null>(null)
  const [pot, setPot] = useState(0)
  const [communityCards, setCommunityCards] = useState<Card[]>([])
  const [heroAction, setHeroAction] = useState<string | null>(null)

  const socket = useMemo(() => io("http://localhost:3000"), [])

  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server"))
    
    const userString = localStorage.getItem('afripoks.user');
    const user = userString ? JSON.parse(userString) : { name: 'Player' };
    const preferredSeat = user.name === 'Ricco' ? 4 : 0;
    socket.emit("sitDown", { playerName: user.name, preferredSeat });

    socket.on("seatAssigned", (seat) => {
        setHeroSeat(seat)
    })

    socket.on("tableUpdate", (data) => {
      // Update everything based on the incoming socket data directly
      setPlayers(transformSeatsToPlayers(data.seats, data.seatNames, heroSeat))
      setPot(data.pots[0]?.size || 0)
      setCommunityCards(data.communityCards)
    })

    return () => {
      socket.off("connect")
      socket.off("seatAssigned")
      socket.off("tableUpdate")
    }
  }, [socket, heroSeat]) // Keep heroSeat to trigger re-transform when it changes

  return (
    <div className="room-bg w-full h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute pointer-events-none" style={{ width: "65vw", height: "45vw", background: "radial-gradient(ellipse, rgba(35,95,55,0.16) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", filter: "blur(50px)" }} />

      <div className="relative" style={{ width: "min(90vw, 1100px)", height: "min(60vh, 500px)" }}>
        <div className="table-rail absolute rounded-[50%]" style={{ inset: "2%", border: "2px solid rgba(201,168,76,0.15)" }} />
        {SEAT_ANGLES.map((angle, i) => {
          const nextAngle = SEAT_ANGLES[(i + 1) % SEAT_ANGLES.length]
          const midAngle = (angle + nextAngle) / 2 + (nextAngle < angle ? 180 : 0)
          const pos = posAt(midAngle, 50, 36) 
          return <div key={i} className="absolute w-5 h-5 rounded-full bg-amber-500 blur-[3px] pointer-events-none animate-pulse" style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)", boxShadow: "0 0 15px 5px rgba(251, 191, 36, 0.8)" }} />
        })}

        <div className="table-felt absolute rounded-[50%]" style={{ inset: "6%" }}>
          <div className="absolute rounded-[50%] pointer-events-none" style={{ inset: "-2%", border: "1px solid rgba(201,168,76,0.1)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              {communityCards.map((card, i) => <CardFace key={i} card={card} />)}
            </div>
            <div className="flex items-center mt-1">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "#e8c97a", letterSpacing: "0.08em" }}>
                POT: ${pot.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-row items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-amber-700 rounded-full flex items-center justify-center font-bold text-white text-lg border-2 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.5)]">A</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#fcd34d", letterSpacing: "0.2em", textShadow: "0 0 10px rgba(252, 211, 77, 0.5)" }}>Afripoks</div>
            </div>
          </div>
        </div>
        {players.map((player, i) => {
          // Calculate visual index to rotate the table so heroSeat is at bottom (index 0 / 270deg)
          const visualIndex = heroSeat !== null ? (i - heroSeat + 9) % 9 : i
          return <PlayerSlot key={player.id} player={player} angle={SEAT_ANGLES[visualIndex]} />
        })}
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ zIndex: 20 }}>
        {heroAction ? (
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#c9a84c", letterSpacing: "0.15em", background: "rgba(0,0,0,0.75)", padding: "0.45rem 1.4rem", borderRadius: "0.5rem", border: "1px solid rgba(201,168,76,0.28)" }}>
            {heroAction}
          </div>
        ) : (
          [
            { label: "FOLD",     bg: "rgba(75,18,18,0.88)", border: "rgba(200,50,50,0.5)" },
            { label: "CHECK",    bg: "rgba(18,48,28,0.88)", border: "rgba(50,175,80,0.5)" },
            { label: "CALL",     bg: "rgba(18,38,68,0.88)", border: "rgba(60,130,220,0.5)" },
            { label: "RAISE",    bg: "rgba(58,38,10,0.88)", border: "rgba(201,168,76,0.55)" },
          ].map(({ label, bg, border }) => (
            <button
              key={label}
              onClick={() => {
                  setHeroAction(label)
                  socket.emit("playerAction", label.toLowerCase())
              }}
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
