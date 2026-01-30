import { CardData } from "./card-data"

/**
 * Represents the full state of the playfield: draw pile, waste,
 * foundation piles, and tableau piles.
 */
export interface PlayfieldState {
    // Draw pile (cards face-down).
    draw: CardData[]
    // Waste (cards turned from draw).
    waste: CardData[]
    // Four foundation piles; each pile is an array of `CardData`.
    foundation: Array[]
    // Seven tableau piles; each pile is an array of `CardData`.
    tableau: Array[]
}