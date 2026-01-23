import { CardData } from "./card-data"

export interface PlayfieldState {
    draw: CardData[]
    waste: CardData[]
    foundation: Array[]
    tableau: Array[]
}