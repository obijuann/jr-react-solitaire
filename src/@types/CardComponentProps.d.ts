import { CardData } from "./CardData"

export interface CardComponentProps extends CardData {
    draggable?: boolean
    offset?: number
}