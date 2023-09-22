import { Ranks } from "./Ranks"
import { Suits } from "./Suits"

export interface CardData {
    cardIndex?: number
    face: "down" | "up"
    pileIndex?: number
    pileType?: PileTypes
    rank: Ranks
    suit: Suits
}