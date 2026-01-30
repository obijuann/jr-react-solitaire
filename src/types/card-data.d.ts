import { Ranks } from "./ranks"
import { Suits } from "./suits"

/**
 * Representation of a single card in the application.
 */
export interface CardData {
    // Index of the card within its pile (optional).
    cardIndex?: number
    // Whether the card is face-up or face-down.
    face: "down" | "up"
    // Index of the pile the card belongs to (optional).
    pileIndex?: number
    // Type of pile this card belongs to (draw/waste/foundation/tableau).
    pileType?: PileTypes
    // Rank of the card (ace, 2..king).
    rank: Ranks
    // Suit of the card (clubs/diamonds/hearts/spades).
    suit: Suits
}