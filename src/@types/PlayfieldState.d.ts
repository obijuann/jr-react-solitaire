import { CardData } from "./CardData"

export interface PlayfieldState {
    draw: CardData[]
    waste: CardData[]
    foundation: Array[]
    tableau: Array[]
}