import { CardData } from "../types/card-data";
import { Ranks } from "../types/ranks";
import { Suits } from "../types/suits";

/** Total numbered deals represented by the bundled draw-one solvability table. */
export const TOTAL_SOLITAIRE_GAMES = 1_000_000;

/** Rank order used when generating the canonical deck shape. */
const ranks: Ranks[] = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
/** Suit order used by classic Microsoft Solitaire game-number shuffles. */
const suitOrder: Suits[] = ["spades", "hearts", "diamonds", "clubs"];

/**
 * Build the canonical 52-card deck order used by Microsoft Solitaire:
 * all spades, then hearts, diamonds, clubs; each from ace through king.
 */
export function createCanonicalDeck(): CardData[] {
    const deck: CardData[] = [];
    for (const suit of suitOrder) {
        for (const rank of ranks) {
            deck.push({ rank, suit, face: "down" });
        }
    }
    return deck;
}

/** Returns a random game number in [1, 1,000,000]. */
export function getRandomGameNumber(rng: () => number = Math.random): number {
    return Math.floor(rng() * TOTAL_SOLITAIRE_GAMES) + 1;
}

/**
 * Shuffle cards with Microsoft's Solitaire LCG + Fisher-Yates approach.
 *
 * The algorithm mirrors classic game-number behavior:
 * 1) Run the MSVC-style linear congruential generator.
 * 2) Select from a shrinking index pool.
 * 3) Reverse into deal order so the first array element is dealt first.
 *
 * @param gameNumber Numbered deal id in [1, 1,000,000]
 * @returns Shuffled 52-card deck in deal order
 * @throws Error when gameNumber is outside supported range
 * Returned deck order is the dealing order (first element is dealt first).
 */
export function shuffleDeckWithGameNumber(gameNumber: number): CardData[] {
    if (!Number.isInteger(gameNumber) || gameNumber < 1 || gameNumber > TOTAL_SOLITAIRE_GAMES) {
        throw new Error(`Invalid game number: ${gameNumber}. Expected integer in [1, ${TOTAL_SOLITAIRE_GAMES}]`);
    }

    const baseDeck = createCanonicalDeck();
    const pool: number[] = Array.from({ length: 52 }, (_, idx) => idx);
    const shuffledOrder: number[] = new Array(52);

    let lcgSeed = gameNumber >>> 0;
    let remaining = 52;

    for (let i = 0; i < 52; i++) {
        // Match Microsoft C runtime rand() update + extraction logic.
        lcgSeed = (Math.imul(lcgSeed, 214013) + 2531011) >>> 0;
        const value = (lcgSeed >>> 16) & 0x7fff;
        const pick = value % remaining;

        shuffledOrder[i] = pool[pick];
        remaining--;
        pool[pick] = pool[remaining];
    }

    const dealOrder: CardData[] = [];
    for (let i = 51; i >= 0; i--) {
        // The generated order is stack-style, so reverse for tableau dealing flow.
        const idx = shuffledOrder[i];
        dealOrder.push({ ...baseDeck[idx] });
    }

    return dealOrder;
}
