import "./Solitaire.css";

import Modal, { modalTypes } from "./Modal";
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { eventNames, publish, subscribe, unsubscribe } from "./Events";

import Card from "./Card";
import Menu from "./Menu";

const suits = {
  "clubs": "black",
  "diamonds": "red",
  "hearts": "red",
  "spades": "black"
};
const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
const emptyPlayArea = {
  "draw": [],
  "waste": [],
  "foundation": [[], [], [], []],
  "tableau": [[], [], [], [], [], [], []]
};

export default function Solitaire(props) {

  // Set up state management
  const shuffledDeck = useRef([]);
  const timerInterval = useRef();
  const [modalTypeDisplayed, setModalTypeDisplayed] = useState();
  const [gameTimer, setGameTimer] = useState(0);
  const [playfieldState, setPlayfieldState] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    emptyPlayArea
  );
  const undoQueue = useRef([]);
  const redoQueue = useRef([]);


  useEffect(() => {
    // Set listeners for various game events
    subscribe(eventNames.NewGame, newGameHandler);
    subscribe(eventNames.RestartGame, restartGameHandler);
    subscribe(eventNames.ExitGame, exitGameHandler);
    subscribe(eventNames.RedoMove, redoMoveHandler);
    subscribe(eventNames.UndoMove, undoMoveHandler);

    // Check to see if the user has won the game
    checkGameState();

    return () => {
      // Remove listeners for game events
      unsubscribe(eventNames.NewGame, newGameHandler);
      unsubscribe(eventNames.RestartGame, restartGameHandler);
      unsubscribe(eventNames.ExitGame, exitGameHandler);
      unsubscribe(eventNames.RedoMove, redoMoveHandler);
      unsubscribe(eventNames.UndoMove, undoMoveHandler);
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

    // Add the current draw and waste pile information to the Undo queue, so it can be reversed
    const undoPileData =
    {
      draw: structuredClone(playfieldState.draw),
      waste: structuredClone(playfieldState.waste)
    };;

    undoQueue.current.push(undoPileData);

    // Update the draw and waste piles
    const newPlayfieldState = structuredClone(playfieldState);

    // If the draw pile is empty, and the waste pile has cards, move the waste pile back to the draw pile
    if (!newPlayfieldState.draw.length && newPlayfieldState.waste.length) {
      // Also set the cards face down
      newPlayfieldState.draw = newPlayfieldState.waste.reverse().map(cardData => { cardData.face = "down"; return cardData; });
      newPlayfieldState.waste = [];
    } else if (newPlayfieldState.draw.length) {
      // Add the last card from the draw pile to the waste pile
      newPlayfieldState.waste.push(newPlayfieldState.draw.pop());
    }

    // Update the playfield
    setPlayfieldState(newPlayfieldState);
  }

  /**
   * Handles clicks on the waste card pile to automatically move card the top card to new piles
   * @param {Event} e The click event
   */
  function wastePileClickHandler(e) {

    if (!e || !e.target) {
      return;
    }

    // Get the card data from the last card on the waste pile
    const tappedCardElement = e.target.closest(".card");
    const tapppedCardData = tappedCardElement && JSON.parse(tappedCardElement.getAttribute("data-carddata"));

    if (tapppedCardData && tappedCardElement.getAttribute("draggable") === "true") {
      checkAndMoveCard(tapppedCardData);
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
    const tapppedCardData = tappedCardElement && JSON.parse(tappedCardElement.getAttribute("data-carddata"));

    if (tapppedCardData && tapppedCardData.face === "up") {
      checkAndMoveCard(tapppedCardData);
    }
  }

  /**
   * Checks for a valid move for a card and moves it if it finds one
   * @param {*} cardData Card data to check
   */
  function checkAndMoveCard(cardData) {
    // Check to see if the card can be moved to one of the foundation piles
    let result = playfieldState.foundation.findIndex((foundationCardPileData) => {
      return isValidMove(cardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : null, "foundation");
    })

    if (result !== -1) {
      moveCard(cardData, "foundation", result);
      return;
    }

    // Check to see if this card can be moved to one of the tableau piles
    result = playfieldState.tableau.findIndex((tableauCardPileData) => {
      return isValidMove(cardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau");
    })

    if (result !== -1) {
      moveCard(cardData, "tableau", result);
    }
  }

  /**
   * Renders the draw pile of cards
   */
  function renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="card-pile" onClick={drawCardHandler}>
          {playfieldState.draw.map((cardData, cardIndex) => {
            return (
              <Card
                key={`${cardData.rank}_${cardData.suit}`}
                draggable={false}
                rank={cardData.rank}
                suit={cardData.suit}
                face={cardData.face}
                pileType="draw"
                cardIndex={cardIndex}
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

    let className = "";
    const wasteCardCount = playfieldState.waste.length;

    if (wasteCardCount >= 3) {
      className = "offset-two";
    } else if (wasteCardCount === 2) {
      className = "offset-one";
    }

    return (
      <div id="waste" onClick={wastePileClickHandler} className={className}>
        {playfieldState.waste.map((cardData, cardIndex) => {
          const lastCard = cardIndex + 1 === playfieldState.waste.length;
          return (
            <Card
              key={`${cardData.rank}_${cardData.suit}`}
              draggable={lastCard}
              rank={cardData.rank}
              suit={cardData.suit}
              face={cardData.face}
              pileType="waste"
              cardIndex={cardIndex}
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
              className="card-pile"
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
                      key={`${cardData.rank}_${cardData.suit}`}
                      draggable={!!(cardData.face === "up")}
                      rank={cardData.rank}
                      suit={cardData.suit}
                      face={cardData.face}
                      pileType="foundation"
                      pileindex={pileIndex}
                      cardIndex={cardIndex}
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
              className="card-pile"
              id={`tabpile${pileIndex}`}
              key={`pile${pileIndex}`}
              onClick={pileClickHandler}
              onDragEnter={dragEnterHandler}
              onDragOver={dragOverHander}
              onDrop={(event) => dropHandler(event, "tableau", pileIndex)}
            >
              {
                cardDataList.map((cardData, cardIndex) => {
                  return (
                    <Card
                      key={`${cardData.rank}_${cardData.suit}`}
                      draggable={!!(cardData.face === "up")}
                      rank={cardData.rank}
                      suit={cardData.suit}
                      face={cardData.face}
                      pileType="tableau"
                      pileindex={pileIndex}
                      cardIndex={cardIndex}
                      offset={cardIndex * 3}
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
   * Renders the game time elapsed
   */
  function renderGameTime() {
    if (!timerInterval.current) {
      return;
    }

    return (
      <div id="timer">
        {getTimeElapsed()}
      </div>
    )
  }

  /**
   * Helper function to display a formatted time string
   * @returns A formatted string showing the elapsed game time
   */
  function getTimeElapsed() {
    const seconds = Math.floor(gameTimer % 60);
    const minutes = Math.floor((gameTimer / 60) % 60);
    const hours = Math.floor((gameTimer / 60 / 60) % 24);

    let gameTimeElapsed = ""

    // Only shows hours for really slow players
    if (hours) {
      gameTimeElapsed = `${hours}`.padStart(2, "0") + ":";
    }
    gameTimeElapsed += `${minutes}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");

    return gameTimeElapsed;
  }

  /**
   * Resets the game time value and starts the clock
   */
  function startTimer() {
    setGameTimer(0);
    timerInterval.current = setInterval(() => {
      setGameTimer(prevGameTimer => prevGameTimer + 1);
    }, 1000);
  }

  /**
   * Resets the game time value and restarts the clock
   */
  function restartTimer() {
    stopTimer();
    startTimer();
  }

  /**
   * Stops the game timer clock
   */
  function stopTimer() {
    clearInterval(timerInterval.current);
    timerInterval.current = null;
  }

  /**
   * Renders the "game finished" modal
   */
  function renderModal() {

    if (!modalTypeDisplayed) {
      return;
    }

    const gameTime = getTimeElapsed();

    return (
      <Modal
        modalType={modalTypeDisplayed}
        gameTime={gameTime}
      />
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

    if (e.target && e.target && (e.target.id === "play-area" || e.target.id === "menu")) {
      publish(eventNames.ToggleMenu, true);
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
      publish(eventNames.ToggleMenu, true);
    }
  }

  /**
   * Handler for new game custom event triggers
   */
  function newGameHandler() {
    // Stop the timer
    stopTimer();

    // Create a new shuffled deck
    shuffleDeck();

    // Deal the deck
    dealDeck();

    // Start the timer
    startTimer();
  }

  /**
   * Handler for game restart custom event triggers
   */
  function restartGameHandler() {
    // Re-deal the current deck
    dealDeck();

    // Stop the current timer and reset
    restartTimer();
  }

  /**
   * Handler for exit game custom event triggers
   */
  function exitGameHandler() {
    // Stop the timer
    stopTimer();

    // Remove cards from the shuffled deck
    shuffledDeck.current = [];

    // Remove cards from playfield
    setPlayfieldState(emptyPlayArea);
  }

  /**
   * Handler for redo move custom event triggers
   */
  function redoMoveHandler() {
    if (!redoQueue.current.length) {
      return;
    }

    const lastMoveData = redoQueue.current.pop();
    const newPlayfieldState = structuredClone(playfieldState);
    const undoMoveData = [];

    if (lastMoveData) {
      Object.keys(lastMoveData).forEach(key => {
        // Save the undo data from the current state
        undoMoveData[key] = structuredClone(playfieldState[key]);

        // Update the new state object with the data from the last move
        newPlayfieldState[key] = structuredClone(lastMoveData[key]);
      });
    }

    // Add undo move data to undo queue
    undoQueue.current.push(undoMoveData);

    // Update the playfield
    setPlayfieldState(newPlayfieldState);
  }

  /**
   * Handler for undo move custom event triggers
   */
  function undoMoveHandler() {

    if (!undoQueue.current.length) {
      return;
    }

    const lastMoveData = undoQueue.current.pop();
    const newPlayfieldState = structuredClone(playfieldState);
    const redoMoveData = [];

    if (lastMoveData) {
      Object.keys(lastMoveData).forEach(key => {
        // Save the redo data from the current state
        redoMoveData[key] = structuredClone(playfieldState[key]);

        // Update the new state object with the data from the last move
        newPlayfieldState[key] = structuredClone(lastMoveData[key]);
      });
    }

    // Add redo move data to redo queue
    redoQueue.current.push(redoMoveData);

    // Update the playfield
    setPlayfieldState(newPlayfieldState);
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

      // Only move cards to the foundation if they're the last card on their pile
      const cardIndex = droppedCardData.cardIndex;
      const pileLength = droppedCardData.pileindex >= 0 ? playfieldState[droppedCardData.pileType][droppedCardData.pileindex].length : playfieldState[droppedCardData.pileType].length;
      if (pileLength - 1 !== cardIndex) {
        return false;
      }

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
   * @param {cardData} sourceCardData Card data for the source card
   * @param {string} targetPileType The type of target pile
   * @param {number} targetPileIndex The target pile index
   */
  function moveCard(sourceCardData, targetPileType, targetPileIndex) {

    const newPlayfieldState = structuredClone(playfieldState);

    // Remove the card (and any subsequent cards) from the source pile
    const { pileType: sourcePileType, pileindex: sourcePileIndex, cardIndex: sourceCardIndex } = sourceCardData;
    let cardsToMove;
    switch (sourcePileType) {
      case "foundation":
      case "tableau":
        cardsToMove = newPlayfieldState[sourcePileType][sourcePileIndex].slice(sourceCardIndex);
        newPlayfieldState[sourcePileType][sourcePileIndex] = newPlayfieldState[sourcePileType][sourcePileIndex].slice(0, sourceCardIndex);
        break;
      case "waste":
        cardsToMove = newPlayfieldState.waste.slice(sourceCardIndex);
        newPlayfieldState.waste = newPlayfieldState.waste.slice(0, sourceCardIndex);
        break;
      default:
        return;
    }

    // Make sure any cards being moved are set to be face up
    cardsToMove.forEach(cardData => cardData.face = "up");

    // Move cards to target pile
    switch (targetPileType) {
      case "foundation":
      case "tableau":
        newPlayfieldState[targetPileType][targetPileIndex] = newPlayfieldState[targetPileType][targetPileIndex].concat(cardsToMove);
        break;
      case "waste":
        newPlayfieldState.waste = newPlayfieldState.waste.concat(cardsToMove);
        break;
      default:
        return;
    }

    // Add this information to the Undo queue, so it can be reversed
    const undoPileData = {};

    // Always include the source pile data
    undoPileData[sourcePileType] = structuredClone(playfieldState[sourcePileType]);

    // if the target pile was different than the source, include that too
    if (sourcePileType !== targetPileType) {
      undoPileData[targetPileType] = structuredClone(playfieldState[targetPileType]);
    }

    undoQueue.current.push(undoPileData);

    // Reset the redo queue
    redoQueue.current = [];

    // Update the playfield state
    setPlayfieldState(newPlayfieldState);
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

    // Turn all cards face down
    shuffledDeck.current.forEach(cardData => cardData.face = "down");

    // Deal cards into the tableau piles
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

    // Reset the undo/redo queues
    undoQueue.current = [];
    redoQueue.current = [];

    // Update the game state
    setPlayfieldState({ draw: drawPileCardData, tableau: tableauCardData, waste: [], foundation: [[], [], [], []] })
  }

  /**
   * Checks the game state to see if any updates are needed
   */
  function checkGameState() {

    // Checks the playfield to see if the game has been won
    let numFoundationCards = 0;
    playfieldState.foundation.forEach(pileCards => { numFoundationCards += pileCards.length; });

    if (numFoundationCards === 52) {
      // Stop the timer
      stopTimer();

      // Display the "winner" modal
      setModalTypeDisplayed(modalTypes.GameWin);

      return;
    }

    // Check to see which cards need to be flipped
    // This step is needed so that the card flipping animation has something to transition to (face down => face up)
    let updatePlayfield = false;
    let newPlayfieldState = structuredClone(playfieldState);

    // Flip the last card on each tableau pile
    newPlayfieldState.tableau = playfieldState.tableau.map((cardDataList) => {
      return cardDataList.map((cardData, cardIndex) => {
        // Last card should always be up
        const lastCard = cardIndex + 1 === cardDataList.length;

        if (lastCard && cardData.face !== "up") {
          updatePlayfield = true;
          cardData.face = "up";
        }

        return cardData;
      });
    });

    // Flip the last card on the waste pile
    newPlayfieldState.waste = playfieldState.waste.map((cardData, cardIndex) => {
      // Last card should always be up
      const lastCard = cardIndex + 1 === playfieldState.waste.length;

      if (lastCard && cardData.face !== "up") {
        updatePlayfield = true;
        cardData.face = "up";
      }

      return cardData;
    });

    // Update the playfield if any cards need to be updated
    if (updatePlayfield) {
      setPlayfieldState(newPlayfieldState);
    }
  }

  return (
    <div id="play-area" data-testid="play-area" onClick={toggleMenu} onKeyDown={keyDownHandler}>
      {renderDrawPile()}
      {renderWastePile()}
      {renderFoundation()}
      {renderTableau()}
      <Menu
        gameActive={!!shuffledDeck.current.length}
        undoAvailable={!!undoQueue.current.length}
        redoAvailable={!!redoQueue.current.length}
      />
      {renderGameTime()}
      {renderModal()}
    </div>
  );
}