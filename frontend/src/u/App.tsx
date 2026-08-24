import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../index2.css"

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
const RX_INFO = 40
const RY_INFO = 42
const RX_CHAIR = 48
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

function ChairSVG({ uid, size = 80 }: { uid: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`leatherGradient${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5d4037" />
          <stop offset="100%" stopColor="#2e1a16" />
        </linearGradient>
      </defs>
      <path d="M 15 35 A 35 35 0 0 1 85 35 L 80 35 A 30 30 0 0 0 20 35 Z" fill={`url(#leatherGradient${uid})`} stroke="#3e2723" strokeWidth="2" />
      <rect x="25" y="40" width="50" height="40" rx="8" fill={`url(#leatherGradient${uid})`} stroke="#3e2723" strokeWidth="2" />
      <rect x="30" y="45" width="40" height="30" rx="4" fill="rgba(255,255,255,0.05)" />
      <rect x="15" y="40" width="12" height="45" rx="5" fill="#1c0e05" stroke="#3e2723" strokeWidth="2" />
      <rect x="73" y="40" width="12" height="45" rx="5" fill="#1c0e05" stroke="#3e2723" strokeWidth="2" />
    </svg>
  )
}

function CardFace({ card, small = false }: { card: Card; small?: boolean }) {
  const isRed = RED_SUITS.has(card.suit)
  const color = isRed ? "#c0212c" : "#1a1a1a"
  const w = small ? "w-10 h-14" : "w-16 h-22"
  return (
    <div className={`card-face relative ${w} rounded-sm flex flex-col justify-between p-1 select-none`}>
      <span style={{ color, fontSize: small ? "0.7rem" : "1rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1 }}>{card.rank}</span>
      <span style={{ color, fontSize: small ? "0.85rem" : "1.2rem", lineHeight: 1, textAlign: "center" }}>{card.suit}</span>
      <span style={{ color, fontSize: small ? "0.7rem" : "1rem", fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1, transform: "rotate(180deg)" }}>{card.rank}</span>
    </div>
  )
}

function CardBack({ small = false }: { small?: boolean }) {
  const w = small ? "w-10 h-14" : "w-16 h-22"
  return <div className={`card-back relative ${w} rounded-sm`} />
}

function PlayerSlot({ player, angle }: { player: Player; angle: number }) {
  const chairPos = posAt(angle, RX_CHAIR, RY_CHAIR)
  const cardPos = posAt(angle, 43, 45)
  const chairRotation = angle - 270

  const isFolded = player.status === "folded"

  return (
    <>
      {/* Chair */}
      <div className="absolute pointer-events-none select-none" style={{ left: chairPos.left, top: chairPos.top, transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`, zIndex: 7 }}>
        <ChairSVG uid={`p${player.id}`} size={130} />
      </div>

      {/* Cards — pushed inward to overlap with the table edge */}
      {player.status !== "empty" && (
        <div className="absolute" style={{ left: cardPos.left, top: cardPos.top, transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`, zIndex: 9 }}>
          <div className={`flex gap-1 ${isFolded ? "opacity-20" : ""}`}>
            {player.isHero ? player.cards.map((c, i) => <CardFace key={i} card={c} small />) : <><CardBack small /><CardBack small /></>}
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [players] = useState<Player[]>(INITIAL_PLAYERS)
  const [pot] = useState(4800)
  const [heroAction, setHeroAction] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name?: string; pseudo?: string; solde?: number; chips?: number } | null>(null)

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ id: number; user: string; text: string; time: string; isSelf: boolean }>>([
    { id: 1, user: "Viktor K.", text: "Bonne chance à tous !", time: "17:20", isSelf: false },
    { id: 2, user: "Damien R.", text: "Bien joué la dernière main 👏", time: "17:22", isSelf: false },
  ])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("afripoks.user")
      if (stored) {
        setCurrentUser(JSON.parse(stored))
      }
    } catch (e) {}
  }, [])

  const playerName = currentUser?.name || currentUser?.pseudo || "Vous"
  const playerChips = currentUser?.solde !== undefined ? currentUser.solde : (currentUser?.chips ?? 4200)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    const newMsg = {
      id: Date.now(),
      user: playerName,
      text: inputMessage.trim(),
      time: timeStr,
      isSelf: true,
    }

    setChatMessages((prev) => [...prev, newMsg])
    setInputMessage("")
  }

  return (
    <div className="room-bg w-full h-screen flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <header
        className="w-full flex items-center justify-between px-8 py-3.5 z-30"
        style={{
          background: "linear-gradient(180deg, rgba(30, 3, 7, 0.98) 0%, rgba(20, 2, 4, 0.88) 100%)",
          borderBottom: "1.5px solid rgba(217, 174, 75, 0.4)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-md"
            style={{
              background: "linear-gradient(135deg, rgba(165, 18, 26, 0.6), rgba(110, 10, 17, 0.7))",
              border: "1.5px solid rgba(245, 218, 146, 0.4)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(165, 18, 26, 0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px) scale(1.03)"
              e.currentTarget.style.borderColor = "#f5da92"
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(192, 22, 30, 0.85), rgba(130, 12, 20, 0.9))"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.borderColor = "rgba(245, 218, 146, 0.4)"
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(165, 18, 26, 0.6), rgba(110, 10, 17, 0.7))"
            }}
          >
            <span className="text-base">🚪</span>
            <span className="tracking-wide uppercase" style={{ fontFamily: "var(--font-display)" }}>Quitter</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-widest text-amber-200 uppercase drop-shadow-md" style={{ fontFamily: "var(--font-display)" }}>
              Table #1
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-400/20 text-amber-300">
              NL Texas Hold'em
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-extrabold shadow-sm"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
            }}
          >
            <span className="text-base">👤</span>
            <span className="tracking-wide">{playerName}</span>
          </div>
        </div>
      </header>

      {/* Main Table Area */}
      <div className="flex-1 flex items-center justify-center relative w-full">
        <div className="relative" style={{ width: "min(88vw, 1080px)", height: "min(78vh, 660px)", zIndex: 1 }}>
          <div className="table-rail absolute rounded-[50%]" style={{ inset: "6%", border: "2px solid rgba(201,168,76,0.15)" }}>
            {players.map((_, i) => {
              const angle = SEAT_ANGLES[i] + 20
              const torchPos = posAt(angle, 48, 48)
              return (
                <div key={`elements-${i}`}>
                  <div className="absolute w-4 h-4 bg-yellow-400 rounded-full" style={{ left: torchPos.left, top: torchPos.top, transform: "translate(-50%, -50%)", boxShadow: "0 0 15px #facc15, 0 0 5px #eab308", zIndex: 20 }} />
                </div>
              )
            })}
          </div>
          <div className="table-felt absolute rounded-[50%]" style={{ inset: "10%" }}>
            <div className="absolute rounded-[50%] pointer-events-none" style={{ inset: "-2%", border: "1px solid rgba(201,168,76,0.1)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">{COMMUNITY.map((card, i) => <CardFace key={i} card={card} />)}</div>
              <div className="flex items-center gap-2 mt-1"><span style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "#e8c97a", letterSpacing: "0.08em" }}>POT: {pot.toLocaleString()}</span></div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: "bold", color: "#f5d061", letterSpacing: "0.2em", marginTop: "0.5rem" }}>[LOGO] Afripoks</div>
            </div>
          </div>
          {players.map((player, i) => <PlayerSlot key={player.id} player={player} angle={SEAT_ANGLES[i]} />)}
        </div>

        {/* Hero action buttons — Centered at bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ zIndex: 40 }}>
          {heroAction ? (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", color: "#c9a84c", letterSpacing: "0.15em", background: "rgba(0,0,0,0.75)", padding: "0.45rem 1.4rem", borderRadius: "0.5rem", border: "1px solid rgba(201,168,76,0.28)" }}>{heroAction}</div>
          ) : (
            [{ label: "FOLD", bg: "rgba(75,18,18,0.88)", border: "rgba(200,50,50,0.5)" }, { label: "CHECK", bg: "rgba(18,48,28,0.88)", border: "rgba(50,175,80,0.5)" }, { label: "CALL $400", bg: "rgba(18,38,68,0.88)", border: "rgba(60,130,220,0.5)" }, { label: "RAISE", bg: "rgba(58,38,10,0.88)", border: "rgba(201,168,76,0.55)" }].map(({ label, bg, border }) => (
              <button key={label} onClick={() => setHeroAction(label.split(" ")[0])} className="action-btn px-5 py-2 rounded-lg text-xs" style={{ background: bg, border: `1px solid ${border}`, color: "#f5f0e8", fontFamily: "var(--font-display)", letterSpacing: "0.1em", cursor: "pointer", backdropFilter: "blur(8px)" }}>{label}</button>
            ))
          )}
        </div>

        {/* Chat Button & Window — Pulled to the Bottom Right */}
        <div className="absolute bottom-6 right-6" style={{ zIndex: 45 }}>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="action-btn px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-all duration-200"
            style={{
              background: isChatOpen
                ? "linear-gradient(145deg, #a5121a, #6e0a11)"
                : "linear-gradient(145deg, #381216, #1c0508)",
              border: `1.5px solid ${isChatOpen ? "#f5da92" : "#d9ae4b"}`,
              boxShadow: isChatOpen
                ? "0 0 15px rgba(245, 218, 146, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)"
                : "0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(245, 218, 146, 0.2)",
              color: "#f5da92",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px) scale(1.03)"
              e.currentTarget.style.borderColor = "#f5da92"
              e.currentTarget.style.boxShadow = "0 0 18px rgba(245, 218, 146, 0.5), 0 4px 12px rgba(0, 0, 0, 0.7)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.borderColor = isChatOpen ? "#f5da92" : "#d9ae4b"
              e.currentTarget.style.boxShadow = isChatOpen
                ? "0 0 15px rgba(245, 218, 146, 0.4), 0 4px 12px rgba(0, 0, 0, 0.7)"
                : "0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(245, 218, 146, 0.2)"
            }}
            title="Ouvrir le chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f5da92"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
            <span className="text-xs font-black tracking-wider uppercase" style={{ fontFamily: "var(--font-display)" }}>
              Chat
            </span>
            {chatMessages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
            )}
          </button>

          {/* Chat Window popup above button */}
          {isChatOpen && (
            <div
              className="absolute bottom-12 right-0 w-80 h-96 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-50 animate-fade-in"
              style={{
                background: "linear-gradient(170deg, rgba(30, 4, 8, 0.96), rgba(16, 2, 4, 0.98))",
                border: "1.5px solid rgba(217, 174, 75, 0.5)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(245, 218, 146, 0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  background: "linear-gradient(180deg, rgba(165, 18, 26, 0.4), rgba(75, 8, 12, 0.2))",
                  borderBottom: "1px solid rgba(217, 174, 75, 0.25)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-black tracking-wider text-amber-200 uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    Discussion de table
                  </span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Messages list */}
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5 text-xs">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className="font-bold text-[10.5px]" style={{ color: msg.isSelf ? "#f5da92" : "#d9b8a8" }}>
                        {msg.user}
                      </span>
                      <span className="text-[9px] text-gray-500">{msg.time}</span>
                    </div>
                    <div
                      className="px-3 py-2 rounded-xl max-w-[85%] break-words leading-relaxed text-white"
                      style={{
                        background: msg.isSelf
                          ? "linear-gradient(135deg, #a5121a, #6e0a11)"
                          : "rgba(255, 255, 255, 0.08)",
                        border: msg.isSelf
                          ? "1px solid rgba(217, 174, 75, 0.4)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input box */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 flex items-center gap-2"
                style={{
                  borderTop: "1px solid rgba(217, 174, 75, 0.2)",
                  background: "rgba(10, 1, 3, 0.7)",
                }}
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-amber-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-all cursor-pointer"
                  style={{
                    background: "linear-gradient(170deg, #F0D28A, #C79A2E)",
                    border: "1px solid #8A6416",
                  }}
                >
                  Envoyer
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

