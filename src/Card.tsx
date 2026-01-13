import './Card.css';

import { CardComponentProps } from './@types/CardComponentProps';

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

  /**
   * Handler invoked when the card element is dragged
   * @param {DragEvent} dragEvent Drag event
   */
  // function onDragStart(dragEvent: React.DragEvent<HTMLDivElement>): void {
  //   // Write the card data to the data transfer property.
  //   // This will be read when the card is dropped on an appropriate card pile
  //   dragEvent.dataTransfer.effectAllowed = "move";
  //   dragEvent.dataTransfer.clearData();
  //   dragEvent.dataTransfer.setData("cardData", JSON.stringify(props));
  // }

  return (
    <div
      className={className}
      // draggable={props.draggable}
      data-carddata={JSON.stringify(props)}
      data-testid="card"
      // onDragStart={onDragStart}
      style={styleOverride}
    >
      <div className="card-inner">
        <div className="back" />
        <div className={`front rank_${props.rank} ${props.suit}`} />
      </div>
    </div>
  );
}
