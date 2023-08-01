import "./Solitaire.css";

import React, { Component } from 'react';
import { publish, subscribe, unsubscribe } from "./Events";

import Card from "./Card";
import Menu from "./Menu";

const suits = {
  "clubs": "black",
  "diamonds": "red",
  "hearts": "red",
  "spades": "black"
};
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

class Solitaire extends Component {

  gameDeck = [];

  constructor(props) {
    super(props);

    // Set initial state
    this.state = {
      isDebug: props.isDebug || false,
      drawPileCardData: [],
      wastePileCardData: [],
      foundationCardData: [
        [],
        [],
        [],
        [],
      ],
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

    // Bind helper functions to the class
    this.newGameHandler = this.newGameHandler.bind(this);
    this.restartGameHandler = this.restartGameHandler.bind(this);
    this.exitGameHandler = this.exitGameHandler.bind(this);
    this.redoMoveHandler = this.redoMoveHandler.bind(this);
    this.undoMoveHandler = this.undoMoveHandler.bind(this);
    this.dropHandler = this.dropHandler.bind(this);
    this.drawCardHandler = this.drawCardHandler.bind(this);
  }

  componentDidMount() {
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
        {this.renderWastePile()}
        {this.renderFoundation()}
        {this.renderTableau()}
        <Menu />
        <div id="timer"></div>
      </div>
    );
  }

  renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="cardpile" onClick={this.drawCardHandler}>
          {this.state.drawPileCardData.map((cardData) => {
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

  renderWastePile() {
    return (
      <div id="waste">
        {this.state.wastePileCardData.map((cardData) => {
          return (
            <Card
              key={`${cardData.rank}_${cardData.suit}_${cardData.face}`}
              rank={cardData.rank}
              suit={cardData.suit}
              face="up"
            />
          )
        })
        }
      </div>
    );
  }

  renderFoundation() {
    return (
      <div id="foundation" ref={this.tableauArea}>
        {this.state.foundationCardData.map((cardDataList, pileIndex) => {
          return (<div id={`fpile${pileIndex}`} key={`fpile${pileIndex}`} datapileindex={pileIndex} datapiletype="foundation" className="cardpile" onDrop={this.dropHandler} onDragEnter={this.dragEnterHandler} onDragOver={this.dragOverHander}>
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

  renderTableau() {
    return (
      <div id="tableau" ref={this.tableauArea}>
        {this.state.tableauCardData.map((cardDataList, pileIndex) => {
          return (<div id={`tabpile${pileIndex}`} key={`pile${pileIndex}`} datapileindex={pileIndex} datapiletype="tableau" className="cardpile" onDrop={this.dropHandler} onDragEnter={this.dragEnterHandler} onDragOver={this.dragOverHander}>
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

  /**
   * Handler for the drop event when a card is dropped on a new pile
   * @param {*} e The event
   */
  dropHandler(e) {

    if (!e || !e.dataTransfer || !e.target) {
      return;
    }

    // Get card data from the dropped card
    const cardDataString = e.dataTransfer.getData("cardData");
    const droppedCardData = cardDataString ? JSON.parse(cardDataString) : null;
    if (!droppedCardData || !droppedCardData.suit || !droppedCardData.rank) {
      return;
    }

    // Find the closest card pile element
    const droppedCardPile = e.target.closest(".cardpile");

    // Find the last element in the card data
    let pileCardData;
    let pileType = "";

    // Get the pile type and the last card in the pile
    let pileIndex = 0;
    if (droppedCardPile && droppedCardPile.getAttribute("datapiletype") && droppedCardPile.getAttribute("datapileindex") !== null) {
      pileType = droppedCardPile.getAttribute("datapiletype");
      pileIndex = droppedCardPile.getAttribute("datapileindex");
      const cardDataList = pileType === "tableau" ? this.state.tableauCardData[pileIndex] : this.state.foundationCardData[pileIndex];

      if (cardDataList && cardDataList.length) {
        pileCardData = cardDataList.slice(-1)[0];
      }
    }

    // See if this is a valid move
    if (this.isValidMove(pileCardData, droppedCardData, pileType)) {
      console.log("this is a valid move");
    } else {
      console.log("this is an invalid move");
    }
  }

  /**
   * Invoked when drawing cards from the draw pile
   */
  drawCardHandler(e) {
    e.preventDefault();

    if (!this.state.drawPileCardData || !this.state.drawPileCardData || (!this.state.drawPileCardData.length && !this.state.wastePileCardData.length)) {
      return;
    }

    const { drawPileCardData, wastePileCardData } = this.state;

    // If the draw pile is empty, and the waste pile has cards, move the waste pile back to the draw pile
    if (!drawPileCardData.length && wastePileCardData.length) {
      this.setState({ drawPileCardData: wastePileCardData.reverse(), wastePileCardData: [] });
    } else {
      // Add the last card from the draw pile to the waste pile
      wastePileCardData.push(drawPileCardData.pop());
      this.setState({ drawPileCardData, wastePileCardData });
    }
  }

  /**
   * Returns true if the dropped card can be placed atop the pile card
   * 
   * @param {cardData} pileCardData 
   * @param {cardData} droppedCardData 
   */
  isValidMove(pileCardData, droppedCardData, pileType) {
    if (!pileCardData && !droppedCardData) {
      return false;
    }

    const pileCardDataRankIndex = pileCardData ? ranks.indexOf(pileCardData.rank) : - 1;
    const droppedCardDataRankIndex = ranks.indexOf(droppedCardData.rank);

    if (pileType === "tableau") {
      // Kings are the only card that can be placed on an empty tableau pile
      if (!pileCardData && droppedCardData.rank === "king") {
        return true;
      }

      // Valid moves must be descending ranks of alternating red/black suits
      if (pileCardData && suits[pileCardData.suit] !== suits[droppedCardData.suit] && droppedCardDataRankIndex + 1 === pileCardDataRankIndex) {
        return true;
      }

    } else if (pileType === "foundation") {
      // Aces are the only card that can be placed on an empty foundation pile
      if (!pileCardData && droppedCardData.rank === "ace") {
        return true;
      }

      // Valid moves must be ascending ranks of the same suit
      if (pileCardData && pileCardData.suit === droppedCardData.suit && droppedCardDataRankIndex - 1 === pileCardDataRankIndex) {
        return true;
      }
    }

    return false;
  }

  dragEnterHandler(e) {
    e.preventDefault();
  }

  dragOverHander(e) {
    e.preventDefault();
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
    const suitsList = Object.keys(suits);
    for (let si = 0; si < suitsList.length; si++) {
      for (let ri = 0; ri < ranks.length; ri++) {
        let card = { rank: ranks[ri], suit: suitsList[si] };
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
    this.setState({ drawPileCardData, tableauCardData, wastePileCardData: [], foundationCardData: [[], [], [], []] });
  }
}

export default Solitaire;
