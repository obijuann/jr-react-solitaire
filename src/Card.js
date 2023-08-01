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
      face: props.face
    }
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

    return (
      <div className={`card ${this.state.flipped ? `${this.state.suit} faceup` : ""}`} draggable={this.state.flipped} onDragStart={this.drag.bind(this)}>
        <div className="cardinner">
          <div className="face">
            <img src={`${process.env.PUBLIC_URL}/cards/fronts/${this.state.suit}_${this.state.rank}.svg`} alt={`${this.state.rank} of ${this.state.suit}`} draggable="false"></img>
            <span className="rank">{rankMap[this.state.rank] || this.state.rank}</span>
            <span className="suit" dangerouslySetInnerHTML={{ __html: suitMap[this.state.suit] }}></span>
          </div>
          <div className="back">
            <img src={`${process.env.PUBLIC_URL}/cards/backs/red2.svg`} alt="card" draggable="false"></img>
          </div>
        </div>
      </div>
    );
  }

  drag(e) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.clearData();
    e.dataTransfer.setData("cardData", JSON.stringify(this.state));
  }
}

export default Card;
