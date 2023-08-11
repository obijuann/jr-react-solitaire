import "./Solitaire.css";

import React, { useEffect, useReducer, useRef, useState } from 'react';
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

export default function Solitaire(props) {

  // Set up state management
  const shuffledDeck = useRef([]);
  const [isDebug] = useState(props.isDebug);
  const [playfieldState, setPlayfieldState] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    {
      "draw": [],
      "waste": [],
      "foundation": [
        [],
        [],
        [],
        [],
      ],
      "tableau": [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ]
    }
  )

  useEffect(() => {
    // Set listeners for various game events
    subscribe("newGame", newGameHandler);
    subscribe("restartGame", restartGameHandler);
    subscribe("exitGame", exitGameHandler);
    subscribe("redoMove", redoMoveHandler);
    subscribe("undoMove", undoMoveHandler);

    return () => {
      // Remove listeners for game events
      unsubscribe("newGame", newGameHandler);
      unsubscribe("restartGame", restartGameHandler);
      unsubscribe("exitGame", exitGameHandler);
      unsubscribe("redoMove", redoMoveHandler);
      unsubscribe("undoMove", undoMoveHandler);
    };
  });

  /**
   * Prevents default actions on drag enter
   * @param {Event} e Drag enter event
   */
  function dragEnterHandler(e) {
    e.preventDefault();
  }

  /**
   * Prevents default actions on drag over
   * @param {Event} e Drag over event
   */
  function dragOverHander(e) {
    e.preventDefault();
  }

  /**
   * Invoked when drawing cards from the draw pile
   */
  function drawCardHandler(e) {
    e.preventDefault();

    const { draw: drawPileCardData, waste: wastePileCardData } = playfieldState;

    // If the draw pile is empty, and the waste pile has cards, move the waste pile back to the draw pile
    if (!drawPileCardData.length && wastePileCardData.length) {
      setPlayfieldState({ draw: wastePileCardData.reverse(), waste: []});
    } else {
      // Add the last card from the draw pile to the waste pile
      wastePileCardData.push(drawPileCardData.pop());
      setPlayfieldState({ draw: drawPileCardData, waste: wastePileCardData });
    }
  }

  /**
   * Handles clicks on card piles to automatically move cards to new piles
   * @param {Event} e The click event
   */
  function pileClickHandler(e) {

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
    let result = playfieldState.foundation.findIndex((foundationCardPileData) => {
      return isValidMove(tapppedCardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : null, "foundation");
    })

    if (result !== -1) {
      moveCard(tapppedCardData, "foundation", result);
      return;
    }

    // Check to see if this card can be moved to one of the tableau piles
    result = playfieldState.tableau.findIndex((tableauCardPileData, pileIndex) => {
      return isValidMove(tapppedCardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau");
    })

    if (result !== -1) {
      moveCard(tapppedCardData, "tableau", result);
    }
  }

  /**
   * Renders the draw pile of cards
   */
  function renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="cardpile" onClick={drawCardHandler}>
          {playfieldState.draw.map((cardData, cardIndex) => {
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
  function renderWastePile() {
    return (
      <div id="waste" onClick={pileClickHandler}>
        {playfieldState.waste.map((cardData, cardIndex) => {
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
  function renderFoundation() {
    return (
      <div id="foundation">
        {playfieldState.foundation.map((cardDataList, pileIndex) => {
          return (
            <div
              className="cardpile"
              id={`fpile${pileIndex}`}
              key={`fpile${pileIndex}`}
              onClick={pileClickHandler}
              onDragEnter={dragEnterHandler}
              onDragOver={dragOverHander}
              onDrop={(event) => dropHandler(event, "foundation", pileIndex)}
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
  function renderTableau() {
    return (
      <div id="tableau">
        {playfieldState.tableau.map((cardDataList, pileIndex) => {
          return (
            <div
              className="cardpile"
              id={`tabpile${pileIndex}`}
              key={`pile${pileIndex}`}
              onClick={pileClickHandler}
              onDragEnter={dragEnterHandler}
              onDragOver={dragOverHander}
              onDrop={(event) => dropHandler(event, "tableau", pileIndex)}
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
   * Handler to toggle the menu and sub menu
   * @param {Event} e Custom toggle event
  */
  function toggleMenu(e) {
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
  function keyDownHandler(e) {
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
  function newGameHandler() {
    // Create a new shuffled deck
    shuffleDeck();

    // Deal the deck
    dealDeck();

    // Start the timer
  }

  /**
   * Handler for game restart custom event triggers
   */
  function restartGameHandler() {
    dealDeck();
  }

  /**
   * Handler for exit game custom event triggers
   */
  function exitGameHandler() {
    logMessage("not yet implemented");
  }

  /**
   * Handler for redo move custom event triggers
   */
  function redoMoveHandler() {
    logMessage("not yet implemented");
  }

  /**
   * Handler for undo move custom event triggers
   */
  function undoMoveHandler() {
    logMessage("not yet implemented");
  }

  /**
   * Handler for the drop event when a card is dropped on a new pile
   * @param {Event} e The drop event target
   * @param {string} targetPileType The drop target pile type
   * @param {number} targetPileIndex The drop target pile index
   */
  function dropHandler(e, targetPileType, targetPileIndex) {

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
    const cardDataList = playfieldState[targetPileType][targetPileIndex];

    if (cardDataList && cardDataList.length) {
      targetCardData = cardDataList.slice(-1)[0];
    }

    // See if this is a valid move
    if (isValidMove(droppedCardData, targetCardData, targetPileType)) {
      moveCard(droppedCardData, targetPileType, targetPileIndex);
    }
  }

  /**
   * Returns true if the dropped card can be placed atop the pile card
   *
   * @param {cardData} droppedCardData Card data for the dropped or tapped card
   * @param {cardData} targetPileCardData Card data for the target card
   * @param {string} targetPileType Pile type the dropped/tapped card is targeting
   */
  function isValidMove(droppedCardData, targetPileCardData, targetPileType) {
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
  function moveCard(sourceCardData, targetPileType, targetPileIndex) {

    let newFoundationCardData = [...playfieldState.foundation];
    let newTableauCardData = [...playfieldState.tableau];
    let newWastePileCardData = [...playfieldState.waste];

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
    setPlayfieldState({
      foundation: newFoundationCardData,
      tableau: newTableauCardData,
      waste: newWastePileCardData
    });
  }

  /**
   * Resets the current deck and creates a new, shuffled deck
   */
  function shuffleDeck() {
    // Reset the deck
    let newDeck = [];

    // Create an unshuffled deck of cards.
    const suitsList = Object.keys(suits);
    for (let si = 0; si < suitsList.length; si++) {
      for (let ri = 0; ri < ranks.length; ri++) {
        let card = { rank: ranks[ri], suit: suitsList[si], face: "down" };
        newDeck.push(card);
      }
    }

    // Shuffle the cards in the deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      // Pick a random card from the deck
      let j = Math.floor(Math.random() * i);

      // Swap the card at the current index with the randomly chosen one
      let temp = newDeck[i];
      newDeck[i] = newDeck[j];
      newDeck[j] = temp;
    }

    shuffledDeck.current = newDeck;
  }

  /**
   * Deals the deck into the draw and tableau piles
   */
  function dealDeck() {
    // Deal cards into the Tableau piles
    // Starting with the leftmost tableau pile, we deal cards accordingly
    // Pile 1: 1 faceup card
    // Pile 2: 1 facedown card + 1 faceup card
    // Pile 3: 2 facedown cards + 1 faceup card
    // etc.
    let cardsToDeal = 1;
    let cardIndex = 0;
    let tableauCardData = []
    for (let i = 0; i < playfieldState.tableau.length; i++) {
      let cardDataList = [];
      for (let i = 0; i < cardsToDeal; i++) {
        // Create a card element and add it to the pile
        cardDataList.push(shuffledDeck.current[cardIndex++]);
      }
      cardsToDeal++;
      tableauCardData.push(cardDataList);
    }

    // Add the rest of the cards to the draw pile
    const drawPileCardData = shuffledDeck.current.slice(cardIndex).reverse();

    // Update the game state
    setPlayfieldState({ draw: drawPileCardData, tableau: tableauCardData, waste: [], foundation: [[], [], [], []] })
  }

  /**
   * Logs the message to the console in debug mode
   * @param {*} message Message to log
   */
  function logMessage(message) {
    isDebug && console.log(message);
  }

  return (
    <div id="playarea" onClick={toggleMenu} onKeyDown={keyDownHandler}>
      {renderDrawPile()}
      {renderWastePile()}
      {renderFoundation()}
      {renderTableau()}
      <Menu />
      <div id="timer"></div>
    </div>
  );
}