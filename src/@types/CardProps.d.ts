import { Ranks } from "./Ranks"
import { Suits } from "./Suits"

export type CardProps = {
    draggable: boolean,
    face: "up" | "down"
    offset: number,
    rank: Ranks,
    suit: Suits
}