import "./solitaire.css";

import { useEffect } from 'react';
import Card from "../components/card";
import Menu from "../components/menu";
import Modal from "../components/modal";
import Timer from "../components/timer";
import useStore from '../stores/store';
import { CardData } from "../types/card-data";
import { PileTypes } from "../types/pile-types";
import { PlayfieldState } from "../types/playfield-state";
import { Ranks } from "../types/ranks";
import { Suits } from "../types/suits";

/** Mapping of suit name to display color used for game logic. */
const suitsToColorsMap: Partial<Record<Suits, string>> = {
  "clubs": "black",
  "diamonds": "red",
  "hearts": "red",
  "spades": "black"
};

const ranks: Ranks[] = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

/**
 * Main Solitaire component. Renders the play area, piles, menu and modal,
 * and wires up global keyboard handlers and playfield interactions.
 * @returns JSX.Element
 */
export default function Solitaire() {
  const playfieldState = useStore(state => state.playfield);
  const modalTypeDisplayed = useStore(state => state.modalType);
  const submenuIdDisplayed = useStore(state => state.submenuId);
  const gameActive = useStore(state => !!state.shuffledDeck.length);
  const undoAvailable = useStore(state => !!state.undoQueue.length);
  const redoAvailable = useStore(state => !!state.redoQueue.length);
  const actions = useStore(state => ({
    newGame: state.newGame,
    restartGame: state.restartGame,
    quitGame: state.quitGame,
    redo: state.redo,
    undo: state.undo,
    drawCard: state.drawCard,
    moveCard: state.moveCard,
    checkGameState: state.checkGameState
  }));

  // Global keyboard handler to toggle menus with 'Esc'
  useEffect(() => {
    function globalKeyHandler(e: KeyboardEvent) {
      if (!e || !e.key) return;

      const store = useStore.getState();

      if (e.key === 'Escape') {
        if (store.submenuId) {
          store.clearSubmenu();
          return;
        }
        useStore.getState().toggleMenu();
      }
    }

    window.addEventListener('keydown', globalKeyHandler);
    return () => window.removeEventListener('keydown', globalKeyHandler);
  }, []);

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
   * Handle the start of a drag operation on a card element.
   * Serializes the card's `data-carddata` attribute onto the drag dataTransfer
   * so drop targets can parse and use it.
   * @param dragEvent The drag event from the DOM
   */
  function dragStartHandler(dragEvent: React.DragEvent<HTMLDivElement>): void {
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.clearData();

    if (dragEvent?.target) {
      const cardElement = dragEvent.target as HTMLDivElement;
      const cardData = cardElement.getAttribute("data-carddata")
      cardData && dragEvent.dataTransfer.setData("cardData", cardData);
    }
  }

  /**
   * Handle clicking the draw pile — prevents the default action and calls
   * the store action to draw a card.
   * @param e Mouse event from the click
   */
  function drawCardHandler(e: React.MouseEvent) {
    e.preventDefault();
    actions.drawCard();
  }

  /**
   * Handle clicks on piles (tableau, foundation, waste). Determines the
   * clicked card and attempts an automatic move according to game rules.
   * @param e Mouse event coming from the pile container
   */
  function pileClickHandler(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLDivElement;
    if (!target) return;

    const tappedCardElement = target.closest(".card");
    if (!tappedCardElement || tappedCardElement.getAttribute("draggable") === "false" || !tappedCardElement.hasAttribute("data-carddata")) return;

    const tapppedCardData = JSON.parse(tappedCardElement.getAttribute("data-carddata") || "");
    if (!tapppedCardData) return;

    let targetPileIndex = playfieldState.foundation.findIndex((foundationCardPileData: CardData[]) => {
      return isValidMove(tapppedCardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : undefined, "foundation");
    })

    if (targetPileIndex !== -1) {
      actions.moveCard(tapppedCardData, "foundation", targetPileIndex);
      return;
    }

    let sourceCardIndex = -1;
    if (tapppedCardData.pileType === "tableau") {
      targetPileIndex = playfieldState.tableau.findIndex((tableauCardPileDataList, tableauCardPileIndex) => {
        if (tapppedCardData.pileIndex === tableauCardPileIndex) return;

        let potentialTargetCardData: CardData | undefined = undefined;
        if (tableauCardPileDataList && tableauCardPileDataList.length) potentialTargetCardData = tableauCardPileDataList.slice(-1)[0];

        sourceCardIndex = playfieldState["tableau"][tapppedCardData.pileIndex].findLastIndex((cardData: CardData) => {
          return cardData.face === "up" && isValidMove(cardData, potentialTargetCardData, "tableau")
        });

        if (sourceCardIndex >= 0) return true;
      })

      if (targetPileIndex >= 0 && sourceCardIndex >= 0) {
        const cardToMove: CardData = playfieldState["tableau"][tapppedCardData.pileIndex][sourceCardIndex];
        actions.moveCard(cardToMove, "tableau", targetPileIndex, tapppedCardData.pileType, tapppedCardData.pileIndex, sourceCardIndex);
      }
    } else {
      targetPileIndex = playfieldState.tableau.findIndex((tableauCardPileData) => {
        return isValidMove(tapppedCardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau");
      })

      if (targetPileIndex !== -1) {
        actions.moveCard(tapppedCardData, "tableau", targetPileIndex);
      }
    }
  }

  /**
   * Handle dropping a dragged card onto a target pile. The dropped card data
   * is read from `dataTransfer` and validated with `isValidMove` before
   * dispatching `moveCard` on the store.
   * @param e Drag event from the drop
   * @param targetPileType The pile type being dropped onto ('tableau'|'foundation'|'waste')
   * @param targetPileIndex The index of the target pile
   */
  function dropHandler(e: React.DragEvent, targetPileType: string, targetPileIndex: number) {
    if (!e || !e.dataTransfer || !e.target || !targetPileType) return;

    const droppedCardDataString = e.dataTransfer.getData("cardData");
    const droppedCardData = droppedCardDataString ? JSON.parse(droppedCardDataString) as CardData : null;
    if (!droppedCardData || !droppedCardData.suit || !droppedCardData.rank) return;

    let targetCardData: CardData | undefined = undefined;
    const cardDataList = playfieldState[targetPileType as keyof PlayfieldState][targetPileIndex];

    if (cardDataList && cardDataList.length) targetCardData = cardDataList.slice(-1)[0];

    if (targetPileType == "tableau" && droppedCardData.pileType === "tableau" && !!droppedCardData.pileIndex) {
      const validMoveCardIndex = playfieldState["tableau"][droppedCardData.pileIndex].findLastIndex((cardData: CardData) => {
        return cardData.face === "up" && isValidMove(cardData, targetCardData, targetPileType)
      });

      if (validMoveCardIndex >= 0) {
        const cardToMove: CardData = playfieldState["tableau"][droppedCardData.pileIndex][validMoveCardIndex];
        actions.moveCard(cardToMove, targetPileType as PileTypes, targetPileIndex, droppedCardData.pileType, droppedCardData.pileIndex, validMoveCardIndex);
      }
    } else {
      if (isValidMove(droppedCardData, targetCardData, targetPileType)) {
        actions.moveCard(droppedCardData, targetPileType as PileTypes, targetPileIndex);
      }
    }
  }

  /**
   * Render a single `Card` component with the appropriate props.
   * @returns JSX.Element for the card
   */
  function renderCard(cardData: CardData, cardIndex: number, pileType: PileTypes, pileIndex?: number) {
    let draggable = !!(cardData.face === "up");

    if (pileType == "waste") {
      draggable = cardIndex + 1 === playfieldState.waste.length;
    }

    return (
      <Card
        key={`${cardData.rank ?? 'x'}_${cardData.suit ?? 'x'}_${pileType}_${pileIndex ?? 0}_${cardIndex}`}
        rank={cardData.rank}
        suit={cardData.suit}
        face={cardData.face}
        pileType={pileType}
        pileIndex={pileIndex}
        cardIndex={cardIndex}
        onDragStart={dragStartHandler}
        draggable={draggable}
        offset={pileType == "tableau" ? cardIndex * 3 : 0}
      />
    )
  }

  /** Render the draw pile container */
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

  /** Render the waste (talon) pile; adjusts classNames based on count */
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

  /** Render the four foundation piles */
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

  /** Render the seven tableau piles */
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

  /** Conditionally render a `Modal` when `modalTypeDisplayed` is present */
  function renderModal() {
    if (!modalTypeDisplayed) return;

    return (
      <Modal
        modalType={modalTypeDisplayed}
      />
    );
  }

  /**
   * Toggle the global menu visibility when clicking on the play area or menu.
   * Delegates to the store `toggleMenu` action.
   */
  function toggleMenu(e: React.MouseEvent) {
    e.preventDefault();

    const target = e.target as HTMLDivElement;
    const store = useStore.getState();

    // If click originated inside the menu, do not clear the submenu here —
    // Let the menu's own handlers manage it.
    const clickedInsideMenu = (e.target as HTMLElement)?.closest && (e.target as HTMLElement).closest('#menu');

    if (store.submenuId && !clickedInsideMenu) {
      store.clearSubmenu();
      return;
    }

    if (target && (target.id === "play-area" || target.id === "menu")) {
      useStore.getState().toggleMenu();
    }
  }

  /**
   * Validate whether the dropped card can be placed onto the target pile
   * according to simple Solitaire rules for tableau and foundation.
   */
  function isValidMove(droppedCardData: CardData, targetPileCardData: CardData | undefined, targetPileType: string) {
    if (!targetPileCardData && !droppedCardData) {
      return false;
    }

    const pileCardDataRankIndex = targetPileCardData ? ranks.indexOf(targetPileCardData.rank) : - 1;
    const droppedCardDataRankIndex = ranks.indexOf(droppedCardData.rank);

    if (targetPileType === "tableau") {
      if (!targetPileCardData && droppedCardData.rank === "king") {
        return true;
      }

      if (targetPileCardData && suitsToColorsMap[targetPileCardData.suit] !== suitsToColorsMap[droppedCardData.suit] && droppedCardDataRankIndex + 1 === pileCardDataRankIndex) {
        return true;
      }

    } else if (targetPileType === "foundation") {

      const cardIndex = droppedCardData.cardIndex as number;
      const pileIndex = droppedCardData.pileIndex as number;
      const pileType = droppedCardData.pileType as keyof PlayfieldState;
      const pileLength = pileIndex >= 0 ? playfieldState[pileType][pileIndex].length : playfieldState[pileType].length;
      if (pileLength - 1 !== cardIndex) {
        return false;
      }

      if (!targetPileCardData && droppedCardData.rank === "ace") {
        return true;
      }

      if (targetPileCardData && targetPileCardData.suit === droppedCardData.suit && droppedCardDataRankIndex - 1 === pileCardDataRankIndex) {
        return true;
      }
    }

    return false;
  }

  return (
    <div id="play-area" data-testid="play-area" onClick={toggleMenu} className={submenuIdDisplayed ? 'submenu-open' : ''}>
      {renderDrawPile()}
      {renderWastePile()}
      {renderFoundation()}
      {renderTableau()}
      <Menu
        gameActive={gameActive}
        undoAvailable={undoAvailable}
        redoAvailable={redoAvailable}
      />
      <Timer />
      {renderModal()}
    </div>
  );
}