// Polyfill global crypto.randomInt and process for browser
const randomIntShimFn = function (min: number, max?: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  const range = max - min;
  if (range <= 0) return min;
  const arr = new Uint32Array(1);
  ((globalThis as any).crypto || (window as any).crypto).getRandomValues(arr);
  return min + (arr[0] % range);
};

if (typeof (globalThis as any).crypto !== "undefined") {
  try {
    Object.defineProperty((globalThis as any).crypto, "randomInt", {
      value: randomIntShimFn,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    (globalThis as any).crypto.randomInt = randomIntShimFn;
  }
}
if (typeof (window as any).crypto !== "undefined") {
  try {
    Object.defineProperty((window as any).crypto, "randomInt", {
      value: randomIntShimFn,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    (window as any).crypto.randomInt = randomIntShimFn;
  }
}
(globalThis as any).randomInt = randomIntShimFn;
(window as any).randomInt = randomIntShimFn;

if (typeof (window as any).process === "undefined") {
  (window as any).process = { env: {} };
}
if (typeof (globalThis as any).process === "undefined") {
  (globalThis as any).process = { env: {} };
}

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { io, Socket } from "socket.io-client"
import "../index2.css"

// ... (keep the rest of the file)


// Backend handles table logic now
const PokerTableClass = null;

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
  isTurn?: boolean
  lastAction?: string | null
  showCards?: boolean
  isWinner?: boolean
  isLoser?: boolean
  role?: string
}

// Angles pour 9 joueurs : siège 0 (Hero / Connecté) en bas au centre (90°)
// Ordre HORAIRE : bas → bas-droite → droite → haut-droite → haut → haut-gauche → gauche → bas-gauche
const SEAT_ANGLES = [90, 50, 10, 330, 290, 250, 210, 170, 130]
const INITIAL_NAMES = ["You", "Viktor K.", "Marina S.", "Damien R.", "Chen Wei", "Sofia M.", "James T.", "Kaito N.", "Lucas B."]
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
const SUIT_MAP: Record<string, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
}

const INITIAL_PLAYERS: Player[] = [
  { id: 0, name: "You", chips: 4200, cards: [{ rank: "A", suit: "♥" }, { rank: "K", suit: "♦" }], bet: 0, status: "active", isDealer: false, isHero: true },
  { id: 1, name: "Viktor K.", chips: 8750, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 2, name: "Marina S.", chips: 1200, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 3, name: "Damien R.", chips: 12400, cards: [], bet: 0, status: "active", isDealer: true, isHero: false },
  { id: 4, name: "Chen Wei", chips: 6600, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 5, name: "Sofia M.", chips: 3100, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 6, name: "James T.", chips: 9800, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 7, name: "Kaito N.", chips: 5500, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
  { id: 8, name: "Lucas B.", chips: 7300, cards: [], bet: 0, status: "active", isDealer: false, isHero: false },
]

function ThunderStrikeSVG() {
  return (
    <div className="absolute pointer-events-none z-50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 w-48 h-64 overflow-visible">
      {/* Onde de choc électrique */}
      <div
        className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/80 animate-ping"
        style={{ boxShadow: "0 0 25px #38bdf8, inset 0 0 15px #60a5fa" }}
      />
      {/* Halo lumineux de foudre */}
      <div className="absolute w-24 h-24 rounded-full bg-cyan-300/40 blur-xl animate-pulse" />
      {/* Éclair principal avec branches */}
      <svg
        viewBox="0 0 120 200"
        className="w-40 h-56 thunder-bolt-anim overflow-visible"
        style={{
          filter: "drop-shadow(0 0 14px #38bdf8) drop-shadow(0 0 28px #93c5fd) drop-shadow(0 0 45px #ffffff)",
        }}
      >
        <defs>
          <linearGradient id="thunderGrad" x1="0%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e0f2fe" />
            <stop offset="65%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        {/* Éclair principal */}
        <polygon
          points="65,0 30,85 58,85 15,195 95,80 62,80 85,0"
          fill="url(#thunderGrad)"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        {/* Branches électriques */}
        <polyline
          points="45,50 20,70 10,95"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polyline
          points="70,110 95,130 105,160"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {/* Badge percutant */}
      <div className="absolute text-cyan-200 text-[10px] font-mono font-black animate-bounce tracking-widest uppercase bg-black/85 px-2 py-0.5 rounded border border-cyan-400/70 shadow-[0_0_12px_rgba(56,189,248,0.8)] -bottom-1">
        ⚡ PERDU ⚡
      </div>
    </div>
  )
}

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
  const w = small ? "w-14 h-20" : "w-16 h-22"
  return (
    <div className={`card-face relative ${w} rounded-sm flex flex-col justify-between p-1 select-none`}>
      <span style={{ color, fontSize: small ? "1.45rem" : "1rem", fontFamily: "var(--font-display)", fontWeight: 900, lineHeight: 1, textShadow: "0 1px 1px rgba(255,255,255,.7)" }}>{card.rank}</span>
      <span style={{ color, fontSize: small ? "1.9rem" : "1.2rem", lineHeight: 1, textAlign: "center", fontWeight: 900, textShadow: "0 1px 1px rgba(255,255,255,.7)" }}>{card.suit}</span>
      <span style={{ color, fontSize: small ? "1.45rem" : "1rem", fontFamily: "var(--font-display)", fontWeight: 900, lineHeight: 1, transform: "rotate(180deg)", textShadow: "0 1px 1px rgba(255,255,255,.7)" }}>{card.rank}</span>
    </div>
  )
}

function CardBack({ small = false }: { small?: boolean }) {
  const w = small ? "w-14 h-20" : "w-16 h-22"
  return <div className={`card-back relative ${w} rounded-sm`} />
}

function PokerChipSVG({ size = 22, color = "#d97706", innerColor = "#92400e", borderColor = "#fde68a" }: { size?: number; color?: string; innerColor?: string; borderColor?: string }) {
  const cleanColor = color.replace('#', '')
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
      <defs>
        <radialGradient id={`chipGrad-${cleanColor}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={innerColor} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#chipGrad-${cleanColor})`} stroke={borderColor} strokeWidth="4" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" strokeWidth="5" strokeDasharray="12 14" opacity="0.85" />
      <circle cx="50" cy="50" r="27" fill="rgba(0,0,0,0.4)" stroke={borderColor} strokeWidth="2" />
      <circle cx="50" cy="50" r="16" fill={color} stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
      <circle cx="50" cy="50" r="7" fill="#ffffff" opacity="0.45" />
    </svg>
  )
}

function ChipStackDisplay({ amount, isRaise = false }: { amount: number; isRaise?: boolean }) {
  if (!amount || amount <= 0) return null
  const isHigh = amount >= 500
  const isMed = amount >= 100

  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full pointer-events-none select-none chip-pop-anim"
      style={{
        background: "linear-gradient(135deg, rgba(25, 4, 8, 0.95), rgba(8, 1, 3, 0.98))",
        border: `1.5px solid ${isRaise ? "#f59e0b" : "rgba(245, 218, 146, 0.7)"}`,
        boxShadow: isRaise
          ? "0 0 16px rgba(245, 158, 11, 0.65), 0 4px 10px rgba(0,0,0,0.9)"
          : "0 0 10px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.7)",
      }}
    >
      <div className="relative flex items-center -space-x-3">
        {isHigh ? (
          <>
            <PokerChipSVG size={22} color="#dc2626" innerColor="#7f1d1d" borderColor="#fca5a5" />
            <PokerChipSVG size={22} color="#d97706" innerColor="#92400e" borderColor="#fde68a" />
            <PokerChipSVG size={22} color="#eab308" innerColor="#a16207" borderColor="#fef08a" />
          </>
        ) : isMed ? (
          <>
            <PokerChipSVG size={22} color="#2563eb" innerColor="#1e3a8a" borderColor="#93c5fd" />
            <PokerChipSVG size={22} color="#d97706" innerColor="#92400e" borderColor="#fde68a" />
          </>
        ) : (
          <PokerChipSVG size={22} color="#d97706" innerColor="#92400e" borderColor="#fde68a" />
        )}
      </div>
      <span
        className="font-mono font-black text-xs tracking-wide ml-0.5"
        style={{
          color: isRaise ? "#fde047" : "#f5da92",
          textShadow: "0 1px 3px rgba(0,0,0,0.95)",
        }}
      >
        {amount.toLocaleString()} ₣
      </span>
    </div>
  )
}

function getActionStyle(action: string) {
  const act = action.toUpperCase()
  if (act.includes("FOLD")) return { bg: "linear-gradient(135deg, #781d1d, #420d0d)", border: "#ef4444", text: "#ffc9c9" }
  if (act.includes("CHECK")) return { bg: "linear-gradient(135deg, #19542a, #0d2e16)", border: "#22c55e", text: "#bbf7d0" }
  if (act.includes("CALL")) return { bg: "linear-gradient(135deg, #1d4076, #0d203e)", border: "#3b82f6", text: "#bfdbfe" }
  if (act.includes("RAISE") || act.includes("BET")) return { bg: "linear-gradient(135deg, #a16207, #5c3504)", border: "#eab308", text: "#fef08a" }
  if (act.includes("ALL IN") || act.includes("ALLIN")) return { bg: "linear-gradient(135deg, #831843, #4c0519)", border: "#ec4899", text: "#fbcfe8" }
  return { bg: "rgba(20,2,4,0.9)", border: "rgba(245,208,97,0.7)", text: "#f5d061" }
}

function PlayerSlot({
  player,
  angle,
  dealtSeats,
  turnProgress = 0,
  onSitDown,
  currentUser,
}: {
  player: Player
  angle: number
  dealtSeats: Set<number> | null
  turnProgress?: number
  onSitDown?: (seatId: number) => void
  currentUser: any
}) {
  const chairPos   = posAt(angle, RX_CHAIR, RY_CHAIR)
  // Cartes légèrement avancées vers le tapis, tout en suivant la chaise.
  const cardPos = posAt(angle, 42, 44)
  // Jetons de mise / raise au-dessus des cartes (vers l'intérieur du tapis)
  const betChipsPos = posAt(angle, 29, 31)
  // Pseudo + cave placés derrière le dossier, à l'extérieur de la table.
  const nameTagPos = posAt(angle, 57, 59)
  const actionBubblePos = posAt(angle, 37, 39) // près des cartes
  const chairRotation = angle - 270
  // Le texte du pseudo et de la cave reste lisible, horizontal.
  const nameTagRotation = 0
  const isFolded = player.status === "folded"
  const showCards = dealtSeats === null || dealtSeats.has(player.id)

  const isRaiseOrBet = Boolean(
    player.lastAction && (player.lastAction.includes("RAISE") || player.lastAction.includes("BET") || player.lastAction.includes("ALL"))
  )
  const displayBetAmount = player.bet > 0
    ? player.bet
    : (player.lastAction ? (parseInt(player.lastAction.replace(/[^0-9]/g, ''), 10) || 0) : 0)

  return (
    <>
      {/* ── Anneau pulsant derrière la chaise quand c'est son tour ─────── */}
      {player.isTurn && (
        <div
          className="absolute pointer-events-none turn-pulse-ring"
          style={{
            left: chairPos.left,
            top: chairPos.top,
            width: 112,
            height: 112,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            zIndex: 5,
          }}
        />
      )}

      {/* ── Effet Tonnerre sur le joueur perdant ───────────────────────── */}
      {player.isLoser && (
        <div
          className="absolute pointer-events-none"
          style={{ left: chairPos.left, top: chairPos.top, zIndex: 60 }}
        >
          <ThunderStrikeSVG />
        </div>
      )}

      {/* ── Chaise ─────────────────────────────────────────────────────── */}
      <div
        className={`absolute pointer-events-none select-none ${player.isLoser ? "thunder-shake-anim" : ""}`}
        style={{ left: chairPos.left, top: chairPos.top, transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`, zIndex: 7 }}
      >
        {player.isWinner && (
          <div className="absolute w-[120px] h-[120px] rounded-full border-4 border-yellow-400 animate-ping z-10" style={{ boxShadow: "0 0 20px #fbbf24" }}></div>
        )}
        <ChairSVG uid={`p${player.id}`} size={130} />
      </div>

      {/* ── Siège Vide : Bouton pour s'asseoir ──────────────────────────── */}
      {player.status === "empty" && onSitDown && (
        <div
          className="absolute"
          style={{ left: nameTagPos.left, top: nameTagPos.top, transform: "translate(-50%, -50%)", zIndex: 25 }}
        >
          <button
            onClick={() => onSitDown(player.id)}
            className="px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer shadow-md transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(201, 168, 76, 0.25), rgba(110, 10, 17, 0.4))",
              border: "1px dashed rgba(245, 218, 146, 0.6)",
              color: "#f5da92",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.05em",
            }}
          >
            + S'ASSEOIR
          </button>
        </div>
      )}

      {/* ── Badge de la dernière action (CHECK, CALL, FOLD, RAISE...) ───── */}
      {player.lastAction && (
        <div
          className="absolute pointer-events-none select-none action-popup-anim"
          style={{
            left: actionBubblePos.left,
            top: actionBubblePos.top,
            transform: "translate(-50%, -50%)",
            zIndex: 35,
          }}
        >
          {(() => {
            const style = getActionStyle(player.lastAction)
            return (
              <div
                style={{
                  background: style.bg,
                  border: `1.5px solid ${style.border}`,
                  color: style.text,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.6), 0 0 10px ${style.border}66`,
                  borderRadius: "6px",
                  padding: "3px 9px",
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {player.lastAction}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Étiquette : nom, jetons, barre de décompte, statut ──────────── */}
      {player.status !== "empty" && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: nameTagPos.left,
            top: nameTagPos.top,
            transform: `translate(-50%, -50%) rotate(${nameTagRotation}deg)`,
            transformOrigin: "center",
            zIndex: 13,
            textAlign: "center",
            minWidth: 76,
          }}
        >
          {/* Badge principal */}
          <div style={{
            background: player.isTurn
              ? "linear-gradient(135deg, rgba(35, 10, 5, 0.95), rgba(20, 2, 4, 0.95))"
              : isFolded ? "rgba(20, 10, 10, 0.55)" : "rgba(8, 2, 2, 0.85)",
            border: `1.5px solid ${player.isTurn ? "rgba(245,208,97,.9)" : (player.isHero ? "rgba(100,190,255,.45)" : "rgba(255,255,255,.12)")}`,
            borderRadius: 6,
            padding: "3px 8px",
            whiteSpace: "nowrap",
            boxShadow: player.isTurn ? "0 0 16px rgba(245,208,97,.6), inset 0 0 8px rgba(245,208,97,.15)" : "0 2px 6px rgba(0,0,0,0.5)",
            transition: "all .25s ease",
            overflow: "visible",
            position: "relative",
          }}>
            <div className="font-bold text-white text-[11px]">{player.name} {player.role ? `(${player.role})` : ""}</div>
            <div className="text-[10px] text-yellow-300">Chips: {player.chips}</div>
            {player.bet > 0 && <div className="text-[10px] text-red-300">Bet: {player.bet}</div>}
            {player.role && (
              <span style={{
                position: "absolute",
                top: -15,
                left: "50%",
                transform: "translateX(-50%)",
                background: player.role?.includes("BB") ? "#7c3aed" : player.role?.includes("SB") ? "#2563eb" : "#f59e0b",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.8)",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: ".58rem",
                fontWeight: 900,
                letterSpacing: ".08em",
                boxShadow: "0 2px 7px rgba(0,0,0,.7)",
                whiteSpace: "nowrap",
              }}>
                {player.role}
              </span>
            )}
            <div style={{
              color: player.isTurn ? "#fde047" : (player.isHero ? "#93c5fd" : (isFolded ? "#78716c" : "#d6d3d1")),
              fontSize: "0.62rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              letterSpacing: ".02em",
            }}>
              {player.isHero ? (currentUser?.name || currentUser?.pseudo || "Vous") : player.name}
            </div>
            <div style={{
              color: player.isTurn ? "#facc15" : (isFolded ? "#57534e" : "#ca8a04"),
              fontSize: ".54rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}>
              {isFolded ? "COUCHÉ" : `${player.chips.toLocaleString()} ₣`}
            </div>

            {/* ── Progress Bar Décompte du Tour ─────────────────────────────── */}
            {player.isTurn && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "3px",
                  width: `${Math.max(0, Math.min(100, turnProgress))}%`,
                  background: turnProgress > 50 
                    ? "linear-gradient(90deg, #22c55e, #eab308)" 
                    : turnProgress > 25 
                      ? "linear-gradient(90deg, #eab308, #f97316)" 
                      : "linear-gradient(90deg, #f97316, #ef4444)",
                  boxShadow: "0 0 6px rgba(250, 204, 21, 0.8)",
                  transition: "width 0.1s linear",
                }}
              />
            )}
          </div>

          {/* Badge statut "▶ JOUE" / "▶ À VOUS" / ou Action */}
          {player.isTurn && (
            <div style={{
              marginTop: 3,
              display: "inline-block",
              background: player.isHero
                ? "linear-gradient(90deg, #eab308, #ca8a04)"
                : "rgba(245, 208, 97, 0.15)",
              border: "1px solid rgba(245, 208, 97, 0.8)",
              borderRadius: 4,
              padding: "1px 6px",
              color: player.isHero ? "#000000" : "#fef08a",
              fontSize: ".52rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              letterSpacing: ".08em",
              boxShadow: "0 0 8px rgba(234, 179, 8, 0.4)",
            }}>
              {player.isHero ? "▶ À VOUS" : "▶ RÉFLÉCHIT..."}
            </div>
          )}
        </div>
      )}

      {/* ── Cartes ─────────────────────────────────────────────────────── */}
      {player.status !== "empty" && showCards && (
        <div
          className="absolute card-deal-anim"
          style={{
            left: cardPos.left,
            top: cardPos.top,
            // La même variable est utilisée par l'animation CSS, afin qu'elle
            // ne remplace jamais la rotation de la chaise.
            "--chair-rot": `${chairRotation}deg`,
            transform: `translate(-50%, -50%) rotate(${chairRotation}deg)`,
            zIndex: 9,
          } as React.CSSProperties}
        >
          <div className={`flex -space-x-5 ${isFolded ? "opacity-20 grayscale" : ""}`}>
            {player.isHero || player.showCards ? (
              player.cards.map((c, i) => <CardFace key={i} card={c} small />)
            ) : isFolded ? null : (
              <><CardBack small /><CardBack small /></>
            )}
          </div>
        </div>
      )}

      {/* ── Jetons affichés au-dessus des cartes (Mise / Raise) ─────────── */}
      {player.status !== "empty" && !isFolded && (displayBetAmount > 0 || isRaiseOrBet) && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: betChipsPos.left,
            top: betChipsPos.top,
            transform: "translate(-50%, -50%)",
          }}
        >
          <ChipStackDisplay
            amount={displayBetAmount > 0 ? displayBetAmount : 100}
            isRaise={isRaiseOrBet}
          />
        </div>
      )}
    </>
  )
}

export default function App() {
  const navigate = useNavigate()
  const tableRef = useRef<any>(null)

  const [players, setPlayers] = useState<Player[]>(() =>
    Array.from({ length: 9 }, (_, id) => ({
      id, name: `Siège ${id + 1}`, chips: 0, cards: [], bet: 0,
      status: "empty", isDealer: false, isHero: false, isTurn: false, lastAction: null,
    }))
  )
  const [communityCards, setCommunityCards] = useState<Card[]>([])
  const [pot, setPot] = useState(0)
  const [roundName, setRoundName] = useState("Preflop")
  const [legalActions, setLegalActions] = useState<string[]>([])
  const [isHeroTurn, setIsHeroTurn] = useState(false)
  const [heroAction, setHeroAction] = useState<string | null>(null)
  const [raiseAmount, setRaiseAmount] = useState<number>(100)
  const [currentUser, setCurrentUser] = useState<{ name?: string; pseudo?: string; solde?: number; chips?: number } | null>(null)
  const [userSolde, setUserSolde] = useState<number>(10000)
  const [userCave, setUserCave] = useState<number>(2000)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ id: string | number; user: string; text: string; time: string; isSelf: boolean }>>([])

  // --- Dealing animation ---
  // null = pas d'animation (cartes visibles normalement), Set = sièges ayant déjà reçu leurs cartes
  const [dealtSeats, setDealtSeats] = useState<Set<number> | null>(null)
  const [flyingCards, setFlyingCards] = useState<Array<{ id: string; seat: number; active: boolean }>>([])

  // --- Pot to Winner animation ---
  type FlyingChip = {
    id: string
    winnerSeat: number
    active: boolean
    color: string
    innerColor: string
    borderColor: string
    offsetX: number
    offsetY: number
  }
  const [flyingChips, setFlyingChips] = useState<FlyingChip[]>([])
  const prevWinnerRef = useRef<string>("")


  const formatCard = (c: any): Card => {
    if (!c) return { rank: "A", suit: "♠" }
    return {
      rank: String(c.rank).toUpperCase(),
      suit: SUIT_MAP[c.suit] || c.suit || "♠",
    }
  }

  // Multi-joueurs synchronisé via BroadcastChannel & LocalStorage
  const [mySeat, setMySeat] = useState<number | null>(null)
  const [seatedNames, setSeatedNames] = useState<Record<number, string>>({})
  const [sharedHoleCards, setSharedHoleCards] = useState<Record<number, Card[]>>({})
  const myTabId = useRef<string>("table_1_user_" + Math.random().toString(36).substring(2, 6))
  const socketRef = useRef<Socket | null>(null)
  const mySeatRef = useRef<number | null>(null)

  // Action temporaire affichée pour chaque joueur { [seatId]: actionString }
  const [playerActions, setPlayerActions] = useState<Record<number, string>>({})
  // Pourcentage du décompte du tour en cours (100% -> 0%)
  const [turnProgress, setTurnProgress] = useState(100)

  const showPlayerAction = useCallback((seatId: number, actionText: string) => {
    setPlayerActions(prev => ({ ...prev, [seatId]: actionText.toUpperCase() }))
    setTimeout(() => {
      setPlayerActions(prev => {
        const next = { ...prev }
        delete next[seatId]
        return next
      })
    }, 2000)
  }, [])

  const syncEngine = useCallback(() => {
    const t = tableRef.current
    if (!t) return

    const holeCards = t.holeCards ? t.holeCards() : []
    const rawSeats = t.seats ? t.seats() : []
    const commCards = t.communityCards ? t.communityCards() : []
    const currentTurnSeat = t.playerToAct ? t.playerToAct() : null
    const dealerSeat = t.button ? t.button() : 0
    const pots = t.pots ? t.pots() : []
    const totalPot = pots.reduce((sum: number, p: any) => sum + (p.size || 0), 0)

    setCommunityCards(commCards.map(formatCard))
    setPot(totalPot)
    setRoundName(t.roundOfBetting ? String(t.roundOfBetting()).toUpperCase() : "EN ATTENTE")

    setPlayers(() => {
      const newPlayers: Player[] = []
      for (let i = 0; i < 9; i++) {
        const seat = rawSeats[i]
        const isHero = i === mySeat
        const myCards = sharedHoleCards[i] ? sharedHoleCards[i].map(formatCard) : (holeCards[i] ? holeCards[i].map(formatCard) : [])

        if (!seat) {
          newPlayers.push({
            id: i,
            name: `Siège ${i + 1}`,
            chips: 0,
            cards: [],
            bet: 0,
            status: "empty",
            isDealer: false,
            isHero,
            isTurn: false,
            lastAction: null,
          })
        } else {
          const playerName = isHero
            ? (currentUser?.name || currentUser?.pseudo || "Vous")
            : (seatedNames[i] || `Joueur ${i + 1}`)

          newPlayers.push({
            id: i,
            name: playerName,
            chips: seat.stack ?? userCave,
            cards: myCards,
            bet: seat.betSize ?? 0,
            status: myCards.length === 0 && !t.isHandInProgress() ? "waiting" : (seat.stack === 0 && myCards.length === 0 ? "folded" : "active"),
            isDealer: i === dealerSeat,
            isHero,
            isTurn: i === currentTurnSeat,
            lastAction: null,
          })
        }
      }
      return newPlayers
    })

    const isHeroActiveTurn = currentTurnSeat === mySeat && t.isHandInProgress()
    setIsHeroTurn(isHeroActiveTurn)

    if (isHeroActiveTurn && t.legalActions) {
      const la = t.legalActions()
      setLegalActions(la?.actions || [])
    } else {
      setLegalActions([])
    }
  }, [mySeat, currentUser, seatedNames, sharedHoleCards, setCommunityCards, setPot, setRoundName, setPlayers, setIsHeroTurn, setLegalActions, userCave])

  /** Anime la distribution des cartes dans le sens horaire */
  const animateDeal = useCallback((activeSeats: number[]) => {
    setDealtSeats(new Set<number>())

    const cards: Array<{ id: string; seat: number; active: boolean }> = []
    for (let round = 0; round < 2; round++) {
      for (const seat of activeSeats) {
        cards.push({ id: `d-${seat}-${round}`, seat, active: false })
      }
    }
    setFlyingCards(cards)

    const CARD_INTERVAL = 160
    const TRAVEL_TIME = 320

    cards.forEach((card, index) => {
      const delay = 80 + index * CARD_INTERVAL
      setTimeout(() => {
        setFlyingCards(prev => prev.map(c => c.id === card.id ? { ...c, active: true } : c))
      }, delay)
      if (card.id.endsWith("-1")) {
        setTimeout(() => {
          const { seat } = card
          setDealtSeats(prev => prev ? new Set([...prev, seat]) : new Set([seat]))
        }, delay + TRAVEL_TIME)
      }
    })

    const totalTime = 80 + cards.length * CARD_INTERVAL + 600
    setTimeout(() => {
      setFlyingCards([])
      setDealtSeats(null)
    }, totalTime)
  }, [])

  /** Anime la convergence des jetons du pot vers le siège gagnant */
  const animatePotToWinner = useCallback((winnerSeat: number) => {
    const chipThemes = [
      { color: "#dc2626", innerColor: "#7f1d1d", borderColor: "#fca5a5" },
      { color: "#d97706", innerColor: "#92400e", borderColor: "#fde68a" },
      { color: "#eab308", innerColor: "#a16207", borderColor: "#fef08a" },
      { color: "#2563eb", innerColor: "#1e3a8a", borderColor: "#93c5fd" },
      { color: "#059669", innerColor: "#064e3b", borderColor: "#a7f3d0" },
    ]

    const newChips: FlyingChip[] = Array.from({ length: 16 }, (_, i) => ({
      id: `fc-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      winnerSeat,
      active: false,
      ...chipThemes[i % chipThemes.length],
      offsetX: (Math.random() - 0.5) * 50,
      offsetY: (Math.random() - 0.5) * 35,
    }))

    setFlyingChips(newChips)

    newChips.forEach((c, index) => {
      setTimeout(() => {
        setFlyingChips(prev => prev.map(item => item.id === c.id ? { ...item, active: true } : item))
      }, 50 + index * 30)
    })

    setTimeout(() => {
      setFlyingChips([])
    }, 1400)
  }, [])

  // ── Synchronisation multi-joueurs (Socket.io) ──────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL ||
      (window.location.port === "5173" ? "http://localhost:3000" : window.location.origin)
    const socket = io(socketUrl)
    socketRef.current = socket

    let userName = "Joueur"
    let playerId: string | number | undefined
    let initialSolde = 10000

    try {
      const stored = localStorage.getItem("afripoks.user")
      if (stored) {
        const u = JSON.parse(stored)
        setCurrentUser(u)
        userName = u.name || u.pseudo || "Joueur"
        playerId = u.id || u.email || u.pseudo || u.name
        initialSolde = Number(u.solde !== undefined ? u.solde : (u.chips !== undefined ? u.chips : 10000))
      } else {
        const storedBankroll = localStorage.getItem("afripoks.bankroll")
        if (storedBankroll) initialSolde = Number(storedBankroll)
      }
    } catch (e) {}

    // Récupérer la cave spécifiée avant d'entrer à la table (URL ou localStorage)
    const searchParams = new URLSearchParams(window.location.search)
    const paramCave = searchParams.get("cave") || searchParams.get("buy")
    let seatData: any = null
    try {
      const storedSeat = localStorage.getItem("afripoks.seat")
      if (storedSeat) seatData = JSON.parse(storedSeat)
    } catch (e) {}

    const requestedCave = Number(paramCave || seatData?.buy || 2000)
    const chosenCave = Math.max(200, Math.min(requestedCave, initialSolde > 0 ? initialSolde : requestedCave))
    const newRemainingSolde = Math.max(0, initialSolde - chosenCave)

    setUserCave(chosenCave)
    setUserSolde(newRemainingSolde)

    // Déduire la cave du solde utilisateur (solde - cave)
    try {
      const storedUser = localStorage.getItem("afripoks.user")
      if (storedUser) {
        const u = JSON.parse(storedUser)
        u.solde = newRemainingSolde
        u.chips = newRemainingSolde
        localStorage.setItem("afripoks.user", JSON.stringify(u))
      }
      localStorage.setItem("afripoks.bankroll", String(newRemainingSolde))
    } catch (e) {}

    const joinTable = () => socket.emit('sitDown', {
      playerName: userName,
      playerId,
      buyIn: chosenCave,
      cave: chosenCave,
    })
    socket.on('connect', joinTable)

    socket.on('sessionReplaced', () => {
      mySeatRef.current = null
      setMySeat(null)
      socket.disconnect()
    })

    socket.on('tableMessage', (message) => {
      setChatMessages((previous) => [...previous, {
        id: message.id || Date.now(),
        user: message.user || "Joueur",
        text: message.text || "",
        time: message.time || "",
        isSelf: message.senderId === socket.id,
      }])
    })

    socket.on('seatAssigned', (seat) => {
      mySeatRef.current = seat
      setMySeat(seat);
    });

    socket.on('tableUpdate', (gameState) => {
      // Mapper l'état du serveur vers les états locaux
      const { seats = [], seatNames = [], holeCards = [] } = gameState;
      const heroSeat = mySeatRef.current
      
      const newPlayers: Player[] = seats.map((seat: any, i: number) => {
        if (!seat) {
          return {
            id: i,
            name: `Siège ${i + 1}`,
            chips: 0,
            cards: [],
            bet: 0,
            status: "empty",
            isDealer: false,
            isHero: i === heroSeat,
            isTurn: false,
            lastAction: null,
          };
        }
        const hasShowdown = Boolean(gameState.showdown && gameState.showdown.winnerSeats && gameState.showdown.winnerSeats.length > 0);
        const isWinner = Boolean(hasShowdown && gameState.showdown.winnerSeats.includes(i));
        const isLoser = Boolean(hasShowdown && !isWinner && seat);

        return {
          id: i,
          name: `${isWinner ? "🏆 " : ""}${seatNames[i] || `Joueur ${i + 1}`}`,
          chips: seat.stack ?? 0,
          cards: (holeCards && holeCards[i]) ? holeCards[i].map(formatCard) : [],
          bet: seat.betSize || 0,
          status: "active",
          isDealer: gameState.button === i,
          isHero: i === heroSeat,
          isTurn: gameState.playerToAct === i,
          showCards: Boolean(gameState.showdown),
          isWinner,
          isLoser,
          role: [
            gameState.button === i ? "D" : null,
            gameState.smallBlindSeat === i ? "SB" : null,
            gameState.bigBlindSeat === i ? "BB" : null,
          ].filter(Boolean).join(" ") || undefined,
          lastAction: null,
        };
      });
      
      setPlayers(newPlayers);
      setCommunityCards((gameState.communityCards || []).map(formatCard))
      setPot((gameState.pots || []).reduce((sum: number, pot: any) => sum + (pot.size || 0), 0))
      setRoundName(gameState.roundOfBetting ? String(gameState.roundOfBetting).toUpperCase() : "EN ATTENTE")
      setIsHeroTurn(gameState.playerToAct === heroSeat)
      setLegalActions(gameState.playerToAct === heroSeat ? (gameState.legalActions?.actions || []) : [])

      // Animation des jetons qui volent vers le gagnant lors du showdown
      if (gameState.showdown?.winnerSeats && gameState.showdown.winnerSeats.length > 0) {
        const winnerKey = gameState.showdown.winnerSeats.join(",")
        if (prevWinnerRef.current !== winnerKey) {
          prevWinnerRef.current = winnerKey
          gameState.showdown.winnerSeats.forEach((winSeat: number) => {
            animatePotToWinner(winSeat)
          })
        }
      } else {
        prevWinnerRef.current = ""
      }
    });

    return () => {
      socket.off('connect', joinTable)
      socket.off('sessionReplaced')
      socket.off('tableMessage')
      socket.disconnect();
      socketRef.current = null
    }
  }, [])


  // Permet à un joueur de s'asseoir manuellement sur un siège libre
  const handleSitDown = (seatIndex: number) => {
    const t = tableRef.current
    if (!t) return
    const playerName = currentUser?.name || currentUser?.pseudo || `Joueur ${seatIndex + 1}`
    
    // Libérer l'ancien siège
    t.standUp(mySeat)
    setMySeat(seatIndex)
    t.sitDown(seatIndex, userCave)

    setSeatedNames(prev => ({ ...prev, [seatIndex]: playerName }))

    try {
      channelRef.current?.postMessage({
        type: "PLAYER_ENTERED",
        senderId: myTabId.current,
        payload: { seat: seatIndex, name: playerName },
      })
    } catch (e) {}

    const seatedList = (t.seats() || []).map((s: any, idx: number) => s ? idx : null).filter((x: any) => x !== null)
    if (seatedList.length >= 2 && (!t.isHandInProgress || !t.isHandInProgress())) {
      t.startHand()
      const holes: Record<number, Card[]> = {}
      const hCards = t.holeCards()
      seatedList.forEach((s: number) => { holes[s] = hCards[s] })
      setSharedHoleCards(holes)
      animateDeal(seatedList)

      try {
        channelRef.current?.postMessage({
          type: "HAND_STARTED",
          senderId: myTabId.current,
          payload: { activeSeats: seatedList, holeCards: holes },
        })
      } catch (e) {}
    }

    syncEngine()
  }

  // ── Quitter la table et restituer les jetons au solde ──
  const handleLeaveTable = () => {
    const heroPlayer = players.find(p => p.isHero)
    const currentTableChips = heroPlayer ? (heroPlayer.chips + (heroPlayer.bet || 0)) : userCave

    // Restituer les jetons au solde
    let finalSolde = userSolde + currentTableChips
    try {
      const storedUser = localStorage.getItem("afripoks.user")
      if (storedUser) {
        const u = JSON.parse(storedUser)
        const currentStoredSolde = Number(u.solde !== undefined ? u.solde : userSolde)
        finalSolde = currentStoredSolde + currentTableChips
        u.solde = finalSolde
        u.chips = finalSolde
        localStorage.setItem("afripoks.user", JSON.stringify(u))
      }
      localStorage.setItem("afripoks.bankroll", String(finalSolde))
      localStorage.removeItem("afripoks.seat")
    } catch (e) {}

    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    navigate("/lobby.html")
  }

  // ── Décompte visuel de la barre de progression du joueur actif (15 secondes) ──
  const activePlayer = players.find(p => p.isTurn)
  const activeSeatId = activePlayer?.id ?? null

  useEffect(() => {
    if (activeSeatId === null) {
      setTurnProgress(100)
      return
    }

    setTurnProgress(100)
    const duration = 15000 // 15s par tour pour joueur réel
    const interval = 100
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setTurnProgress(prev => {
        if (prev <= 0) return 0;
        const next = prev - step
        if (next <= 0) {
          // Timeout auto: fold si joueur ne répond pas
          const t = tableRef.current
          if (t && t.isHandInProgress && t.isHandInProgress()) {
            try {
              const la = t.legalActions?.()?.actions || ["fold"]
              
              // New rules:
              // 1. If active player is BB and 'check' is allowed -> Check (advances to Flop)
              // 2. Otherwise (Not BB or BB but raised/cannot check) -> Fold
              const activePlayer = players.find(p => p.id === activeSeatId)
              const isBB = activePlayer?.role === "BB"
              const canCheck = la.includes("check")
              
              const autoAct = (isBB && canCheck) ? "check" : "fold"
              
              showPlayerAction(activeSeatId, autoAct)
              t.actionTaken(autoAct)

              channelRef.current?.postMessage({
                type: "PLAYER_ACTION_EVENT",
                senderId: myTabId.current,
                payload: { seat: activeSeatId, action: autoAct },
              })

              syncEngine()
            } catch (e) {}
          }
          return 0
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [activeSeatId, showPlayerAction])

  const handleHeroAction = (action: string) => {
    if (!socketRef.current?.connected || mySeat === null) return

    showPlayerAction(mySeat, action)
    setHeroAction(action)
    setTimeout(() => setHeroAction(null), 1200)

    if (action.startsWith("raise:")) {
      const amt = Number(action.split(":")[1]) || raiseAmount || 100
      setPlayers(prev => prev.map(p => p.id === mySeat ? { ...p, bet: (p.bet || 0) + amt } : p))
    }

    socketRef.current.emit("playerAction", action.toLowerCase())
  }

  const handleNextHand = () => {
    const t = tableRef.current
    if (!t) return
    const seatedCount = (t.seats() || []).filter(Boolean).length
    if (seatedCount < 2) return

    try {
      t.startHand()
      const activeIndices = (t.seats() || []).map((s: any, idx: number) => s ? idx : null).filter((x: any) => x !== null)
      const holes: Record<number, Card[]> = {}
      const hCards = t.holeCards()
      activeIndices.forEach((s: number) => { holes[s] = hCards[s] })
      setSharedHoleCards(holes)
      
      try {
        channelRef.current?.postMessage({
          type: "HAND_STARTED",
          senderId: myTabId.current,
          payload: { activeSeats: activeIndices, holeCards: holes },
        })
      } catch (e) {}

      syncEngine()
      animateDeal(activeIndices)
    } catch (e) {
      console.error(e)
    }
  }

  const playerName = currentUser?.name || currentUser?.pseudo || "Vous"
  const heroPlayer = players.find(p => p.isHero)
  const currentHeroChips = heroPlayer ? heroPlayer.chips : userCave

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    socketRef.current?.emit('tableMessage', inputMessage.trim())
    setInputMessage("")
  }

  return (
    <div className="room-bg w-full h-screen flex flex-col justify-between overflow-hidden select-none">
      <header
        className="w-full flex items-center justify-between px-6 py-2.5 z-30 flex-shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(30, 3, 7, 0.98) 0%, rgba(20, 2, 4, 0.88) 100%)",
          borderBottom: "1.5px solid rgba(217, 174, 75, 0.4)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeaveTable}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-md hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(165, 18, 26, 0.6), rgba(110, 10, 17, 0.7))",
              border: "1.5px solid rgba(245, 218, 146, 0.4)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(165, 18, 26, 0.3)",
            }}
          >
            <span className="text-sm">🚪</span>
            <span className="tracking-wide uppercase" style={{ fontFamily: "var(--font-display)" }}>Quitter</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest text-amber-200 uppercase drop-shadow-md" style={{ fontFamily: "var(--font-display)" }}>
              Table #1
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-400/20 text-amber-300">
              NL Texas Hold'em ({roundName})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm bg-black/70 border border-amber-500/40"
          >
            <span className="text-amber-300/80">🪙 Cave Table :</span>
            <span className="text-amber-300 font-mono font-bold">
              {currentHeroChips.toLocaleString()} ₣
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
            }}
          >
            <span>👤</span>
            <span className="tracking-wide">{playerName}</span>
            <span className="text-emerald-300 text-[11px] font-mono border-l border-white/20 pl-2">
              Solde: {userSolde.toLocaleString()} ₣
            </span>
          </div>
        </div>
      </header>

      {/* ── Table de poker ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center relative w-full px-4 overflow-hidden min-h-0">
        <div className="relative" style={{ width: "min(88vw, 1040px)", height: "min(66vh, 560px)", zIndex: 1 }}>
          <div className="table-rail absolute rounded-[50%]" style={{ inset: "6%", border: "2px solid rgba(201,168,76,0.15)" }}>
            {players.map((_, i) => {
              const angle = SEAT_ANGLES[i] + 20
              const torchPos = posAt(angle, 48, 48)
              return (
                <div key={`elements-${i}`}>
                  <div className="absolute w-3.5 h-3.5 bg-yellow-400 rounded-full" style={{ left: torchPos.left, top: torchPos.top, transform: "translate(-50%, -50%)", boxShadow: "0 0 15px #facc15, 0 0 5px #eab308", zIndex: 20 }} />
                </div>
              )
            })}
          </div>
          <div className="table-felt absolute rounded-[50%]" style={{ inset: "10%" }}>
            <div className="absolute rounded-[50%] pointer-events-none" style={{ inset: "-2%", border: "1px solid rgba(201,168,76,0.1)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              <div className="flex items-center gap-1.5 min-h-[5rem]">
                {communityCards.length > 0 ? (
                  communityCards.map((card, i) => <CardFace key={i} card={card} />)
                ) : (
                  <span className="text-xs tracking-widest text-amber-300/40 uppercase font-mono">En attente du Flop...</span>
                )}
              </div>
              {/* ── Total Pot Display (Centre de la table) ───────────────────── */}
              <div className="flex flex-col items-center gap-1 my-0.5 z-10 select-none">
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/80 bg-gradient-to-r from-black/90 via-amber-950/70 to-black/90 shadow-[0_0_20px_rgba(245,158,11,0.4),0_4px_12px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center -space-x-2">
                    <PokerChipSVG size={20} color="#dc2626" innerColor="#7f1d1d" borderColor="#fca5a5" />
                    <PokerChipSVG size={20} color="#d97706" innerColor="#92400e" borderColor="#fde68a" />
                    <PokerChipSVG size={20} color="#eab308" innerColor="#a16207" borderColor="#fef08a" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[10px] font-black tracking-widest uppercase text-amber-300/90 font-mono"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      POT TOTAL :
                    </span>
                    <span
                      className="text-sm sm:text-base font-black text-amber-300 font-mono tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    >
                      {(pot + players.reduce((sum, p) => sum + (p.bet || 0), 0)).toLocaleString()} ₣
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: "bold", color: "#f5d061", letterSpacing: "0.2em", opacity: 0.85 }}>
                [LOGO] Afripoks
              </div>
              {players.filter(p => p.status !== "empty").length < 2 && (
                <div className="mt-1 px-3 py-1 rounded bg-black/60 border border-amber-400/30 text-[10px] font-mono text-amber-200 animate-pulse">
                  En attente d'autres joueurs (minimum 2)...
                </div>
              )}
            </div>
          </div>
          {players.map((player, i) => (
            <PlayerSlot
              key={player.id}
              player={{
                ...player,
                lastAction: playerActions[player.id] !== undefined ? playerActions[player.id] : player.lastAction,
              }}
              angle={SEAT_ANGLES[i]}
              dealtSeats={dealtSeats}
              turnProgress={player.isTurn ? turnProgress : 0}
              currentUser={currentUser}
            />
          ))}

          {/* ── Cartes volantes – animation de distribution ─────────────────── */}
          {flyingCards.map(fc => {
            const dealerSeat = tableRef.current?.button ? tableRef.current.button() : 0
            const startPos = posAt(SEAT_ANGLES[dealerSeat], 8, 8)
            const targetPos = posAt(SEAT_ANGLES[fc.seat], 43, 45)
            return (
              <div
                key={fc.id}
                className="absolute pointer-events-none"
                style={{
                  left: fc.active ? targetPos.left : startPos.left,
                  top: fc.active ? targetPos.top : startPos.top,
                  transform: "translate(-50%, -50%)",
                  zIndex: 150,
                  transition: "left 0.32s cubic-bezier(0.25,0.8,0.25,1), top 0.32s cubic-bezier(0.25,0.8,0.25,1), opacity 0.18s",
                  opacity: fc.active ? 1 : 0,
                }}
              >
                <div className="card-back" style={{ width: "2.4rem", height: "3.4rem", borderRadius: "3px", position: "relative" }} />
              </div>
            )
          })}

          {/* ── Jetons volants du pot central vers le joueur gagnant ─────────── */}
          {flyingChips.map(chip => {
            const targetPos = posAt(SEAT_ANGLES[chip.winnerSeat], 45, 47)
            return (
              <div
                key={chip.id}
                className="absolute pointer-events-none"
                style={{
                  left: chip.active ? targetPos.left : `calc(50% + ${chip.offsetX}px)`,
                  top: chip.active ? targetPos.top : `calc(50% + ${chip.offsetY}px)`,
                  transform: chip.active
                    ? "translate(-50%, -50%) scale(0.65) rotate(360deg)"
                    : "translate(-50%, -50%) scale(1.2) rotate(0deg)",
                  zIndex: 220,
                  transition: "left 0.62s cubic-bezier(0.22, 1, 0.36, 1), top 0.62s cubic-bezier(0.22, 1, 0.36, 1), transform 0.62s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s 0.45s",
                  opacity: chip.active ? 0 : 1,
                }}
              >
                <PokerChipSVG
                  size={26}
                  color={chip.color}
                  innerColor={chip.innerColor}
                  borderColor={chip.borderColor}
                />
              </div>
            )
          })}
        </div>
      </main>

      {/* ── Barre d'actions & Contrôles inférieure (Footer ergonomique non-bloquant) ── */}
      <footer
        className="w-full relative z-40 bg-gradient-to-t from-black via-black/90 to-black/60 border-t border-amber-500/20 backdrop-blur-md px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 flex-shrink-0 shadow-2xl"
        style={{ minHeight: "64px" }}
      >
        {/* Côté Gauche : Chat & Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="action-btn px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all duration-200 hover:scale-105"
            style={{
              background: isChatOpen ? "linear-gradient(145deg, #a5121a, #6e0a11)" : "linear-gradient(145deg, #381216, #1c0508)",
              border: `1.5px solid ${isChatOpen ? "#f5da92" : "#d9ae4b"}`,
              color: "#f5da92",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f5da92" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
            <span className="text-xs font-black tracking-wider uppercase hidden sm:inline" style={{ fontFamily: "var(--font-display)" }}>Chat</span>
          </button>
        </div>

        {/* Centre : Actions du Joueur */}
        <div className="flex-1 flex items-center justify-center max-w-2xl">
          {heroAction ? (
            <div
              className="px-5 py-2 rounded-xl border border-amber-400/50 bg-black/80 shadow-lg text-xs font-bold uppercase tracking-wider text-amber-300 animate-pulse"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Action validée : {heroAction.toUpperCase()}
            </div>
          ) : isHeroTurn ? (
            (() => {
              const defaultActions = ["fold", "check", "call", "raise"]
              const available = legalActions.length > 0 ? legalActions : defaultActions
              return (
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {available.map((action) => {
                    if (action === "raise") {
                      return (
                        <div key="raise-container" className="flex items-center gap-1.5 bg-black/60 border border-amber-500/30 p-1 rounded-xl">
                          <button
                            onClick={() => setRaiseAmount(prev => Math.max(20, prev - 50))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            value={raiseAmount} 
                            onChange={(e) => setRaiseAmount(Number(e.target.value))}
                            className="w-16 px-1.5 py-1 rounded bg-black/80 border border-amber-500/40 text-amber-200 text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => setRaiseAmount(prev => prev + 50)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleHeroAction(`raise:${raiseAmount}`)}
                            className="action-btn px-4 py-1.5 rounded-lg text-xs font-black shadow-md hover:scale-105 transition-transform cursor-pointer"
                            style={{
                              background: "linear-gradient(135deg, rgba(180,110,10,0.95), rgba(110,65,5,0.95))",
                              border: "1.5px solid #f59e0b",
                              color: "#ffffff",
                              fontFamily: "var(--font-display)",
                              letterSpacing: "0.1em",
                            }}
                          >
                            RAISE
                          </button>
                        </div>
                      )
                    }
                    const style = getActionStyle(action)
                    return (
                      <button
                        key={action}
                        onClick={() => handleHeroAction(action)}
                        className="action-btn px-4 sm:px-6 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{
                          background: style.bg,
                          border: `1.5px solid ${style.border}`,
                          color: "#ffffff",
                          fontFamily: "var(--font-display)",
                          letterSpacing: "0.12em",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        {action.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              )
            })()
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-200/70 font-mono px-3.5 py-1.5 rounded-lg bg-black/50 border border-amber-500/20 shadow-sm">
                {players.filter(p => p.status !== "empty").length < 2 
                  ? "En attente d'autres joueurs..." 
                  : "Tour des autres joueurs..."}
              </span>
            </div>
          )}
        </div>

        {/* Côté Droit : Boutons utilitaires */}
        <div className="flex items-center gap-2">
          {players.filter(p => p.status !== "empty").length >= 2 && !isHeroTurn && (
            <button
              onClick={handleNextHand}
              className="action-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 text-amber-200 cursor-pointer transition-all shadow-sm"
            >
              Nouvelle main 🔄
            </button>
          )}
        </div>
      </footer>

      {/* ── Fenêtre Popup du Chat ────────────────────────────────────────────── */}
      {isChatOpen && (
        <div
          className="fixed bottom-20 left-4 sm:left-auto sm:right-6 w-96 max-w-[calc(100vw-2rem)] h-[480px] rounded-2xl flex flex-col overflow-hidden shadow-2xl z-50 animate-fade-in"
          style={{
            background: "linear-gradient(170deg, rgba(30, 4, 8, 0.98), rgba(16, 2, 4, 0.99))",
            border: "2px solid rgba(217, 174, 75, 0.7)",
            backdropFilter: "blur(15px)",
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(180deg, rgba(165, 18, 26, 0.4), rgba(75, 8, 12, 0.2))", borderBottom: "1px solid rgba(217, 174, 75, 0.25)" }}>
            <span className="text-xs font-black tracking-wider text-amber-200 uppercase" style={{ fontFamily: "var(--font-display)" }}>Discussion de table</span>
            <button onClick={() => setIsChatOpen(false)} className="text-amber-200 hover:text-white cursor-pointer font-bold">✕</button>
          </div>
          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5 text-xs">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
                <span className="font-bold text-[13px]" style={{ color: msg.isSelf ? "#f5da92" : "#d9b8a8" }}>{msg.user}</span>
                <div className="px-3.5 py-2 my-0.5 rounded-xl bg-white/10 text-[14px] leading-relaxed max-w-[85%]">{msg.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-2.5 flex items-center gap-2" style={{ borderTop: "1px solid rgba(217, 174, 75, 0.2)" }}>
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Message..." className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-amber-900/50 text-white text-xs focus:outline-none focus:border-amber-400" />
            <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold text-black cursor-pointer hover:brightness-110" style={{ background: "linear-gradient(170deg, #F0D28A, #C79A2E)" }}>Envoyer</button>
          </form>
        </div>
      )}
    </div>
  )
}
