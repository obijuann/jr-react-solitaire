import { CardData } from "../types/card-data";
import { PlayfieldState } from "../types/playfield-state";
import { Ranks } from "../types/ranks";
import { Suits } from "../types/suits";

/**
 * Describes a card that qualifies for automatic collection to a foundation pile.
 */
export interface AutoCollectCandidate {
    /** The card to be moved. */
    card: CardData;
    /** Source pile type: "tableau" or "waste". */
    sourceType: "tableau" | "waste";
    /** Source pile index (0–6 for tableau; 0 for waste). */
    sourcePileIndex: number;
    /** Index of the card within its source pile. */
    sourceCardIndex: number;
    /** Index of the destination foundation pile. */
    targetFoundationIndex: number;
}

/**
 * Validate whether a card can be placed onto a target pile according to
 * standard Solitaire rules for tableau and foundation piles.
 *
 * Tableau rules:
 *  - Empty tableau: only Kings allowed
 *  - Non-empty tableau: card rank must be exactly 1 below top card,
 *    and suit color must differ (red vs black)
 *
 * Foundation rules:
 *  - Empty foundation: only Aces allowed
 *  - Non-empty foundation: card rank must be exactly 1 above top card,
 *    and card suit must match top card suit
 *  - Card must currently be the top card in its source pile
 *
 * @param card The card to validate.
 * @param targetTopCard The current top card of the target pile, or undefined if empty.
 * @param targetPileType The type of target pile: "tableau" or "foundation".
 * @param playfieldState Current playfield state (needed only for foundation validation).
 * @param ranks Ordered rank list from lowest ("ace") to highest ("king").
 * @param suitsToColorsMap Maps each suit name to "black" or "red".
 * @returns True when the move is legal.
 */
export function isValidMove(
    card: CardData,
    targetTopCard: CardData | undefined,
    targetPileType: string,
    playfieldState: PlayfieldState,
    ranks: Ranks[],
    suitsToColorsMap: Partial<Record<Suits, string>>,
): boolean {
    if (!targetTopCard && !card) {
        return false;
    }

    const targetRankIndex = targetTopCard ? ranks.indexOf(targetTopCard.rank) : -1;
    const cardRankIndex = ranks.indexOf(card.rank);

    if (targetPileType === "tableau") {
        // Empty tableau: only Kings allowed
        if (!targetTopCard && card.rank === "king") {
            return true;
        }

        // Non-empty tableau: rank must be 1 below top, colors must differ
        if (
            targetTopCard &&
            suitsToColorsMap[targetTopCard.suit] !== suitsToColorsMap[card.suit] &&
            cardRankIndex + 1 === targetRankIndex
        ) {
            return true;
        }
    } else if (targetPileType === "foundation") {
        // Validate that the card is the top card in its source pile
        const cardIndex = card.cardIndex as number;
        const pileIndex = card.pileIndex as number;
        const pileType = card.pileType as keyof PlayfieldState;

        let pileLength: number;
        if (pileType === "waste" || pileType === "draw") {
            // Waste and draw are direct arrays
            pileLength = (playfieldState[pileType] as CardData[]).length;
        } else {
            // Tableau and foundation are arrays of arrays
            pileLength = (playfieldState[pileType] as CardData[][])[pileIndex].length;
        }

        if (pileLength - 1 !== cardIndex) {
            return false;
        }

        // Empty foundation: only Aces allowed
        if (!targetTopCard && card.rank === "ace") {
            return true;
        }

        // Non-empty foundation: rank must be 1 above top, suit must match
        if (
            targetTopCard &&
            targetTopCard.suit === card.suit &&
            cardRankIndex - 1 === targetRankIndex
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Test whether a card is legally placeable on a specific foundation pile.
 *
 * An ace starts on an empty foundation. Any other card must match the pile's
 * suit and be exactly one rank higher than the current top card.
 *
 * @param card The candidate card.
 * @param foundationPile The target foundation pile.
 * @param ranks Ordered rank list from lowest ("ace") to highest ("king").
 * @returns True when the placement is legal.
 */
export function isFoundationLegal(
    card: CardData,
    foundationPile: CardData[],
    ranks: Ranks[],
): boolean {
    if (foundationPile.length === 0) {
        return card.rank === "ace";
    }

    const topCard = foundationPile[foundationPile.length - 1];
    const cardRankIndex = ranks.indexOf(card.rank);
    const topRankIndex = ranks.indexOf(topCard.rank);

    return topCard.suit === card.suit && cardRankIndex === topRankIndex + 1;
}

/**
 * Return the index of the first foundation pile that `card` may legally land on.
 *
 * For aces the leftmost empty foundation is chosen. For all other cards exactly
 * one suit-matching pile can exist as the destination.
 *
 * @param card The card to place.
 * @param foundationPiles The four foundation piles.
 * @param ranks Ordered rank list from lowest to highest.
 * @returns Foundation pile index, or -1 if no legal destination exists.
 */
export function findFoundationTarget(
    card: CardData,
    foundationPiles: CardData[][],
    ranks: Ranks[],
): number {
    return foundationPiles.findIndex(pile => isFoundationLegal(card, pile, ranks));
}

/**
 * Determine whether it is safe to auto-collect a card to its foundation pile.
 *
 * Aces are unconditionally safe. For all other cards two checks are applied:
 *
 * 1. Base safety gate — the card's rank index must be at most 2 above the
 *    lowest rank index among all started (non-empty) foundations.
 *
 * 2. Opposite-color relaxation — a red card is also safe when both black
 *    foundations are started and its rank index is at most 1 above the lower
 *    of the two black foundation tops. The mirror rule applies for black cards
 *    against both red foundations.
 *
 * @param card The candidate card.
 * @param foundationPiles The four foundation piles.
 * @param ranks Ordered rank list from lowest to highest.
 * @param suitsToColorsMap Maps each suit name to "black" or "red".
 * @returns True when the card is safe to auto-collect.
 */
export function isAutoCollectSafe(
    card: CardData,
    foundationPiles: CardData[][],
    ranks: Ranks[],
    suitsToColorsMap: Partial<Record<Suits, string>>,
): boolean {
    // Aces always bypass the safety rule — they are required to start foundations.
    if (card.rank === "ace") return true;

    const cardRankIndex = ranks.indexOf(card.rank);

    // Gather rank indices of non-empty (started) foundations only.
    const startedRankIndices = foundationPiles
        .filter(pile => pile.length > 0)
        .map(pile => ranks.indexOf(pile[pile.length - 1].rank));

    // No foundations started yet — only aces can safely go (handled above).
    if (startedRankIndices.length === 0) return false;

    const lowestStartedRankIndex = Math.min(...startedRankIndices);

    // Base safety gate: card rank ≤ lowest foundation rank + 2.
    if (cardRankIndex <= lowestStartedRankIndex + 2) return true;

    // Opposite-color relaxation.
    const cardColor = suitsToColorsMap[card.suit];

    if (cardColor === "red") {
        // Red card: safe if both black foundations are started and the card's
        // rank is at most one above the lower of the two black foundation tops.
        const blackPileTops = foundationPiles.filter(
            pile =>
                pile.length > 0 &&
                suitsToColorsMap[pile[pile.length - 1].suit] === "black",
        );
        if (blackPileTops.length === 2) {
            const lowestBlackRankIndex = Math.min(
                ...blackPileTops.map(pile => ranks.indexOf(pile[pile.length - 1].rank)),
            );
            if (cardRankIndex <= lowestBlackRankIndex + 1) return true;
        }
    } else if (cardColor === "black") {
        // Black card: safe if both red foundations are started and the card's
        // rank is at most one above the lower of the two red foundation tops.
        const redPileTops = foundationPiles.filter(
            pile =>
                pile.length > 0 &&
                suitsToColorsMap[pile[pile.length - 1].suit] === "red",
        );
        if (redPileTops.length === 2) {
            const lowestRedRankIndex = Math.min(
                ...redPileTops.map(pile => ranks.indexOf(pile[pile.length - 1].rank)),
            );
            if (cardRankIndex <= lowestRedRankIndex + 1) return true;
        }
    }

    return false;
}

/**
 * Find the next card that should be auto-collected to a foundation pile.
 *
 * Scan order (per spec):
 *  1. Tableau columns from left to right — only the current top face-up card
 *     of each column is considered.
 *  2. Waste top card, if no tableau candidate qualifies.
 *
 * A candidate must be both foundation-legal ({@link isFoundationLegal}) and
 * safety-approved ({@link isAutoCollectSafe}).
 *
 * @param playfield Current playfield state.
 * @param ranks Ordered rank list from lowest to highest.
 * @param suitsToColorsMap Maps each suit name to "black" or "red".
 * @returns The first valid auto-collect candidate, or null if none is found.
 */
export function findAutoCollectCandidate(
    playfield: PlayfieldState,
    ranks: Ranks[],
    suitsToColorsMap: Partial<Record<Suits, string>>,
): AutoCollectCandidate | null {
    const foundationPiles = playfield.foundation as CardData[][];

    // 1. Scan tableau columns from left to right.
    const tableauPiles = playfield.tableau as CardData[][];
    for (let i = 0; i < tableauPiles.length; i++) {
        const pile = tableauPiles[i];
        if (!pile.length) continue;

        const topCard = pile[pile.length - 1];
        // Only face-up top cards are eligible.
        if (topCard.face !== "up") continue;

        const targetFoundationIndex = findFoundationTarget(topCard, foundationPiles, ranks);
        if (targetFoundationIndex === -1) continue;

        if (isAutoCollectSafe(topCard, foundationPiles, ranks, suitsToColorsMap)) {
            return {
                card: topCard,
                sourceType: "tableau",
                sourcePileIndex: i,
                sourceCardIndex: pile.length - 1,
                targetFoundationIndex,
            };
        }
    }

    // 2. Check the waste top card if no tableau candidate qualified.
    const waste = playfield.waste as CardData[];
    if (waste.length > 0) {
        const topCard = waste[waste.length - 1];
        if (topCard.face === "up") {
            const targetFoundationIndex = findFoundationTarget(topCard, foundationPiles, ranks);
            if (
                targetFoundationIndex !== -1 &&
                isAutoCollectSafe(topCard, foundationPiles, ranks, suitsToColorsMap)
            ) {
                return {
                    card: topCard,
                    sourceType: "waste",
                    sourcePileIndex: 0,
                    sourceCardIndex: waste.length - 1,
                    targetFoundationIndex,
                };
            }
        }
    }

    return null;
}
