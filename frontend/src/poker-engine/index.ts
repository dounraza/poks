// Pure TypeScript Poker Engine for Texas Hold'em (100% Browser & ESM Native)

export interface Card {
  rank: string;
  suit: string;
}

export interface ForcedBets {
  ante?: number;
  smallBlind: number;
  bigBlind: number;
}

export interface SeatInfo {
  totalChips: number;
  stack: number;
  betSize: number;
}

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["clubs", "diamonds", "hearts", "spades"];

function getSecureRandomInt(max: number): number {
  if (max <= 1) return 0;
  const arr = new Uint32Array(1);
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

export class Table {
  private forcedBets: ForcedBets;
  private numSeats: number;
  private _seats: Array<{ stack: number; betSize: number; folded: boolean; active: boolean } | null>;
  private _holeCards: Array<Card[]>;
  private _communityCards: Card[] = [];
  private _pot: number = 0;
  private _round: "preflop" | "flop" | "turn" | "river" | "showdown" = "preflop";
  private _handInProgress: boolean = false;
  private _buttonSeat: number = 0;
  private _currentTurnSeat: number | null = null;
  private _currentBet: number = 0;
  private _minRaise: number = 0;
  private deck: Card[] = [];

  constructor(forcedBets: ForcedBets = { smallBlind: 20, bigBlind: 40 }, numSeats: number = 9) {
    this.forcedBets = forcedBets;
    this.numSeats = numSeats;
    this._seats = Array(numSeats).fill(null);
    this._holeCards = Array.from({ length: numSeats }, () => []);
  }

  public sitDown(seatIndex: number, buyIn: number) {
    if (seatIndex < 0 || seatIndex >= this.numSeats) return;
    this._seats[seatIndex] = {
      stack: buyIn,
      betSize: 0,
      folded: false,
      active: true,
    };
  }

  public standUp(seatIndex: number) {
    if (seatIndex < 0 || seatIndex >= this.numSeats) return;
    this._seats[seatIndex] = null;
    this._holeCards[seatIndex] = [];
  }

  public seats(): Array<SeatInfo | null> {
    return this._seats.map(s => {
      if (!s) return null;
      return {
        totalChips: s.stack + s.betSize,
        stack: s.stack,
        betSize: s.betSize,
      };
    });
  }

  public holeCards(): Card[][] {
    return this._holeCards;
  }

  public communityCards(): Card[] {
    return this._communityCards;
  }

  public button(): number {
    return this._buttonSeat;
  }

  public pots(): Array<{ size: number }> {
    return [{ size: this._pot }];
  }

  public roundOfBetting(): string {
    return this._round;
  }

  public isHandInProgress(): boolean {
    return this._handInProgress;
  }

  public playerToAct(): number | null {
    return this._currentTurnSeat;
  }

  public startHand() {
    const activeSeatIndices = this._seats
      .map((s, idx) => (s && s.stack > 0 ? idx : null))
      .filter((idx): idx is number => idx !== null);

    if (activeSeatIndices.length < 2) {
      this._handInProgress = false;
      this._currentTurnSeat = null;
      return;
    }

    this._handInProgress = true;
    this._round = "preflop";
    this._communityCards = [];
    this._pot = 0;
    this.deck = createShuffledDeck();

    // Reset players for new hand
    for (let i = 0; i < this.numSeats; i++) {
      if (this._seats[i]) {
        this._seats[i]!.betSize = 0;
        this._seats[i]!.folded = false;
      }
      this._holeCards[i] = [];
    }

    // Advance button
    const nextBtnIdx = activeSeatIndices.findIndex(idx => idx > this._buttonSeat);
    this._buttonSeat = nextBtnIdx !== -1 ? activeSeatIndices[nextBtnIdx] : activeSeatIndices[0];

    // Deal 2 cards to each seated player
    for (const seat of activeSeatIndices) {
      this._holeCards[seat] = [this.deck.pop()!, this.deck.pop()!];
    }

    // Small blind & Big blind
    const sbSeat = this.getNextActiveSeat(this._buttonSeat);
    const bbSeat = this.getNextActiveSeat(sbSeat);

    const sbAmount = Math.min(this.forcedBets.smallBlind, this._seats[sbSeat]!.stack);
    this._seats[sbSeat]!.stack -= sbAmount;
    this._seats[sbSeat]!.betSize = sbAmount;
    this._pot += sbAmount;

    const bbAmount = Math.min(this.forcedBets.bigBlind, this._seats[bbSeat]!.stack);
    this._seats[bbSeat]!.stack -= bbAmount;
    this._seats[bbSeat]!.betSize = bbAmount;
    this._pot += bbAmount;

    this._currentBet = bbAmount;
    this._minRaise = this.forcedBets.bigBlind * 2;

    // First to act preflop is player after BB (UTG)
    this._currentTurnSeat = this.getNextActiveSeat(bbSeat);
  }

  public legalActions(): { actions: string[] } {
    if (!this._handInProgress || this._currentTurnSeat === null) {
      return { actions: [] };
    }
    const currentSeat = this._seats[this._currentTurnSeat];
    if (!currentSeat) return { actions: [] };

    const actions: string[] = ["fold"];
    const callAmount = this._currentBet - currentSeat.betSize;

    if (callAmount <= 0) {
      actions.push("check");
      actions.push("raise");
    } else {
      actions.push("call");
      if (currentSeat.stack > callAmount) {
        actions.push("raise");
      }
    }
    return { actions };
  }

  public actionTaken(action: string) {
    if (!this._handInProgress || this._currentTurnSeat === null) return;
    const seatIdx = this._currentTurnSeat;
    const seat = this._seats[seatIdx];
    if (!seat) return;

    const act = action.toLowerCase();

    if (act === "fold") {
      seat.folded = true;
      this._holeCards[seatIdx] = [];
    } else if (act === "check") {
      // no chips change
    } else if (act === "call") {
      const needed = Math.min(this._currentBet - seat.betSize, seat.stack);
      seat.stack -= needed;
      seat.betSize += needed;
      this._pot += needed;
    } else if (act === "raise" || act === "bet") {
      const raiseTo = Math.max(this._currentBet + this.forcedBets.bigBlind, this._minRaise);
      const needed = Math.min(raiseTo - seat.betSize, seat.stack);
      seat.stack -= needed;
      seat.betSize += needed;
      this._pot += needed;
      this._currentBet = seat.betSize;
      this._minRaise = this._currentBet + this.forcedBets.bigBlind;
    }

    // Check if only 1 player remains
    const nonFoldedSeats = this._seats
      .map((s, idx) => (s && !s.folded ? idx : null))
      .filter((idx): idx is number => idx !== null);

    if (nonFoldedSeats.length <= 1) {
      // Award pot to last remaining player
      if (nonFoldedSeats.length === 1) {
        const winner = this._seats[nonFoldedSeats[0]];
        if (winner) winner.stack += this._pot;
      }
      this._handInProgress = false;
      this._currentTurnSeat = null;
      return;
    }

    // Check if betting round complete
    const isRoundComplete = nonFoldedSeats.every(idx => {
      const s = this._seats[idx]!;
      return s.betSize === this._currentBet || s.stack === 0;
    });

    if (isRoundComplete && act !== "raise" && act !== "bet") {
      this.advanceBettingRound();
    } else {
      this._currentTurnSeat = this.getNextActiveSeat(seatIdx);
    }
  }

  private advanceBettingRound() {
    // Reset player bets for the new street
    for (let i = 0; i < this.numSeats; i++) {
      if (this._seats[i]) this._seats[i]!.betSize = 0;
    }
    this._currentBet = 0;
    this._minRaise = this.forcedBets.bigBlind;

    if (this._round === "preflop") {
      this._round = "flop";
      this._communityCards.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!);
    } else if (this._round === "flop") {
      this._round = "turn";
      this._communityCards.push(this.deck.pop()!);
    } else if (this._round === "turn") {
      this._round = "river";
      this._communityCards.push(this.deck.pop()!);
    } else if (this._round === "river") {
      this._round = "showdown";
      this._handInProgress = false;
      this._currentTurnSeat = null;
      // Award pot to first remaining player (or showdown winner)
      const remaining = this._seats.map((s, idx) => (s && !s.folded ? idx : null)).filter((x): x is number => x !== null);
      if (remaining.length > 0) {
        this._seats[remaining[0]]!.stack += this._pot;
      }
      return;
    }

    // First to act on post-flop streets is first active player left of button
    this._currentTurnSeat = this.getNextActiveSeat(this._buttonSeat);
  }

  private getNextActiveSeat(fromSeat: number): number {
    for (let i = 1; i <= this.numSeats; i++) {
      const nextSeat = (fromSeat + i) % this.numSeats;
      const s = this._seats[nextSeat];
      if (s && !s.folded && s.stack >= 0) {
        return nextSeat;
      }
    }
    return fromSeat;
  }
}

export default { Table };
