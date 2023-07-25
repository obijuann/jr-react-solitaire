import "./Solitaire.css";

import React, { Component } from 'react';
import { publish, subscribe, unsubscribe } from "./Events";

import Card from "./Card";
import Menu from "./Menu";

const suits = ["clubs", "diamonds", "hearts", "spades"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

class Solitaire extends Component {

  gameDeck = [];

  constructor(props) {
    super(props);

    // Set initial state
    this.state = {
      isDebug: props.isDebug || false,
      drawPileCardData: [],
      tableauCardData: [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ]
    };

    this.tableauArea = React.createRef();
  }

  componentDidMount() {
    // Bind helper functions to the class
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.newGameHandler = this.newGameHandler.bind(this);
    this.restartGameHandler = this.restartGameHandler.bind(this);
    this.exitGameHandler = this.exitGameHandler.bind(this);
    this.redoMoveHandler = this.redoMoveHandler.bind(this);
    this.undoMoveHandler = this.undoMoveHandler.bind(this);

    // Set listeners for various game events
    subscribe("newGame", this.newGameHandler);
    subscribe("restartGame", this.restartGameHandler);
    subscribe("exitGame", this.exitGameHandler);
    subscribe("redoMove", this.redoMoveHandler);
    subscribe("undoMove", this.undoMoveHandler);
  }

  componentWillUnmount() {
    // Remove listeners for game events
    unsubscribe("newGame", this.newGameHandler);
    unsubscribe("restartGame", this.restartGameHandler);
    unsubscribe("exitGame", this.exitGameHandler);
    unsubscribe("redoMove", this.redoMoveHandler);
    unsubscribe("undoMove", this.undoMoveHandler);
  }

  render() {
    return (
      <div id="playarea" onClick={this.toggleMenu} onKeyDown={this.keyDownHandler}>
        {this.renderDrawPile()}
        <div id="waste">
        </div>
        <div id="foundation">
          <div id="stack1" className="cardpile"></div>
          <div id="stack2" className="cardpile"></div>
          <div id="stack3" className="cardpile"></div>
          <div id="stack4" className="cardpile"></div>
        </div>
        {this.renderTableau()}
        <Menu />
        <div id="timer"></div>
      </div>
    );
  }

  renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="cardpile">
          {this.state.drawPileCardData.map((cardData, pileIndex) => {
            return (
              <Card
                key={`${cardData.rank}_${cardData.suit}_${cardData.face}`}
                rank={cardData.rank}
                suit={cardData.suit}
                face="down"
              />
            )
          })
          }
        </div>
      </div>
    );
  }

  renderTableau() {
    return (
      <div id="tableau" ref={this.tableauArea}>
        {this.state.tableauCardData.map((cardDataList, pileIndex) => {
          return (<div id={`pile${pileIndex}`} key={`pile${pileIndex}`} className="cardpile">
            {
              cardDataList.map((cardData) => {
                return (
                  <Card
                    key={`${cardData.rank}_${cardData.suit}_${cardData.face}`}
                    rank={cardData.rank}
                    suit={cardData.suit}
                    face={cardData.face}
                  />
                )
              })
            }
          </div>)
        })}
      </div>
    );
  }


  toggleMenu(e) {
    if (!e) {
      return;
    }
    e.preventDefault();
    if (e.target && e.target && (e.target.id === "playarea" || e.target.id === "menu")) {
      publish("toggleMenu", true);
    }
  }

  keyDownHandler(e) {
    if (!e || !e.key) {
      return;
    }

    // Toggle the menu on Esc or m/M
    if (e.keyCode === 27 || e.keyCode === 77) {
      publish("toggleMenu", true);
    }
  }

  newGameHandler() {
    // Create a new shuffled deck
    this.shuffleDeck();

    // Deal the deck
    this.dealDeck();
  }

  restartGameHandler() {
    console.log("restart game");
    this.dealDeck();
  }

  exitGameHandler() {
    console.log("exit game");
  }

  redoMoveHandler() {
    console.log("redoing last move");
  }

  undoMoveHandler() {
    console.log("undo last move");
  }

  shuffleDeck() {
    // Reset the deck
    this.gameDeck = [];

    // Create an unshuffled deck of cards.
    for (let si = 0; si < suits.length; si++) {
      for (let ri = 0; ri < ranks.length; ri++) {
        let card = { rank: ranks[ri], suit: suits[si] };
        this.gameDeck.push(card);
      }
    }

    // Shuffle the cards in the deck
    for (let i = this.gameDeck.length - 1; i > 0; i--) {
      // Pick a random card from the deck
      let j = Math.floor(Math.random() * i);

      // Swap the card at the current index with the randomly chosen one
      let temp = this.gameDeck[i];
      this.gameDeck[i] = this.gameDeck[j];
      this.gameDeck[j] = temp;
    }
  }

  dealDeck() {
    // Deal cards into the Tableau piles
    // Starting with the leftmost tableau pile, we deal cards accordingly
    // Pile 1: 1 faceup card
    // Pile 2: 1 facedown card + 1 faceup card
    // Pile 3: 2 facedown cards + 1 faceup card
    // etc.
    let cardsToDeal = 1;
    let cardIndex = 0;
    let tableauCardData = []
    for (let i = 0; i < this.state.tableauCardData.length; i++) {
      let cardDataList = [];
      for (let i = 0; i < cardsToDeal; i++) {
        // Create a card element and add it to the pile
        const cardData = this.gameDeck[cardIndex++];
        // Last card in the pile is face up
        cardData.face = i === cardsToDeal - 1 ? "up" : "down";
        cardDataList.push(cardData);
      }
      cardsToDeal++;
      tableauCardData.push(cardDataList);
    }

    // Add the rest of the cards to the draw pile
    const drawPileCardData = this.gameDeck.slice(cardIndex).reverse();

    if (this.state.isDebug) {
      console.log(this.gameDeck);
      console.log(tableauCardData);
      console.log(drawPileCardData);
    }

    // Update the game state
    this.setState({ drawPileCardData, tableauCardData });
  }
}

export default Solitaire;
