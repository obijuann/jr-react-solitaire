import './Card.css';

import React, { useState } from 'react';

const rankMap = {
  "jack": "J",
  "queen": "Q",
  "king": "K",
  "ace": "A"
};

const suitMap = {
  "clubs": "♣",
  "diamonds": "♦",
  "hearts": "♥",
  "spades": "♠️"
};

export default function Card(props) {

  const [flipped, setFlipped] = useState(props.flipped);

  // Flip the card over if it hasn't previously been flipped
  if (props.face === "up" && !flipped) {
    setTimeout(() => {
      setFlipped(true);
    });
  }

  let styleOverride;
  if (props.offset) {
    styleOverride = {
      transform: `translateY(${props.offset}vh)`
    }
  }

  let className = "card ";
  if (props.face === "up" && flipped) {
    className += `${props.suit} faceup`;
  }

  /**
   * Handler invoked when the card element is dragged
   * @param {Event} e The dragged element
   */
  function onDragStart(e) {
    // Write the card data to the data transfer property.
    // This will be read when the card is dropped on an appropriate card pile
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.clearData();
    e.dataTransfer.setData("cardData", JSON.stringify(props));
  }

  return (
    <div
      className={className}
      draggable={flipped}
      datacarddata={JSON.stringify(props)}
      onDragStart={onDragStart}
      style={styleOverride}
    >
      <div className={`card-inner ${flipped ? "flipped" : "" }`}>
        <div className="face">
          <img src={`${process.env.PUBLIC_URL}/cards/fronts/${props.suit}_${props.rank}.svg`} alt={`${props.rank} of ${props.suit}`} draggable="false"></img>
          <span className="rank">{rankMap[props.rank] || props.rank}</span>
          <span className="suit">{suitMap[props.suit]}</span>
        </div>
        <div className="back">
          <img src={`${process.env.PUBLIC_URL}/cards/backs/red.svg`} alt="card" draggable="false"></img>
        </div>
      </div>
    </div>
  );
}
