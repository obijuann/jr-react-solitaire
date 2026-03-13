import './card.css';

import { DragEventHandler, useEffect, useState } from 'react';
import usePreferencesStore from "../stores/preferences-store";
import { CardArtworkProperties, CardBacks, CardData, CardFaces } from '../types/card-data';

// Mapping of card face types to image paths and user-friendly labels
export const cardFaceArtwork: Record<CardFaces, CardArtworkProperties> = {
    "english": { label: "English" },
    "french": { label: "French" },
    "simple": { label: "Simple" },
};

// Mapping of card back types to image paths and user-friendly labels
export const cardBackArtwork: Record<CardBacks, CardArtworkProperties> = {
    "abstract_clouds": { label: "Clouds" },
    "abstract_scene": { label: "Landscape" },
    "abstract": { label: "Abstract" },
    "astronaut": { label: "Astronaut" },
    "blue": { label: "Blue" },
    "blue2": { label: "Blue 2" },
    "cars": { label: "Cars" },
    "castle": { label: "Castle" },
    "fish": { label: "Fish" },
    "frog": { label: "Frog" },
    "red": { label: "Red" },
    "red2": { label: "Red 2" }
};

/**
 * Props for the `Card` component. Extends `CardData` with render and
 * interaction helpers.
 */
interface CardComponentProps extends CardData {
  /** Whether the card is draggable. */
  draggable?: boolean
  /** Optional drag-start event handler. */
  onDragStart?: DragEventHandler
  /** Visual vertical offset (in vh) for stacked tableau rendering. */
  offset?: number
  /** Whether the card is currently being animated in a move. */
  isMoving?: boolean
}

/**
 * Render a single playing card. The component renders face/back faces,
 * applies suit/rank classes and supports dragging when `draggable` is true.
 * @param props Card component props
 * @returns JSX.Element
 */
export default function Card(props: CardComponentProps) {

  const cardFace = usePreferencesStore(state => state.cardFace);  
  const cardBack = usePreferencesStore(state => state.cardBack);  
  const cardAnimationEnabled = usePreferencesStore(state => state.cardAnimationEnabled);

  const [currentFace, setCurrentFace] = useState<'up' | 'down'>(props.face);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (!cardAnimationEnabled) {
      setCurrentFace(props.face);
      return;
    }

    if (props.face !== currentFace) {
      setIsFlipping(true);
      setCurrentFace(props.face);
      // Use shorter animation for moving cards to match move duration
      const animationDuration = props.isMoving ? 250 : 500;
      setTimeout(() => setIsFlipping(false), animationDuration);
    }
  }, [props.face, currentFace, cardAnimationEnabled, props.isMoving]);

  const styleOverride: React.CSSProperties = {};
  if (props.offset) {
    styleOverride.top = `${props.offset}vh`;
  }
  if (props.isMoving) {
    styleOverride.position = 'relative';
  }

  let className = "card ";
  if (props.isMoving) {
    className += "moving ";
  }
  if (currentFace === "up") {
    className += `${props.suit} faceup`;
  }
  if (isFlipping) {
    className += " anim";
  }

  return (
    <div
      className={className}
      draggable={props.draggable}
      data-carddata={JSON.stringify({
        cardIndex: props.cardIndex,
        face: props.face,
        pileIndex: props.pileIndex,
        pileType: props.pileType,
        rank: props.rank,
        suit: props.suit
      })}
      data-testid="card"
      onDragStart={props.onDragStart}
      style={styleOverride}
    >
      <div className="card-inner">
        <div className={`back ${cardBack}`} />
        <div className={`face ${cardFace} rank_${props.rank} ${props.suit}`} />
      </div>
    </div>
  );
}
