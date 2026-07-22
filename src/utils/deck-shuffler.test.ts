import { describe, expect, it } from "vitest";
import { createCanonicalDeck, getRandomGameNumber, shuffleDeckWithGameNumber, TOTAL_SOLITAIRE_GAMES } from "./deck-shuffler";

describe("deck-shuffler", () => {
    it("creates canonical 52-card deck", () => {
        const deck = createCanonicalDeck();

        expect(deck).toHaveLength(52);
        expect(deck[0]).toEqual({ rank: "ace", suit: "spades", face: "down" });
        expect(deck[13]).toEqual({ rank: "ace", suit: "hearts", face: "down" });
        expect(deck[26]).toEqual({ rank: "ace", suit: "diamonds", face: "down" });
        expect(deck[39]).toEqual({ rank: "ace", suit: "clubs", face: "down" });
        expect(deck[51]).toEqual({ rank: "king", suit: "clubs", face: "down" });
    });

    it("returns deterministic shuffle for same game number", () => {
        const deckA = shuffleDeckWithGameNumber(617);
        const deckB = shuffleDeckWithGameNumber(617);

        expect(deckA).toEqual(deckB);
        expect(deckA).toHaveLength(52);
    });

    it("returns different shuffle for different game numbers", () => {
        const deckA = shuffleDeckWithGameNumber(1);
        const deckB = shuffleDeckWithGameNumber(2);

        expect(deckA).not.toEqual(deckB);
    });

    it("contains all 52 unique cards after shuffle", () => {
        const deck = shuffleDeckWithGameNumber(1337);
        const set = new Set(deck.map(card => `${card.rank}-${card.suit}`));

        expect(set.size).toBe(52);
    });

    it("validates game number range", () => {
        expect(() => shuffleDeckWithGameNumber(0)).toThrow(/Invalid game number/);
        expect(() => shuffleDeckWithGameNumber(TOTAL_SOLITAIRE_GAMES + 1)).toThrow(/Invalid game number/);
    });

    it("random game number stays within valid bounds", () => {
        const randomLow = getRandomGameNumber(() => 0);
        const randomHigh = getRandomGameNumber(() => 0.999999999999);

        expect(randomLow).toBe(1);
        expect(randomHigh).toBe(TOTAL_SOLITAIRE_GAMES);
    });
});
