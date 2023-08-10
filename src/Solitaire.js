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
const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

class Solitaire extends Component {

  gameDeck = [];

  /**
   * Component constructor
   * @param {*} props 
   */
  constructor(props) {
    super(props);

    // Set initial state
    this.state = {
      isDebug: props.isDebug || false,
      // A list of cards in the draw pile
      drawPileCardData: [],
      // A list of cards in the waste pile
      wastePileCardData: [],
      // A list of cards for each pile in the foundation
      foundationCardData: [
        [],
        [],
        [],
        [],
      ],
      // A list of cards for each pile in the tableau
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

    // Bind helper functions to the class
    this.newGameHandler = this.newGameHandler.bind(this);
    this.restartGameHandler = this.restartGameHandler.bind(this);
    this.exitGameHandler = this.exitGameHandler.bind(this);
    this.redoMoveHandler = this.redoMoveHandler.bind(this);
    this.undoMoveHandler = this.undoMoveHandler.bind(this);
    this.dropHandler = this.dropHandler.bind(this);
    this.drawCardHandler = this.drawCardHandler.bind(this);
    this.pileClickHandler = this.pileClickHandler.bind(this);
  }

  /**
   * Called when the component is added to the DOM
   */
  componentDidMount() {

    // Set listeners for various game events
    subscribe("newGame", this.newGameHandler);
    subscribe("restartGame", this.restartGameHandler);
    subscribe("exitGame", this.exitGameHandler);
    subscribe("redoMove", this.redoMoveHandler);
    subscribe("undoMove", this.undoMoveHandler);
  }

  /**
   * Called when the component is removed from the DOM
   */
  componentWillUnmount() {
    // Remove listeners for game events
    unsubscribe("newGame", this.newGameHandler);
    unsubscribe("restartGame", this.restartGameHandler);
    unsubscribe("exitGame", this.exitGameHandler);
    unsubscribe("redoMove", this.redoMoveHandler);
    unsubscribe("undoMove", this.undoMoveHandler);
  }

  /**
   * Renders the play area and subsections
   */
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

  /**
   * Renders the draw pile of cards
   */
  renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="cardpile" onClick={this.drawCardHandler}>
          {this.state.drawPileCardData.map((cardData, cardIndex) => {
            return (
              <Card
                key={`${cardData.rank}_${cardData.suit}_${cardData.face}_draw_${cardIndex}`}
                rank={cardData.rank}
                suit={cardData.suit}
                face="down"
                piletype="draw"
                cardindex={cardIndex}
              />
            )
          })
          }
        </div>
      </div>
    );
  }

  /**
   * Renders the waste pile of cards
   */
  renderWastePile() {
    return (
      <div id="waste" onClick={this.pileClickHandler}>
        {this.state.wastePileCardData.map((cardData, cardIndex) => {
          return (
            <Card
              key={`${cardData.rank}_${cardData.suit}_${cardData.face}_waste_${cardIndex}`}
              rank={cardData.rank}
              suit={cardData.suit}
              face="up"
              piletype="waste"
              cardindex={cardIndex}
            />
          )
        })
        }
      </div>
    );
  }

  /**
   * Renders the foundation section of the play area
   */
  renderFoundation() {
    return (
      <div id="foundation">
        {this.state.foundationCardData.map((cardDataList, pileIndex) => {
          return (
            <div
              className="cardpile"
              id={`fpile${pileIndex}`}
              key={`fpile${pileIndex}`}
              onClick={this.pileClickHandler}
              onDragEnter={this.dragEnterHandler}
              onDragOver={this.dragOverHander}
              onDrop={(event) => this.dropHandler(event, "foundation", pileIndex)}
            >
              {
                cardDataList.map((cardData, cardIndex) => {
                  return (
                    <Card
                      key={`${cardData.rank}_${cardData.suit}_${cardData.face}_foundation_${pileIndex}_${cardIndex}`}
                      rank={cardData.rank}
                      suit={cardData.suit}
                      face="up"
                      piletype="foundation"
                      flipped={true}
                      pileindex={pileIndex}
                      cardindex={cardIndex}
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
   * Renders the tableau section of the play area
   */
  renderTableau() {
    return (
      <div id="tableau">
        {this.state.tableauCardData.map((cardDataList, pileIndex) => {
          return (
            <div
              className="cardpile"
              id={`tabpile${pileIndex}`}
              key={`pile${pileIndex}`}
              onClick={this.pileClickHandler}
              onDragEnter={this.dragEnterHandler}
              onDragOver={this.dragOverHander}
              onDrop={(event) => this.dropHandler(event, "tableau", pileIndex)}
            >
              {
                cardDataList.map((cardData, cardIndex) => {
                  // Last card should always be up
                  const lastCard = cardIndex + 1 === cardDataList.length;
                  cardData.face = lastCard ? "up" : cardData.face;
                  // Determine if the card should already appear as flipped
                  const flipped = cardData.face === "up" && !lastCard;

                  return (
                    <Card
                      key={`${cardData.rank}_${cardData.suit}_${cardData.face}_tableau_${pileIndex}_${cardIndex}`}
                      rank={cardData.rank}
                      suit={cardData.suit}
                      face={cardData.face}
                      piletype="tableau"
                      pileindex={pileIndex}
                      cardindex={cardIndex}
                      offset={cardIndex * 3}
                      flipped={flipped}
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
   * @param {Event} e The drop event target
   * @param {string} targetPileType The drop target pile type
   * @param {number} targetPileIndex The drop target pile index
   */
  dropHandler(e, targetPileType, targetPileIndex) {

    if (!e || !e.dataTransfer || !e.target || !targetPileType) {
      return;
    }

    // Get card data from the dropped card
    const droppedCardDataString = e.dataTransfer.getData("cardData");
    const droppedCardData = droppedCardDataString ? JSON.parse(droppedCardDataString) : null;
    if (!droppedCardData || !droppedCardData.suit || !droppedCardData.rank) {
      return;
    }

    // Get the last card in the pile
    let targetCardData;
    const cardDataList = targetPileType === "tableau" ? this.state.tableauCardData[targetPileIndex] : this.state.foundationCardData[targetPileIndex];

    if (cardDataList && cardDataList.length) {
      targetCardData = cardDataList.slice(-1)[0];
    }

    // See if this is a valid move
    if (this.isValidMove(droppedCardData, targetCardData, targetPileType)) {
      this.moveCard(droppedCardData, targetPileType, targetPileIndex);
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
   * @param {cardData} droppedCardData Card data for the dropped or tapped card
   * @param {cardData} targetPileCardData Card data for the target card
   * @param {string} targetPileType Pile type the dropped/tapped card is targeting
   */
  isValidMove(droppedCardData, targetPileCardData, targetPileType) {
    if (!targetPileCardData && !droppedCardData) {
      return false;
    }

    const pileCardDataRankIndex = targetPileCardData ? ranks.indexOf(targetPileCardData.rank) : - 1;
    const droppedCardDataRankIndex = ranks.indexOf(droppedCardData.rank);

    if (targetPileType === "tableau") {
      // Kings are the only card that can be placed on an empty tableau pile
      if (!targetPileCardData && droppedCardData.rank === "king") {
        return true;
      }

      // Valid moves must be descending ranks of alternating red/black suits
      if (targetPileCardData && suits[targetPileCardData.suit] !== suits[droppedCardData.suit] && droppedCardDataRankIndex + 1 === pileCardDataRankIndex) {
        return true;
      }

    } else if (targetPileType === "foundation") {
      // Aces are the only card that can be placed on an empty foundation pile
      if (!targetPileCardData && droppedCardData.rank === "ace") {
        return true;
      }

      // Valid moves must be ascending ranks of the same suit
      if (targetPileCardData && targetPileCardData.suit === droppedCardData.suit && droppedCardDataRankIndex - 1 === pileCardDataRankIndex) {
        return true;
      }
    }

    return false;
  }

  /**
   * Moves the souce card from its origin to the target pile
   * @param {*} sourceCardData Card data for the source card
   * @param {*} targetPileType The type of target pile 
   * @param {*} targetPileIndex The target pile index
   */
  moveCard(sourceCardData, targetPileType, targetPileIndex) {

    let newFoundationCardData = [...this.state.foundationCardData];
    let newTableauCardData = [...this.state.tableauCardData];
    let newWastePileCardData = [...this.state.wastePileCardData];

    // Remove the card (and any subsequent cards) from the source pile
    const { piletype: sourcePileType, pileindex: sourcePileIndex, cardindex: sourceCardIndex } = sourceCardData;
    let cardsToMove;
    switch (sourcePileType) {
      case "foundation":
        cardsToMove = newFoundationCardData[sourcePileIndex].slice(sourceCardIndex);
        newFoundationCardData[sourcePileIndex] = newFoundationCardData[sourcePileIndex].slice(0, sourceCardIndex);
        break;
      case "tableau":
        cardsToMove = newTableauCardData[sourcePileIndex].slice(sourceCardIndex);
        newTableauCardData[sourcePileIndex] = newTableauCardData[sourcePileIndex].slice(0, sourceCardIndex);
        break;
      case "waste":
        cardsToMove = newWastePileCardData.slice(sourceCardIndex);
        newWastePileCardData = newWastePileCardData.slice(0, sourceCardIndex);
        break;
      default:
        return;
    }

    // Move cards to target pile
    switch (targetPileType) {
      case "foundation":
        newFoundationCardData[targetPileIndex] = newFoundationCardData[targetPileIndex].concat(cardsToMove);
        break;
      case "tableau":
        newTableauCardData[targetPileIndex] = newTableauCardData[targetPileIndex].concat(cardsToMove);
        break;
      case "waste":
        newWastePileCardData = newWastePileCardData.concat(cardsToMove);
        break;
      default:
        return;
    }

    // Update state
    this.setState({
      foundationCardData: newFoundationCardData,
      tableauCardData: newTableauCardData,
      wastePileCardData: newWastePileCardData
    });
  }

  /**
   * Handles clicks on card piles to automatically move cards to new piles
   * @param {Event} e The click event
   * @returns 
   */
  pileClickHandler(e) {

    if (!e || !e.target) {
      return;
    }

    // Get the card data from the tapped card
    const tappedCardElement = e.target.closest(".card");
    const tapppedCardData = tappedCardElement && JSON.parse(tappedCardElement.getAttribute("datacarddata"));

    if (!tapppedCardData || (tapppedCardData && tapppedCardData.face === "down")) {
      return;
    }

    // Check to see if the card can be moved to one of the foundation piles
    let result = this.state.foundationCardData.findIndex((foundationCardPileData) => {
      return this.isValidMove(tapppedCardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : null, "foundation");
    })

    if (result !== -1) {
      this.moveCard(tapppedCardData, "foundation", result);
      return;
    }

    // Check to see if this card can be moved to one of the tableau piles
    result = this.state.tableauCardData.findIndex((tableauCardPileData, pileIndex) => {
      return this.isValidMove(tapppedCardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau");
    })

    if (result !== -1) {
      this.moveCard(tapppedCardData, "tableau", result);
    }
  }

  /**
   * Prevents default actions on drag enter
   * @param {Event} e Drag enter event
   */
  dragEnterHandler(e) {
    e.preventDefault();
  }

  /**
   * Prevents default actions on drag over
   * @param {Event} e Drag over event
   */
  dragOverHander(e) {
    e.preventDefault();
  }

  /**
   * Handler to toggle the menu and sub menu
   * @param {Event} e Toggle event
   */
  toggleMenu(e) {
    if (!e) {
      return;
    }

    e.preventDefault();

    if (e.target && e.target && (e.target.id === "playarea" || e.target.id === "menu")) {
      publish("toggleMenu", true);
    }
  }

  /**
   * Handler for keyboard events
   * @param {Event} e Keyboard event
   */
  keyDownHandler(e) {
    if (!e || !e.key) {
      return;
    }

    // Toggle the menu on Esc or m/M
    if (e.keyCode === 27 || e.keyCode === 77) {
      publish("toggleMenu", true);
    }
  }

  /**
   * Handler for new game custom event triggers
   */
  newGameHandler() {
    // Create a new shuffled deck
    this.shuffleDeck();

    // Deal the deck
    this.dealDeck();
  }

  /**
   * Handler for game restart custom event triggers
   */
  restartGameHandler() {
    this.dealDeck();
  }

  /**
   * Handler for exit game custom event triggers
   */
  exitGameHandler() {
    console.error("not yet implemented");
  }

  /**
   * Handler for redo move custom event triggers
   */
  redoMoveHandler() {
    console.error("not yet implemented");
  }

  /**
   * Handler for undo move custom event triggers
   */
  undoMoveHandler() {
    console.error("not yet implemented");
  }

  /**
   * Resets the current deck and creates a new, shuffled deck
   */
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

  /**
   * Deals the deck into the draw and tableau piles
   */
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
        cardDataList.push(this.gameDeck[cardIndex++]);
      }
      cardsToDeal++;
      tableauCardData.push(cardDataList);
    }

    // Add the rest of the cards to the draw pile
    const drawPileCardData = this.gameDeck.slice(cardIndex).reverse();

    // Update the game state
    this.setState({ drawPileCardData, tableauCardData, wastePileCardData: [], foundationCardData: [[], [], [], []] });
  }
}

export default Solitaire;
