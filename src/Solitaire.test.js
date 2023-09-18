import { render, screen } from '@testing-library/react';

import Solitaire from './Solitaire';

// Add a polyfill for structured clone
global.structuredClone = (val) => JSON.parse(JSON.stringify(val))

test('renders the play area', () => {
  // Arrange + Act
  render(<Solitaire />);

  // Assert
  const playArea = screen.getByTestId("play-area");
  expect(playArea).toBeInTheDocument();
  expect(playArea.querySelector("#stock")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")).toBeInTheDocument();
  expect(playArea.querySelector("#waste")).toBeInTheDocument();
  expect(playArea.querySelector("#foundation")).toBeInTheDocument();
  expect(playArea.querySelector("#tableau")).toBeInTheDocument();
  expect(playArea.querySelector("#menu")).toBeInTheDocument();
});
