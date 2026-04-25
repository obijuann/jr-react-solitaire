import { describe, expect, it } from "vitest";
import { CardData } from "../types/card-data";
import { PlayfieldState } from "../types/playfield-state";
import { Ranks } from "../types/ranks";
import { Suits } from "../types/suits";
import { findAutoCollectCandidate, isValidMove } from "./card-movement-utils";

// Shared test fixtures.
const ranks: Ranks[] = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

const suitsToColorsMap: Partial<Record<Suits, string>> = {
    clubs: "black",
    diamonds: "red",
    hearts: "red",
    spades: "black",
};

/** Build a minimal CardData for test use. */
function card(rank: Ranks, suit: Suits, face: "up" | "down" = "up"): CardData {
    return { rank, suit, face };
}

/** Build a foundation pile that holds the ordered cards for the given suit up to `topRank`. */
function foundationPile(suit: Suits, topRank: Ranks): CardData[] {
    const topIndex = ranks.indexOf(topRank);
    return ranks.slice(0, topIndex + 1).map(r => card(r, suit));
}

/** Helper to build a PlayfieldState with sensible empty defaults. */
function makePlayfield(overrides: Partial<PlayfieldState>): PlayfieldState {
    return {
        draw: [],
        waste: [],
        foundation: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// isValidMove
// ---------------------------------------------------------------------------

describe("isValidMove", () => {
    const emptyPlayfield = makePlayfield({});

    describe("tableau rules", () => {
        it("allows a king onto an empty tableau pile", () => {
            expect(isValidMove(card("king", "hearts"), undefined, "tableau", emptyPlayfield, ranks, suitsToColorsMap)).toBe(true);
        });

        it("rejects a non-king onto an empty tableau pile", () => {
            expect(isValidMove(card("queen", "hearts"), undefined, "tableau", emptyPlayfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("allows a card one rank below the top card with opposite color", () => {
            const topCard = card("8", "clubs"); // black 8
            expect(isValidMove(card("7", "hearts"), topCard, "tableau", emptyPlayfield, ranks, suitsToColorsMap)).toBe(true);
        });

        it("rejects a card of the same color as the top card", () => {
            const topCard = card("8", "clubs"); // black
            expect(isValidMove(card("7", "clubs"), topCard, "tableau", emptyPlayfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("rejects a card that is not exactly one rank below", () => {
            const topCard = card("8", "clubs");
            expect(isValidMove(card("6", "hearts"), topCard, "tableau", emptyPlayfield, ranks, suitsToColorsMap)).toBe(false);
        });
    });

    describe("foundation rules", () => {
        it("allows an ace onto an empty foundation pile", () => {
            const aceCard = {
                rank: "ace" as Ranks,
                suit: "hearts" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({ waste: [aceCard] });
            expect(isValidMove(aceCard, undefined, "foundation", playfield, ranks, suitsToColorsMap)).toBe(true);
        });

        it("rejects a non-ace onto an empty foundation pile", () => {
            const nonAceCard = {
                rank: "2" as Ranks,
                suit: "hearts" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({ waste: [nonAceCard] });
            expect(isValidMove(nonAceCard, undefined, "foundation", playfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("allows a card one rank above the top card with matching suit", () => {
            const twoCard = {
                rank: "2" as Ranks,
                suit: "spades" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({ waste: [twoCard] });
            const topCard = card("ace", "spades");
            expect(isValidMove(twoCard, topCard, "foundation", playfield, ranks, suitsToColorsMap)).toBe(true);
        });

        it("rejects a card with a different suit even at correct rank", () => {
            const twoCard = {
                rank: "2" as Ranks,
                suit: "clubs" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({ waste: [twoCard] });
            const topCard = card("ace", "spades");
            expect(isValidMove(twoCard, topCard, "foundation", playfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("rejects a card that is not exactly one rank above", () => {
            const threeCard = {
                rank: "3" as Ranks,
                suit: "hearts" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({ waste: [threeCard] });
            const topCard = card("ace", "hearts");
            expect(isValidMove(threeCard, topCard, "foundation", playfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("requires the card to be the top card in its source pile (foundation)", () => {
            // Card at index 0 in a 3-card pile — not the top card
            const cardNotOnTop = {
                rank: "2" as Ranks,
                suit: "hearts" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "tableau" as const,
            };
            const playfield = makePlayfield({
                tableau: [
                    [card("10", "clubs"), card("9", "spades"), card("2", "hearts")],
                    [], [], [], [], [], []
                ],
            });
            const topCard = card("ace", "hearts");
            // Should fail because cardNotOnTop is not at the top of its pile
            expect(isValidMove(cardNotOnTop, topCard, "foundation", playfield, ranks, suitsToColorsMap)).toBe(false);
        });

        it("allows a card that is the top card in its source pile (foundation)", () => {
            const cardOnTop = {
                rank: "2" as Ranks,
                suit: "hearts" as Suits,
                face: "up" as const,
                cardIndex: 0,
                pileIndex: 0,
                pileType: "waste" as const,
            };
            const playfield = makePlayfield({
                waste: [card("2", "hearts")],
            });
            const topCard = card("ace", "hearts");
            // Should succeed because it's the only (top) card in waste
            expect(isValidMove(cardOnTop, topCard, "foundation", playfield, ranks, suitsToColorsMap)).toBe(true);
        });
    });

    it("returns false when both cards are missing", () => {
        expect(isValidMove(
            { rank: "", suit: "hearts", face: "up" } as unknown as CardData,
            undefined,
            "tableau",
            emptyPlayfield,
            ranks,
            suitsToColorsMap,
        )).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// findAutoCollectCandidate
// ---------------------------------------------------------------------------

describe("findAutoCollectCandidate", () => {
    it("returns null when playfield is fully empty", () => {
        expect(findAutoCollectCandidate(makePlayfield({}), ranks, suitsToColorsMap)).toBeNull();
    });

    it("returns null when auto-collect would be unsafe", () => {
        const playfield = makePlayfield({
            waste: [card("5", "hearts")],
            foundation: [foundationPile("hearts", "2"), [], [], []],
        });
        expect(findAutoCollectCandidate(playfield, ranks, suitsToColorsMap)).toBeNull();
    });

    it("returns null when waste top card is face-down", () => {
        const playfield = makePlayfield({
            waste: [card("ace", "hearts", "down")],
        });
        expect(findAutoCollectCandidate(playfield, ranks, suitsToColorsMap)).toBeNull();
    });

    it("finds an ace on the waste pile (no foundations started)", () => {
        const playfield = makePlayfield({
            waste: [card("ace", "hearts")],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result).not.toBeNull();
        expect(result?.card).toMatchObject({ rank: "ace", suit: "hearts" });
        expect(result?.sourceType).toBe("waste");
        expect(result?.sourcePileIndex).toBe(0);
        expect(result?.sourceCardIndex).toBe(0);
        expect(result?.targetFoundationIndex).toBe(0);
    });

    it("selects the correct foundation slot for a waste ace when one is already used", () => {
        const playfield = makePlayfield({
            waste: [card("ace", "diamonds")],
            foundation: [[card("ace", "clubs")], [], [], []],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.targetFoundationIndex).toBe(1);
    });

    it("finds a safe card on the top of a tableau column", () => {
        const playfield = makePlayfield({
            foundation: [foundationPile("hearts", "ace"), [], [], []],
            tableau: [
                [card("2", "hearts")],
                [], [], [], [], [], [],
            ],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.card).toMatchObject({ rank: "2", suit: "hearts" });
        expect(result?.sourceType).toBe("tableau");
        expect(result?.sourcePileIndex).toBe(0);
    });

    it("prefers a tableau candidate over a waste candidate", () => {
        const playfield = makePlayfield({
            waste: [card("2", "diamonds")],
            foundation: [
                foundationPile("hearts", "ace"),
                foundationPile("diamonds", "ace"),
                [], [],
            ],
            tableau: [
                [card("2", "hearts")],
                [], [], [], [], [], [],
            ],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.sourceType).toBe("tableau");
        expect(result?.card).toMatchObject({ rank: "2", suit: "hearts" });
    });

    it("falls back to waste when no tableau candidate qualifies", () => {
        const playfield = makePlayfield({
            waste: [card("ace", "spades")],
            foundation: [
                foundationPile("clubs", "2"),
                foundationPile("diamonds", "2"),
                foundationPile("hearts", "2"),
                [],
            ],
            tableau: [
                [card("king", "clubs")],
                [], [], [], [], [], [],
            ],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.sourceType).toBe("waste");
        expect(result?.card).toMatchObject({ rank: "ace", suit: "spades" });
    });

    it("scans tableau columns left to right and returns the leftmost candidate", () => {
        const playfield = makePlayfield({
            foundation: [
                foundationPile("hearts", "ace"),
                foundationPile("clubs", "ace"),
                [], [],
            ],
            tableau: [
                [card("king", "spades")],
                [card("2", "clubs")],
                [card("2", "hearts")],
                [], [], [], [],
            ],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.sourcePileIndex).toBe(1);
        expect(result?.card).toMatchObject({ rank: "2", suit: "clubs" });
    });

    it("ignores tableau columns with a face-down top card", () => {
        const playfield = makePlayfield({
            foundation: [foundationPile("spades", "ace"), [], [], []],
            tableau: [
                [card("2", "spades", "down")],
                [], [], [], [], [], [],
            ],
        });
        expect(findAutoCollectCandidate(playfield, ranks, suitsToColorsMap)).toBeNull();
    });

    it("uses the correct sourceCardIndex for a multi-card tableau column", () => {
        const playfield = makePlayfield({
            foundation: [foundationPile("hearts", "ace"), [], [], []],
            tableau: [
                [card("king", "clubs"), card("queen", "diamonds"), card("2", "hearts")],
                [], [], [], [], [], [],
            ],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.sourceCardIndex).toBe(2);
    });

    it("uses the correct sourceCardIndex for a multi-card waste pile", () => {
        const playfield = makePlayfield({
            waste: [card("3", "clubs"), card("2", "diamonds"), card("ace", "spades")],
            foundation: [[], [], [], []],
        });
        const result = findAutoCollectCandidate(playfield, ranks, suitsToColorsMap);
        expect(result?.sourceCardIndex).toBe(2);
    });

    it("handles the safety gate at the boundary correctly", () => {
        const playfield1 = makePlayfield({
            foundation: [foundationPile("clubs", "3"), [], [], []],
            tableau: [[card("4", "clubs")], [], [], [], [], [], []],
        });
        expect(findAutoCollectCandidate(playfield1, ranks, suitsToColorsMap)).not.toBeNull();

        const playfield2 = makePlayfield({
            foundation: [foundationPile("clubs", "4"), foundationPile("hearts", "ace"), [], []],
            tableau: [[card("5", "clubs")], [], [], [], [], [], []],
        });
        expect(findAutoCollectCandidate(playfield2, ranks, suitsToColorsMap)).toBeNull();
    });
});
