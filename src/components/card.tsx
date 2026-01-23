import './card.css';

import { CardData } from '../types/card-data';
import { DragEventHandler } from 'react';

interface CardComponentProps extends CardData {
    draggable?: boolean
    onDragStart?: DragEventHandler
    offset?: number
}

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
