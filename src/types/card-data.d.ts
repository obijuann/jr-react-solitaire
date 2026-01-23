import { Ranks } from "./ranks"
import { Suits } from "./suits"

export interface CardData {
    cardIndex?: number
    face: "down" | "up"
    pileIndex?: number
    pileType?: PileTypes
    rank: Ranks
    suit: Suits
}