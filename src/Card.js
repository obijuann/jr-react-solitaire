import './Card.css';

import React, { Component } from 'react';

class Card extends Component {

  constructor(props) {
    super(props)

    // Set initial state
    this.state = {
      suit: props.suit,
      rank: props.rank,
      face: props.face,
      offset: props.offset
    }
  }

  render() {
    let cardText = "";
    let cardClass = "facedown"
    cardText = `${this.state.rank} of ${this.state.suit}`;

    if (this.state.face === "up") {
      cardText = `${this.state.rank} of ${this.state.suit}`;
      cardClass = `${this.state.suit}-${this.state.rank}`;
    }

    return (
      <div className={`card ${cardClass}`} title={cardText} style={{ top: `${this.state.offset}%`}}>
      </div>
    );
  }
}

export default Card;
