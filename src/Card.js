import './Card.css';

import React, { Component } from 'react';

const rankMap = {
  "jack": "J",
  "queen": "Q",
  "king": "K",
  "ace": "A"
};

const suitMap = {
  "clubs": "&#9827;",
  "diamonds": "&#9830;",
  "hearts": "&#9829;",
  "spades": "&#9824;"
};

class Card extends Component {

  constructor(props) {
    super(props)

    // Set initial state
    this.state = {
      suit: props.suit,
      rank: props.rank,
      face: props.face || "down",
      flipped: props.flipped,
      piletype: props.piletype,
      pileindex: props.pileindex,
      cardindex: props.cardindex,
      offset: props.offset || 0
    }

    // Bind helper functions to the class
    this.drag = this.drag.bind(this);
  }

  componentWillUnmount() {
    this.setState({ flipped: false, face: "down" });
  }

  render() {
    if (this.state.face === "up" && !this.state.flipped) {
      setTimeout(() => {
        this.setState({ flipped: true })
      }, 0);
    }

    let styleOverride;
    if (this.state.offset) {
      styleOverride = {
        transform: `translateY(${this.state.offset}vh)`
      }
    }

    return (
      <div
        className={`card ${this.state.flipped ? `${this.state.suit} faceup` : ""}`}
        draggable={this.state.flipped}
        datacarddata={JSON.stringify(this.state)}
        onDragStart={this.drag}
        style={styleOverride}
      >
        <div className="cardinner">
          <div className="face">
            <img src={`${process.env.PUBLIC_URL}/cards/fronts/${this.state.suit}_${this.state.rank}.svg`} alt={`${this.state.rank} of ${this.state.suit}`} draggable="false"></img>
            <span className="rank">{rankMap[this.state.rank] || this.state.rank}</span>
            <span className="suit" dangerouslySetInnerHTML={{ __html: suitMap[this.state.suit] }}></span>
          </div>
          <div className="back">
            <img src={`${process.env.PUBLIC_URL}/cards/backs/red.svg`} alt="card" draggable="false"></img>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handler invoked when the card element is dragged
   * @param {Event} e The dragged element
   */
  drag(e) {
    // Write the card data to the data transfer property.
    // This will be read when the card is dropped on an appropriate card pile
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.clearData();
    e.dataTransfer.setData("cardData", JSON.stringify(this.state));
  }
}

export default Card;
