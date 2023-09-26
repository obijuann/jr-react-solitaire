import '@testing-library/jest-dom/vitest';

import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import Solitaire from './Solitaire';
import { publish } from './Events';

it('renders the play area', () => {
  // Arrange + Act
  render(<Solitaire />);

  // Assert
  const playArea = screen.getByTestId("play-area");
  expect(playArea).toBeInTheDocument();
  expect(playArea.querySelector("#stock")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(0);
  expect(playArea.querySelector("#waste")).toBeInTheDocument();
  expect(playArea.querySelector("#waste")?.childNodes.length).toEqual(0);
  expect(playArea.querySelector("#foundation")).toBeInTheDocument();
  expect(playArea.querySelector("#foundation")?.childNodes.length).toEqual(4);
  expect(playArea.querySelector("#tableau")).toBeInTheDocument();
  expect(playArea.querySelector("#tableau")?.childNodes.length).toEqual(7);
  expect(playArea.querySelector("#menu")).toBeInTheDocument();
});

it('Deals the cards when a new game event is published', () => {
  // Arrange
  render(<Solitaire />);

  // Act
  act(() => {
    // Wrapped in an act call since this is render-affecting
    publish("newGame");
  });

  // Assert
  const playArea = screen.getByTestId("play-area");
  expect(playArea).toBeInTheDocument();
  expect(playArea.querySelector("#draw")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(24);
  expect(playArea.querySelector("#waste")).toBeInTheDocument();
  expect(playArea.querySelector("#waste")?.childNodes.length).toEqual(0);
  expect(playArea.querySelector("#foundation")).toBeInTheDocument();
  playArea.querySelector("#foundation")?.childNodes.forEach(foundationPile => {
    expect(foundationPile.childNodes.length).toEqual(0);
  });
  expect(playArea.querySelector("#tableau")).toBeInTheDocument();
  playArea.querySelector("#tableau")?.childNodes.forEach((tableauPile, pileIndex) => {
    expect(tableauPile.childNodes.length).toEqual(pileIndex + 1);
  });
  expect(playArea.querySelector("#menu")).toBeInTheDocument();
});

it('Removes cards from the playfield when the game is exited', () => {
  // Arrange
  render(<Solitaire />);

  // Act
  act(() => {
    // Wrapped in an act call since this is render-affecting
    publish("newGame");
  });

  // Assert
  const playArea = screen.getByTestId("play-area");
  expect(playArea).toBeInTheDocument();
  expect(playArea.querySelector("#draw")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(24);

  // Act
  act(() => {
    // Wrapped in an act call since this is render-affecting
    publish("exitGame");
  });

  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(0);
  expect(playArea.querySelector("#waste")?.childNodes.length).toEqual(0);
  playArea.querySelector("#foundation")?.childNodes.forEach(foundationPile => {
    expect(foundationPile.childNodes.length).toEqual(0);
  });
  playArea.querySelector("#tableau")?.childNodes.forEach(tableauPile => {
    expect(tableauPile.childNodes.length).toEqual(0);
  });
});
