import "./solitaire.css";

import Grid from "@mui/material/Grid";
import { useEffect, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import Card from "../components/card";
import Menu from "../components/menu";
import Modal from "../components/modal";
import Timer from "../components/timer";
import useGameStore from "../stores/game-store";
import usePreferencesStore from "../stores/preferences-store";
import { CardData } from "../types/card-data";
import { PileTypes } from "../types/pile-types";
import { PlayfieldState } from "../types/playfield-state";
import { Ranks } from "../types/ranks";
import { Suits } from "../types/suits";
import { buildMovingTransforms, cardAnimationCleanupDelayMs, cardAnimationDurationMs, getWasteOffsetPx, getWasteTargetRect, MovingCardAnimation } from "../utils/animation-utils";
import { findAutoCollectCandidate, isValidMove } from "../utils/card-movement-utils";

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
  const playfieldState = useGameStore(state => state.playfield);
  const menuVisible = useGameStore(state => state.menuVisible);
  const modalType = useGameStore(state => state.modalType);
  const lastPlayfieldMutation = useGameStore(state => state.lastPlayfieldMutation);
  const actions = useGameStore(state => ({
    newGame: state.actions.newGame,
    restartGame: state.actions.restartGame,
    quitGame: state.actions.quitGame,
    redo: state.actions.redo,
    undo: state.actions.undo,
    drawCard: state.actions.drawCard,
    moveCard: state.actions.moveCard,
    checkGameState: state.actions.checkGameState
  }), shallow);

  const cardAnimationEnabled = usePreferencesStore(state => state.cardAnimationEnabled);
  const autoCollectEnabled = usePreferencesStore(state => state.autoCollectEnabled);
  const [movingCards, setMovingCards] = useState<MovingCardAnimation[]>([]);
  const [movingTransforms, setMovingTransforms] = useState<{ [key: number]: { x: number, y: number } }>({});
  const [movingFaces, setMovingFaces] = useState<{ [key: number]: "up" | "down" }>({});

  const stockRef = useRef<HTMLDivElement>(null);
  const wasteRef = useRef<HTMLDivElement>(null);
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * Cached reference to the last playfield observed by the combined effect.
   * Lets the effect distinguish a playfieldState change from a movingCards change.
   */
  const prevPlayfieldRef = useRef<PlayfieldState>(playfieldState);
  /**
   * True while an auto-collect pass is actively moving cards. Used to block
   * tap, drag-start, and drop interactions so they cannot interrupt the pass.
   */
  const autoCollectingRef = useRef<boolean>(false);
  /**
   * When true, the next playfield change skips one auto-collect pass.
   * Set only for user-initiated foundation -> tableau moves.
   */
  const skipAutoCollectNextTurnRef = useRef<boolean>(false);

  useEffect(() => {
    /**
     * Handle global keyboard shortcuts for menu/submenu visibility.
     * @param e Keyboard event from the window listener.
     */
    function globalKeyHandler(e: KeyboardEvent) {
      if (!e || !e.key) return;

      const store = useGameStore.getState();

      if (e.key === "Escape") {
        // Escape closes submenu first; if none is open, it toggles the main menu.
        if (store.submenuId) {
          store.actions.clearSubmenu();
          return;
        }
        useGameStore.getState().actions.toggleMenu();
      }
    }

    window.addEventListener("keydown", globalKeyHandler);
    return () => window.removeEventListener("keydown", globalKeyHandler);
  }, []);

  useEffect(() => {
    // Skip auto-collect only when this playfield transition came from
    // history traversal (undo/redo).
    const playfieldChanged = playfieldState !== prevPlayfieldRef.current;
    prevPlayfieldRef.current = playfieldState;

    if (playfieldChanged) {
      if (lastPlayfieldMutation === "undo" || lastPlayfieldMutation === "redo") {
        autoCollectingRef.current = false;
        return;
      }
    }

    runAutoCollect();
  }, [playfieldState, movingCards, lastPlayfieldMutation]);

  /**
   * Resolve a pile container reference used when calculating animation targets.
   * @param pileType Destination pile type.
   * @param pileIndex Destination pile index.
   * @returns Matching pile element, if mounted.
   */
  function getRefForPile(pileType: string, pileIndex: number): HTMLDivElement | null {
    if (pileType === "stock") return stockRef.current;
    if (pileType === "waste") return wasteRef.current;
    if (pileType === "foundation") return foundationRefs.current[pileIndex];
    if (pileType === "tableau") return tableauRefs.current[pileIndex];
    return null;
  }

  /**
   * Schedule the overlay-based animation lifecycle, including initial render,
   * transform update, optional mid-flight face change, state commit, and cleanup.
   * @param nextMovingCards Cards to animate in the overlay layer.
   * @param initialFaces Initial face values for the moving cards.
   * @param onComplete Callback invoked after the animation duration completes.
   * @param flippedFaces Optional face overrides to apply at flip time.
   */
  function runOverlayAnimation(
    nextMovingCards: MovingCardAnimation[],
    initialFaces: { [key: number]: "up" | "down" },
    onComplete: () => void,
    flippedFaces?: { [key: number]: "up" | "down" },
  ) {
    const initialTransforms = Object.fromEntries(nextMovingCards.map((_, index) => [index, { x: 0, y: 0 }])) as { [key: number]: { x: number, y: number } };

    setMovingCards(nextMovingCards);
    setMovingTransforms(initialTransforms);
    setMovingFaces(initialFaces);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMovingTransforms(buildMovingTransforms(nextMovingCards));
      });
    });

    if (flippedFaces) {
      setTimeout(() => {
        setMovingFaces(flippedFaces);
      }, 0);
    }

    setTimeout(() => {
      onComplete();
    }, cardAnimationDurationMs);

    setTimeout(() => {
      setMovingCards([]);
      setMovingTransforms({});
      setMovingFaces({});
    }, cardAnimationCleanupDelayMs);
  }

  /**
   * Animate drawing the top stock card into waste, including a mid-flight flip.
   * Falls back to a direct draw when animation prerequisites are unavailable.
   */
  function animatedDrawCard() {
    // Skip animation entirely when the user has disabled card animations.
    if (!cardAnimationEnabled) {
      actions.drawCard();
      return;
    }

    // Prevent overlapping animations — only one move overlay can run at a time.
    if (movingCards.length) {
      return;
    }

    const playfield = playfieldState;

    // Both piles empty means there is nothing to draw or recycle.
    if (!playfield.draw.length && !playfield.waste.length) return;

    // Recycling: draw pile is exhausted but waste cards remain. Flip the waste
    // back into the draw pile. No animation is played for this case.
    if (!playfield.draw.length && playfield.waste.length) {
      actions.drawCard();
      return;
    }

    // Identify the top card of the draw pile — the one that will be animated.
    const cardToMove = playfield.draw[playfield.draw.length - 1];
    if (!cardToMove) return;

    // Resolve the draw pile DOM element so we can measure the card's position.
    const drawElement = document.getElementById("draw");
    if (!drawElement) {
      // DOM element missing; fall back to an instant (non-animated) draw.
      actions.drawCard();
      return;
    }

    // The topmost rendered card inside the draw pile is the one being animated.
    // querySelectorAll returns elements in DOM order, so the last item is on top.
    const cardElements = drawElement.querySelectorAll(".card");
    const topCardElement = cardElements[cardElements.length - 1] as HTMLElement;
    if (!topCardElement) {
      actions.drawCard();
      return;
    }

    // Capture the card's current screen position as the animation start rect.
    const fromRect = topCardElement.getBoundingClientRect();

    // Resolve the waste pile DOM element needed to compute the landing position.
    const wasteElement = wasteRef.current;
    if (!wasteElement) {
      actions.drawCard();
      return;
    }

    // The card will land at the position it would occupy after the draw commits.
    // The waste pile staggers up to three visible cards via CSS custom-property
    // offsets, so we must account for those offsets to land in the right spot.
    const futureWasteCount = playfield.waste.length + 1;
    const wasteStyles = getComputedStyle(wasteElement);
    const offsetOnePx = getWasteOffsetPx(wasteStyles, window.innerWidth, 1);
    const offsetTwoPx = getWasteOffsetPx(wasteStyles, window.innerWidth, 2);
    const toRect = getWasteTargetRect(
      wasteElement.getBoundingClientRect(),
      futureWasteCount,
      offsetOnePx,
      offsetTwoPx,
    );

    // Build the overlay animation descriptor. The card starts face-down and
    // flips to face-up mid-flight via the flippedFaces argument below.
    const movingCard = { card: cardToMove, fromRect, toRect, startTime: Date.now(), targetFace: "up" as const };
    const initialFaces = { 0: cardToMove.face };
    runOverlayAnimation(
      [movingCard],
      initialFaces,
      // Commit the game-state draw only after the animation duration elapses,
      // so the real card appears in the waste pile exactly as the overlay lands.
      () => {
        actions.drawCard();
      },
      // Flip the overlay card to face-up immediately (before the translate move
      // begins) so the flip and slide animations play simultaneously.
      { 0: "up" },
    );
  }

  /**
   * Animate moving card(s) from a source pile to a destination pile by rendering
   * overlay cards, then committing the move once the transition completes.
   * @param sourceCardData Metadata for the primary card being moved.
   * @param targetPileType Destination pile type.
   * @param targetPileIndex Destination pile index.
   * @param sourcePileType Optional source pile type override.
   * @param sourcePileIndex Optional source pile index override.
   * @param sourceCardIndex Optional source-card index override.
   * @param sourceElement Optional source card element to reuse for bounds.
   * @param isManualMove Optional flag indicating if this is a user-initiated move (true) or auto-collect (false/undefined).
   */
  function animatedMoveCard(sourceCardData: CardData, targetPileType: PileTypes, targetPileIndex: number, sourcePileType = sourceCardData.pileType as PileTypes, sourcePileIndex = sourceCardData.pileIndex || 0, sourceCardIndex = sourceCardData.cardIndex || 0, sourceElement?: HTMLElement, isManualMove = false) {
    if (isManualMove && sourcePileType === "foundation" && targetPileType === "tableau") {
      skipAutoCollectNextTurnRef.current = true;
    }

    if (!cardAnimationEnabled) {
      actions.moveCard(sourceCardData, targetPileType, targetPileIndex, sourcePileType, sourcePileIndex, sourceCardIndex);
      return;
    }

    if (movingCards.length) {
      return;
    }

    const newPlayfield = structuredClone(playfieldState);
    let cardsToMove: CardData[] = [];

    switch (sourcePileType) {
      case "foundation":
      case "tableau":
        cardsToMove = newPlayfield[sourcePileType][sourcePileIndex].slice(sourceCardIndex);
        break;
      case "waste":
        cardsToMove = newPlayfield.waste.slice(sourceCardIndex);
        break;
      default:
        return;
    }

    // Calculate target positions BEFORE the state update
    const toElement = getRefForPile(targetPileType, targetPileIndex);
    if (!toElement) {
      setMovingCards([]);
      return;
    }
    const baseToRect = toElement.getBoundingClientRect();

    // Calculate target position for each moving card
    const targetPileLength = playfieldState[targetPileType as keyof PlayfieldState][targetPileIndex].length;
    const startTime = Date.now();
    const movingWithTo = cardsToMove.map((card, moveIndex) => {
      let toRect = baseToRect;

      // Adjust for card offset in tableau piles
      if (targetPileType === "tableau") {
        const finalCardIndex = targetPileLength + moveIndex;
        const offsetVh = finalCardIndex * 3; // 3vh per card
        // Convert vh to pixels (1vh = 1% of viewport height)
        const offsetPx = (offsetVh / 100) * window.innerHeight;
        toRect = new DOMRect(toRect.left, toRect.top + offsetPx, toRect.width, toRect.height);
      }

      // Use the passed element if available, otherwise find it
      let cardElement = sourceElement;
      if (!cardElement || moveIndex > 0) {
        // Construct the expected data object for the card
        const expectedData = {
          cardIndex: sourcePileType === "tableau" || sourcePileType === "foundation" ? sourceCardIndex + moveIndex : moveIndex,
          face: card.face,
          pileIndex: sourcePileType === "waste" ? undefined : sourcePileIndex,
          pileType: sourcePileType,
          rank: card.rank,
          suit: card.suit
        };
        cardElement = document.querySelector(`[data-carddata='${JSON.stringify(expectedData)}']`) as HTMLElement;
      }
      if (!cardElement) return null;
      const fromRect = cardElement.getBoundingClientRect();

      return { card, fromRect, toRect, startTime };
    }).filter(Boolean) as { card: CardData, fromRect: DOMRect, toRect: DOMRect, startTime: number }[];
    runOverlayAnimation(
      movingWithTo,
      Object.fromEntries(movingWithTo.map((moving, index) => [index, moving.card.face])) as { [key: number]: "up" | "down" },
      () => {
        actions.moveCard(sourceCardData, targetPileType, targetPileIndex, sourcePileType, sourcePileIndex, sourceCardIndex);
      },
    );
  }

  /**
   * Hide menu visibility when clicking on the play area or menu.
   */
  function hideMenu(e: React.MouseEvent) {
    // Prevent the click from triggering default browser behavior.
    e.preventDefault();

    const target = e.target as HTMLElement;
    const submenuId = useGameStore.getState().submenuId;

    // If click originated inside the menu, do not clear the submenu here —
    // Let the menu's own handlers manage it.
    const clickedInsideMenu = target?.closest && target.closest("#menu");

    if (submenuId && !clickedInsideMenu) {
      // Clicking outside menu while submenu is open only closes the submenu layer.
      useGameStore.getState().actions.clearSubmenu();
      return;
    }

    // Clicking the play area should only hide menus
    if (target && target.id === "play-area") {
      // `toggleMenu(true)` forces menu/submenu hide without toggling based on current state.
      useGameStore.getState().actions.toggleMenu(true);
    }
  }

  /**
   * Perform one step of the continuous auto-collect pass.
   *
   * When auto-collect is enabled and a safe foundation candidate is available,
   * the card is animated to its destination foundation pile. The pass continues
   * automatically on the next state change triggered by the committed move.
   *
   * The function exits early when:
   *  - The auto-collect preference is disabled.
   *  - A card animation overlay is already in progress (prevents overlapping).
   *  - No candidate qualifies according to the safety rules in the spec.
   */
  function runAutoCollect() {
    if (!autoCollectEnabled) {
      autoCollectingRef.current = false;
      return;
    }

    // Wait for any in-progress animation overlay to complete before starting
    // the next move. The effect will re-run once movingCards is cleared.
    if (movingCards.length > 0) return;

    // Skip exactly one eligible auto-collect turn after a user moves a card
    // from foundation to tableau.
    if (skipAutoCollectNextTurnRef.current) {
      skipAutoCollectNextTurnRef.current = false;
      autoCollectingRef.current = false;
      return;
    }

    const candidate = findAutoCollectCandidate(playfieldState, ranks, suitsToColorsMap);

    if (!candidate) {
      autoCollectingRef.current = false;
      return;
    }

    autoCollectingRef.current = true;

    // Resolve the source DOM element so the animation can measure a precise
    // starting rect. Passing it explicitly avoids a fragile data-carddata
    // attribute lookup that can fail for multi-card waste piles.
    let sourceElement: HTMLElement | undefined;
    if (candidate.sourceType === "waste") {
      const wasteCards = wasteRef.current?.querySelectorAll(".card");
      sourceElement = wasteCards?.length
        ? (wasteCards[wasteCards.length - 1] as HTMLElement)
        : undefined;
    } else {
      const tableauPile = tableauRefs.current[candidate.sourcePileIndex];
      const tableauCards = tableauPile?.querySelectorAll(".card");
      sourceElement = tableauCards?.length
        ? (tableauCards[tableauCards.length - 1] as HTMLElement)
        : undefined;
    }

    animatedMoveCard(
      candidate.card,
      "foundation",
      candidate.targetFoundationIndex,
      candidate.sourceType,
      candidate.sourcePileIndex,
      candidate.sourceCardIndex,
      sourceElement,
    );
  }

  /**
   * Prevents default actions on drag enter
   * @param {Event} e Drag enter event
   */
  function dragEnterHandler(e: React.DragEvent) {
    // Allow drop targets to accept dragged cards.
    e.preventDefault();
  }

  /**
   * Prevents default actions on drag over
   * @param {Event} e Drag over event
   */
  function dragOverHander(e: React.DragEvent) {
    // Keep default browser drag-over behavior from blocking drops.
    e.preventDefault();
  }

  /**
   * Handle the start of a drag operation on a card element.
   * Serializes the card's `data-carddata` attribute onto the drag dataTransfer
   * so drop targets can parse and use it.
   * @param dragEvent The drag event from the DOM
   */
  function dragStartHandler(dragEvent: React.DragEvent<HTMLDivElement>): void {
    // Block drag starts while auto-collect is running to prevent conflicts.
    if (autoCollectingRef.current) return;
    // Restrict drag intent to move operations and clear stale payload.
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.clearData();

    if (dragEvent?.target) {
      const cardElement = dragEvent.target as HTMLDivElement;
      const cardData = cardElement.getAttribute("data-carddata");
      if (cardData) {
        // Persist serialized card metadata so drop targets can validate/move it.
        dragEvent.dataTransfer.setData("cardData", cardData);
      }
    }
  }

  /**
   * Handle clicking the draw pile — triggers animated card draw.
   * @param e Mouse event from the click
   */
  function drawCardHandler(e: React.MouseEvent) {
    // Block draw-pile clicks while auto-collect is in progress.
    if (autoCollectingRef.current) return;
    // Prevent click bubbling/default behavior and route through draw animation flow.
    e.preventDefault();
    animatedDrawCard();
  }

  /**
   * Handle clicks on piles (tableau, foundation, waste). Determines the
   * clicked card and attempts an automatic move according to game rules.
   * @param e Mouse event coming from the pile container
   */
  function pileClickHandler(e: React.MouseEvent<HTMLDivElement>) {
    // Block pile taps while auto-collect is running to prevent conflicts.
    if (autoCollectingRef.current) return;
    const target = e.target as HTMLDivElement;
    if (!target) return;

    // Resolve the nearest card from wherever inside the pile the user clicked.
    const tappedCardElement = target.closest(".card");
    // Ignore clicks that are not on a playable card.
    if (!tappedCardElement || tappedCardElement.getAttribute("draggable") === "false" || !tappedCardElement.hasAttribute("data-carddata")) return;

    // Card metadata is stored on the element and drives all rule checks below.
    const tapppedCardData = JSON.parse(tappedCardElement.getAttribute("data-carddata") || "");
    if (!tapppedCardData) return;

    // First priority: try to auto-move the tapped card to a valid foundation pile.
    let targetPileIndex = playfieldState.foundation.findIndex((foundationCardPileData: CardData[]) => {
      return isValidMove(tapppedCardData, foundationCardPileData.length ? foundationCardPileData.slice(-1)[0] : undefined, "foundation", playfieldState, ranks, suitsToColorsMap);
    })

    if (targetPileIndex !== -1) {
      // Found a legal foundation destination, so perform that move immediately.
      animatedMoveCard(tapppedCardData, "foundation", targetPileIndex, undefined, undefined, undefined, tappedCardElement as HTMLElement, true);
      return;
    }

    let sourceCardIndex = -1;
    if (tapppedCardData.pileType === "tableau") {
      // Tableau tap behavior:
      // Try moving the tapped run first (tapped card through top). If that run
      // is blocked, try longer runs by including cards below the tap point,
      // then try shorter runs from cards above the tap point.
      const sourcePileIndex = tapppedCardData.pileIndex;
      const tappedIndex = tapppedCardData.cardIndex;
      const sourcePile = playfieldState.tableau[sourcePileIndex];
      const candidateSourceIndices: number[] = [tappedIndex];

      for (let lowerIndex = tappedIndex - 1; lowerIndex >= 0; lowerIndex--) {
        candidateSourceIndices.push(lowerIndex);
      }

      for (let higherIndex = tappedIndex + 1; higherIndex < sourcePile.length; higherIndex++) {
        candidateSourceIndices.push(higherIndex);
      }

      for (const candidateSourceIndex of candidateSourceIndices) {
        const candidateCard = sourcePile[candidateSourceIndex];
        if (!candidateCard || candidateCard.face !== "up") {
          continue;
        }

        const runIsFaceUp = sourcePile.slice(candidateSourceIndex).every((cardData: CardData) => cardData.face === "up");
        if (!runIsFaceUp) {
          continue;
        }

        targetPileIndex = playfieldState.tableau.findIndex((tableauCardPileDataList, tableauCardPileIndex) => {
          if (sourcePileIndex === tableauCardPileIndex) {
            return false;
          }

          const potentialTargetCardData = tableauCardPileDataList.length
            ? tableauCardPileDataList[tableauCardPileDataList.length - 1]
            : undefined;

          return isValidMove(candidateCard, potentialTargetCardData, "tableau", playfieldState, ranks, suitsToColorsMap);
        });

        if (targetPileIndex >= 0) {
          sourceCardIndex = candidateSourceIndex;
          break;
        }
      }

      if (targetPileIndex >= 0 && sourceCardIndex >= 0) {
        // Move the selected run using the first successful candidate source index.
        const cardToMove: CardData = playfieldState["tableau"][sourcePileIndex][sourceCardIndex];
        animatedMoveCard(cardToMove, "tableau", targetPileIndex, tapppedCardData.pileType, sourcePileIndex, sourceCardIndex, undefined, true);
      }
    } else {
      // Non-tableau tap behavior (usually waste/foundation):
      // only the tapped card is considered, and we search for a legal tableau destination.
      targetPileIndex = playfieldState.tableau.findIndex((tableauCardPileData) => {
        return isValidMove(tapppedCardData, tableauCardPileData.length ? tableauCardPileData.slice(-1)[0] : null, "tableau", playfieldState, ranks, suitsToColorsMap);
      })

      if (targetPileIndex !== -1) {
        // Move the selected card to the first valid tableau target found.
        animatedMoveCard(tapppedCardData, "tableau", targetPileIndex, undefined, undefined, undefined, tappedCardElement as HTMLElement, true);
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
    // Block drops while auto-collect is running to prevent conflicts.
    if (autoCollectingRef.current) return;
    if (!e || !e.dataTransfer || !e.target || !targetPileType) return;

    // Recover the dragged card payload placed by dragStartHandler.
    const droppedCardDataString = e.dataTransfer.getData("cardData");
    const droppedCardData = droppedCardDataString ? JSON.parse(droppedCardDataString) as CardData : null;
    if (!droppedCardData || !droppedCardData.suit || !droppedCardData.rank) return;

    let targetCardData: CardData | undefined = undefined;
    const cardDataList = playfieldState[targetPileType as keyof PlayfieldState][targetPileIndex];

    // For non-empty piles, validate against the current top card only.
    if (cardDataList && cardDataList.length) targetCardData = cardDataList.slice(-1)[0];

    if (targetPileType == "tableau" && droppedCardData.pileType === "tableau" && droppedCardData.pileIndex !== undefined) {
      // Tableau-to-tableau drops can move a run, so find the deepest valid source card.
      const validMoveCardIndex = playfieldState["tableau"][droppedCardData.pileIndex].findLastIndex((cardData: CardData) => {
        return cardData.face === "up" && isValidMove(cardData, targetCardData, targetPileType, playfieldState, ranks, suitsToColorsMap)
      });

      if (validMoveCardIndex >= 0) {
        // Move the selected run from source tableau to target tableau.
        const cardToMove: CardData = playfieldState["tableau"][droppedCardData.pileIndex][validMoveCardIndex];
        actions.moveCard(cardToMove, targetPileType as PileTypes, targetPileIndex, droppedCardData.pileType, droppedCardData.pileIndex, validMoveCardIndex);
      }
    } else {
      // All other drops are single-card moves gated by isValidMove.
      if (isValidMove(droppedCardData, targetCardData, targetPileType, playfieldState, ranks, suitsToColorsMap)) {
        if (droppedCardData.pileType === "foundation" && targetPileType === "tableau") {
          skipAutoCollectNextTurnRef.current = true;
        }
        actions.moveCard(droppedCardData, targetPileType as PileTypes, targetPileIndex);
      }
    }
  }

  /**
   * Render a single `Card` component with the appropriate props.
   * @returns JSX.Element for the card
   */
  function renderCard(cardData: CardData, cardIndex: number, pileType: PileTypes, pileIndex?: number) {
    if (movingCards.some((m: { card: CardData, fromRect: DOMRect, toRect: DOMRect }) => m.card.rank === cardData.rank && m.card.suit === cardData.suit)) {
      return null;
    }

    let draggable = !!(cardData.face === "up");

    if (pileType == "waste") {
      draggable = cardIndex + 1 === playfieldState.waste.length;
    }

    return (
      <Card
        key={`${cardData.rank ?? "x"}_${cardData.suit ?? "x"}_${pileType}_${pileIndex ?? 0}_${cardIndex}`}
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
      <div id="stock" ref={stockRef}>
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

    if (cardAnimationEnabled) {
      className += " anim";
    }

    return (
      <div id="waste" ref={wasteRef} onClick={pileClickHandler} className={className}>
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
              ref={(el) => { foundationRefs.current[pileIndex] = el; }}
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
              ref={(el) => { tableauRefs.current[pileIndex] = el; }}
              onClick={pileClickHandler}
              onDragEnter={dragEnterHandler}
              onDragOver={dragOverHander}
              onDrop={(event) => dropHandler(event, "tableau", pileIndex)}
            >
              {cardDataList.map((cardData: CardData, cardIndex: number) => {
                return renderCard(cardData, cardIndex, "tableau", pileIndex);
              })}
            </div>
          )
        })}
      </div>
    );
  }

  /** Conditionally render a `Modal` when `modalType is present */
  function renderModal() {
    if (!modalType) return;

    return (
      <Modal />
    );
  }

  return (
    <div id="solitaire">
      <Grid
        container
        id="play-area"
        className={menuVisible ? "menu-open" : ""}
        data-testid="play-area"
        onClick={hideMenu}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "var(--card-height) 1fr",
          rowGap: "30px"
        }}
      >
        <Grid sx={{ gridColumn: "1 / 2", gridRow: "1 / 2", display: "flex", justifyContent: "center" }}>
          {renderDrawPile()}
        </Grid>
        <Grid sx={{ gridColumn: "2 / 4", gridRow: "1 / 2" }}>
          {renderWastePile()}
        </Grid>
        <Grid sx={{ gridColumn: "4 / 8", gridRow: "1 / 2" }}>
          {renderFoundation()}
        </Grid>
        <Grid sx={{ gridColumn: "1 / 8", gridRow: "2 / 3" }}>
          {renderTableau()}
        </Grid>
      </Grid>
      {movingCards.map((moving: { card: CardData, fromRect: DOMRect, toRect: DOMRect, startTime: number }, index: number) => {
        const transform = movingTransforms[index] || { x: 0, y: 0 };
        const face = movingFaces[index] !== undefined ? movingFaces[index] : moving.card.face;

        return (
          <div
            key={`moving-${index}`}
            style={{
              position: "absolute",
              top: moving.fromRect.top,
              left: moving.fromRect.left,
              width: moving.fromRect.width,
              height: moving.fromRect.height,
              transform: `translate(${transform.x}px, ${transform.y}px)`,
              transition: "transform 0.25s ease-out",
              zIndex: 1000,
              pointerEvents: "none"
            }}
          >
            <Card
              rank={moving.card.rank}
              suit={moving.card.suit}
              face={face}
              pileType={moving.card.pileType}
              pileIndex={moving.card.pileIndex}
              cardIndex={moving.card.cardIndex}
              isMoving={true}
            />
          </div>
        );
      })}
      <div id="menu-area" data-testid="menu-area" >
        <Timer />
        <Menu />
        {renderModal()}
      </div>
    </div>
  );
}
