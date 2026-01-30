import './card.css';

import { DragEventHandler } from 'react';
import { CardData } from '../types/card-data';

/**
 * Props for the `Card` component. Extends `CardData` with render and
 * interaction helpers.
 */
interface CardComponentProps extends CardData {
  /** Whether the card is draggable. */
  draggable?: boolean
  /** Optional drag-start event handler. */
  onDragStart?: DragEventHandler
  /** Visual vertical offset (in vh) for stacked tableau rendering. */
  offset?: number
}

/**
 * Render a single playing card. The component renders front/back faces,
 * applies suit/rank classes and supports dragging when `draggable` is true.
 * @param props Card component props
 * @returns JSX.Element
 */
export default function Card(props: CardComponentProps) {

  let styleOverride;
  if (props.offset) {
    styleOverride = {
      top: `${props.offset}vh`
    }
  }

  let className = "card ";
  if (props.face === "up") {
    className += `${props.suit} faceup`;
  }

  return (
    <div
      className={className}
      draggable={props.draggable}
      data-carddata={JSON.stringify(props)}
      data-testid="card"
      onDragStart={props.onDragStart}
      style={styleOverride}
    >
      <div className="card-inner">
        <div className="back" />
        <div className={`front rank_${props.rank} ${props.suit}`} />
      </div>
    </div>
  );
}
