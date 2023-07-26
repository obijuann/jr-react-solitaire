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
      }, 800);
    }

    return (
      <div className={`card ${this.state.suit} ${this.state.flipped ? "faceup" : ""}`}>
        <div className="cardinner">
          <div className="face">
            <img src={`${process.env.PUBLIC_URL}/cards/fronts/${this.state.suit}_${this.state.rank}.svg`} alt={`${this.state.rank} of ${this.state.suit}`}></img>
            <span className="rank">{rankMap[this.state.rank] || this.state.rank}</span>
            <span className="suit" dangerouslySetInnerHTML={{ __html: suitMap[this.state.suit] }}></span>
          </div>
          <div className="back">
            <img src={`${process.env.PUBLIC_URL}/cards/backs/red2.svg`} alt="card"></img>
          </div>
        </div>
      </div>
    );
  }
}

export default Card;
