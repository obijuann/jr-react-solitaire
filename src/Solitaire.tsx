import "./Solitaire.css";

import { publish, subscribe, unsubscribe } from "./Events";
import { useEffect, useReducer, useRef, useState } from 'react';

import Card from "./Card";
import { CardData } from "./@types/CardData";
import Menu from "./Menu";
import Modal from "./Modal";
import { ModalTypes } from "./@types/ModalTypes";
import { PlayfieldState } from "./@types/PlayfieldState";
import { Ranks } from "./@types/Ranks";
import { Suits } from "./@types/Suits";
import { PileTypes } from "./@types/PileTypes";

const suits: Partial<Record<Suits, string>> = {
  "clubs": "black",
  "diamonds": "red",
  "hearts": "red",
  "spades": "black"
};
const ranks: Ranks[] = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

const emptyPlayArea: PlayfieldState = {
  "draw": [],
  "waste": [],
  "foundation": [[], [], [], []],
  "tableau": [[], [], [], [], [], [], []]
};

export default function Solitaire() {

  // Set up state management
  const shuffledDeck = useRef<CardData[]>([]);
  const timerInterval = useRef<ReturnType<typeof setInterval>>();
  const [modalTypeDisplayed, setModalTypeDisplayed] = useState<ModalTypes>();
  const [gameTimer, setGameTimer] = useState<number>(0);
  const [playfieldState, setPlayfieldState] = useReducer(
    (state: PlayfieldState, newState: Partial<PlayfieldState>) => ({ ...state, ...newState }),
    emptyPlayArea
  );


  const undoQueue = useRef<Partial<PlayfieldState>[]>([]);
  const redoQueue = useRef<Partial<PlayfieldState>[]>([]);


  useEffect(() => {
    // Set listeners for various game events
    subscribe("newGame", newGameHandler);
    subscribe("restartGame", restartGameHandler);
    subscribe("exitGame", exitGameHandler);
    subscribe("redoMove", redoMoveHandler);
    subscribe("undoMove", undoMoveHandler);

    // Check to see if the user has won the game
    checkGameState();

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
  function dragEnterHandler(e: React.DragEvent) {
    e.preventDefault();
  }

  /**
   * Prevents default actions on drag over
   * @param {Event} e Drag over event
   */
  function dragOverHander(e: React.DragEvent) {
    e.preventDefault();
  }

  /**
   * Handler invoked when the card element is dragged
   * @param {DragEvent} dragEvent Drag event
   */
  function dragStartHandler(dragEvent: React.DragEvent<HTMLDivElement>): void {
    // Write the card data to the data transfer property.
    // This will be read when the card is dropped on an appropriate card pile
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.clearData();

    if (dragEvent?.target) {
      let cardElement = dragEvent.target as HTMLDivElement;
      let cardData = cardElement.getAttribute("data-carddata")
      cardData && dragEvent.dataTransfer.setData("cardData", cardData);
    }
  }

  /**
   * Invoked when drawing cards from the draw pile
   */
  function drawCardHandler(e: React.MouseEvent) {
    e.preventDefault();

    // Add the current draw and waste pile information to the Undo queue, so it can be reversed
    const undoPileData: Partial<PlayfieldState> =
    {
      draw: structuredClone(playfieldState.draw),
      waste: structuredClone(playfieldState.waste)
    };

    undoQueue.current.push(undoPileData);

    // Update the draw and waste piles
    const newPlayfieldState: PlayfieldState = structuredClone(playfieldState);

    // If the draw pile is empty, and the waste pile has cards, move the waste pile back to the draw pile
    if (!newPlayfieldState.draw.length && newPlayfieldState.waste.length) {
      // Also set the cards face down
      newPlayfieldState.draw = newPlayfieldState.waste.reverse().map(cardData => { cardData.face = "down"; return cardData; });
      newPlayfieldState.waste = [];
    } else if (newPlayfieldState.draw.length) {
      // Add the last card from the draw pile to the waste pile
      const lastCardData = newPlayfieldState.draw.pop();
      lastCardData && newPlayfieldState.waste.push(lastCardData);
    }

    // Update the playfield
    setPlayfieldState(newPlayfieldState);
  }

  /**
   * Handles clicks on card piles to automatically move cards to new piles
   * @param {Event} e The click event
   */
  function pileClickHandler(e: React.MouseEvent<HTMLDivElement>) {

    const target = e.target as HTMLDivElement;

    if (!target) {
      return;
    }

    // Get the card data from the tapped card
    const tappedCardElement = target.closest(".card");

    if (!tappedCardElement) {
      return;
    }

    const tapppedCardData = JSON.parse(tappedCardElement.getAttribute("data-carddata") || "");

    // TODO: Refactor this to traverse the stack to find the first valid move instead of using only the tapped card
    if (tapppedCardData && tapppedCardData.face === "up") {
      // Check to see if the card can be moved to one of the foundation piles
      let result = playfieldState.foundation.findIndex((foundationCardPileData: CardData[]) => {
        return isValidMove(tapppedCardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : undefined, "foundation");
      })

      if (result !== -1) {
        moveCard(tapppedCardData, "foundation", result);
        return;
      }

      // Check to see if this card can be moved to one of the tableau piles
      result = playfieldState.tableau.findIndex((tableauCardPileData) => {
        return isValidMove(tapppedCardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau");
      })

      if (result !== -1) {
        moveCard(tapppedCardData, "tableau", result);
      }
    }
  }

  /**
   * Renders a card component
   * @param cardData The card data props
   * @param cardIndex The card index
   * @param pileType The pile type
   * @param pileIndex The pile index
   * @returns 
   */
  function renderCard(cardData: CardData, cardIndex: number, pileType: PileTypes, pileIndex?: number) {

    // Cards are only draggable if they are face up
    let draggable = !!(cardData.face === "up");

    // Only the last card on the waste pile should be draggable
    if (pileType == "waste") {
      draggable = cardIndex + 1 === playfieldState.waste.length;
    }

    return (
      <Card
        key={`${cardData.rank}_${cardData.suit}`}
        rank={cardData.rank}
        suit={cardData.suit}
        face={cardData.face}
        pileType={pileType}
        pileIndex={pileIndex}
        cardIndex={cardIndex}
        onDragStart={dragStartHandler}
        draggable={draggable}
        // We only care about offsets in the tableau pile
        offset={pileType == "tableau" ? cardIndex * 3 : 0}
      />
    )
  }

  /**
   * Renders the draw pile of cards
   */
  function renderDrawPile() {
    return (
      <div id="stock">
        <div id="draw" className="card-pile" onClick={drawCardHandler}>
          {playfieldState.draw.map((cardData, cardIndex) => {
            return renderCard(cardData, cardIndex, "draw");
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
      <div id="waste" onClick={pileClickHandler} className={className}>
        {playfieldState.waste.map((cardData, cardIndex) => {
          return renderCard(cardData, cardIndex, "waste");
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
                cardDataList.map((cardData: CardData, cardIndex: number) => {
                  return renderCard(cardData, cardIndex, "foundation", pileIndex);
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
                cardDataList.map((cardData: CardData, cardIndex: number) => {
                  return renderCard(cardData, cardIndex, "tableau", pileIndex);
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
    timerInterval.current = undefined;
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
  function toggleMenu(e: React.MouseEvent) {
    e.preventDefault();

    const target = e.target as HTMLDivElement;

    if (target && (target.id === "play-area" || target.id === "menu")) {
      publish("toggleMenu", true);
    }
  }

  /**
   * Handler for keyboard events
   * @param {Event} e Keyboard event
        */
  function keyDownHandler(e: React.KeyboardEvent) {
    if (!e || !e.key) {
      return;
    }

    // Toggle the menu on Esc or m/M
    if (e.key === "m" || e.key === "M" || e.key === "Esc") {
      publish("toggleMenu", true);
    }
  }

  /**
   * Handler for new game custom event triggers
   */
  function newGameHandler() {

    // Close any open modal
    setModalTypeDisplayed(undefined);

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
    // Close any open modal
    setModalTypeDisplayed(undefined);

    // Re-deal the current deck
    dealDeck();

    // Stop the current timer and reset
    restartTimer();
  }

  /**
   * Handler for exit game custom event triggers
   */
  function exitGameHandler() {
    // Close any open modal
    setModalTypeDisplayed(undefined);

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

    const lastMoveData = redoQueue.current.pop() as Partial<PlayfieldState>;
    const newPlayfieldState: Partial<PlayfieldState> = structuredClone(playfieldState);
    const undoMoveData: Partial<PlayfieldState> = {};

    if (lastMoveData) {
      Object.keys(lastMoveData).forEach(key => {
        // Save the undo data from the current state
        undoMoveData[key as keyof PlayfieldState] = structuredClone(playfieldState[key as keyof PlayfieldState]);

        // Update the new state object with the data from the last move
        newPlayfieldState[key as keyof PlayfieldState] = structuredClone(lastMoveData[key as keyof PlayfieldState]);
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

    const lastMoveData = undoQueue.current.pop() as Partial<PlayfieldState>;
    const newPlayfieldState: Partial<PlayfieldState> = structuredClone(playfieldState);
    const redoMoveData: Partial<PlayfieldState> = {};

    if (lastMoveData) {
      Object.keys(lastMoveData).forEach(key => {
        // Save the redo data from the current state
        redoMoveData[key as keyof PlayfieldState] = structuredClone(playfieldState[key as keyof PlayfieldState]);

        // Update the new state object with the data from the last move
        newPlayfieldState[key as keyof PlayfieldState] = structuredClone(lastMoveData[key as keyof PlayfieldState]);
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
  function dropHandler(e: React.DragEvent, targetPileType: string, targetPileIndex: number) {

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
    const cardDataList = playfieldState[targetPileType as keyof PlayfieldState][targetPileIndex];

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
  function isValidMove(droppedCardData: CardData, targetPileCardData: CardData | undefined, targetPileType: string) {
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
      const cardIndex = droppedCardData.cardIndex as number;
      const pileIndex = droppedCardData.pileIndex as number;
      const pileType = droppedCardData.pileType as keyof PlayfieldState;
      const pileLength = pileIndex >= 0 ? playfieldState[pileType][pileIndex].length : playfieldState[pileType].length;
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
  function moveCard(sourceCardData: CardData, targetPileType: string, targetPileIndex: number) {

    const newPlayfieldState = structuredClone(playfieldState);

    // Remove the card (and any subsequent cards) from the source pile
    const sourcePileType = sourceCardData.pileType as keyof PlayfieldState;
    const sourcePileIndex = sourceCardData.pileIndex as number;
    const sourceCardIndex = sourceCardData.cardIndex as number;

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
    cardsToMove.forEach((cardData: CardData) => cardData.face = "up");

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
    const undoPileData: Partial<PlayfieldState> = {};

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
    const newDeck: CardData[] = [];

    // Create an unshuffled deck of cards.
    const suitsList = Object.keys(suits) as Suits[];
    for (let si = 0; si < suitsList.length; si++) {
      for (let ri = 0; ri < ranks.length; ri++) {
        const card: CardData = { rank: ranks[ri], suit: suitsList[si], face: "down" };
        newDeck.push(card);
      }
    }

    // Shuffle the cards in the deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      // Pick a random card from the deck
      const j = Math.floor(Math.random() * i);

      // Swap the card at the current index with the randomly chosen one
      const temp = newDeck[i];
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
    const tableauCardData = []
    for (let i = 0; i < playfieldState.tableau.length; i++) {
      const cardDataList = [];
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
      setModalTypeDisplayed("gamewin");

      return;
    }

    // Check to see which cards need to be flipped
    // This step is needed so that the card flipping animation has something to transition to (face down => face up)
    let updatePlayfield = false;
    const newPlayfieldState = structuredClone(playfieldState);

    // Flip the last card on each tableau pile
    newPlayfieldState.tableau = playfieldState.tableau.map((cardDataList) => {
      return cardDataList.map((cardData: CardData, cardIndex: number) => {
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