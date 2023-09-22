import './Card.css';

import { CardComponentProps } from './@types/CardComponentProps';
import { Ranks } from './@types/Ranks';
import { Suits } from './@types/Suits';

const rankMap: Partial<Record<Ranks, string>> = {
  "jack": "J",
  "queen": "Q",
  "king": "K",
  "ace": "A"
};

const suitMap: Record<Suits, string> = {
  "clubs": "♣",
  "diamonds": "♦",
  "hearts": "♥",
  "spades": "♠️"
};

export default function Card(props: CardComponentProps) {

  let styleOverride;
  if (props.offset) {
    styleOverride = {
      transform: `translateY(${props.offset}vh)`
    }
  }

  let className = "card ";
  if (props.face === "up") {
    className += `${props.suit} faceup`;
  }

  /**
   * Handler invoked when the card element is dragged
   * @param {DragEvent} dragEvent Drag event
   */
  function onDragStart(dragEvent: React.DragEvent<HTMLDivElement>): void {
    // Write the card data to the data transfer property.
    // This will be read when the card is dropped on an appropriate card pile
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.clearData();
    dragEvent.dataTransfer.setData("cardData", JSON.stringify(props));
  }

  return (
    <div
      className={className}
      draggable={props.draggable}
      data-carddata={JSON.stringify(props)}
      data-testid="card"
      onDragStart={onDragStart}
      style={styleOverride}
    >
      <div className="card-inner">
        <div className="face">
          <img src={`/cards/fronts/${props.suit}_${props.rank}.svg`} alt={`${props.rank} of ${props.suit}`} draggable="false"></img>
          <span className="rank">{rankMap[props.rank] || props.rank}</span>
          <span className="suit">{suitMap[props.suit]}</span>
        </div>
        <div className="back">
          <img src={`/cards/backs/red.svg`} alt="card" draggable="false"></img>
        </div>
      </div>
    </div>
  );
}
