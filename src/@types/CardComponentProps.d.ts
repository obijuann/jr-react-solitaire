import { CardData } from "./CardData"
import { PileTypes } from "./PileTypes"

export interface CardComponentProps extends CardData {
    draggable: boolean
    offset?: number
}