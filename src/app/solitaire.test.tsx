import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { expect, it, describe, vi, afterEach } from 'vitest';

import Solitaire from './solitaire';
import useStore from '../stores/store';

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
    // Use the store action directly
    useStore.getState().newGame();
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
    // Use the store action directly
    useStore.getState().newGame();
  });

  // Assert
  const playArea = screen.getByTestId("play-area");
  expect(playArea).toBeInTheDocument();
  expect(playArea.querySelector("#draw")).toBeInTheDocument();
  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(24);

  // Act
  act(() => {
    // Use the store action directly
    useStore.getState().exitGame();
  });

  // Assert
  expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(0);
  expect(playArea.querySelector("#waste")?.childNodes.length).toEqual(0);
  playArea.querySelector("#foundation")?.childNodes.forEach(foundationPile => {
    expect(foundationPile.childNodes.length).toEqual(0);
  });
  playArea.querySelector("#tableau")?.childNodes.forEach(tableauPile => {
    expect(tableauPile.childNodes.length).toEqual(0);
  });
});


/**
 * Additional integration-style tests moved from Solitaire.extra.test.tsx
 */
describe('Solitaire additional behavior', () => {
  afterEach(() => {
    cleanup();
    // Reset store to avoid cross-test leakage
    useStore.setState({
      playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] },
      shuffledDeck: [],
      undoQueue: [],
      redoQueue: [],
      modalType: undefined,
      menuVisible: true,
      gameTimer: 0,
      timerId: null,
    });
  });

  it('formats timer correctly as HH:MM:SS', () => {
    // Arrange
    useStore.setState({ gameTimer: 3661 }); // 1h 1m 1s

    // Act
    render(<Solitaire />);
    const timer = screen.getByText(/01:01:01/);

    // Assert
    expect(timer).toBeInTheDocument();
  });

  it('clicking draw calls store.drawCard', () => {
    // Arrange
    const original = useStore.getState().drawCard;
    const spy = vi.fn();
    useStore.setState({ drawCard: spy });

    // Act
    render(<Solitaire />);
    // click the draw pile element
    const drawElem = screen.getByTestId('play-area').querySelector('#draw') as HTMLElement;
    expect(drawElem).toBeInTheDocument();

    act(() => {
      fireEvent.click(drawElem);
    });

    // Assert
    expect(spy).toHaveBeenCalled();
    useStore.setState({ drawCard: original });
  });

  it('dragStart sets cardData on dataTransfer', () => {
    // Arrange
    // Ensure there is a game with cards
    act(() => useStore.getState().newGame());

    // Act
    render(<Solitaire />);

    // Assert
    const firstCard = document.querySelector('.card[data-carddata]') as HTMLElement;
    expect(firstCard).toBeTruthy();

    // Arrange
    const setData = vi.fn();
    const clearData = vi.fn();
    const dataTransfer = { setData, clearData, effectAllowed: '' };

    // Act
    act(() => {
      fireEvent.dragStart(firstCard, { dataTransfer });
    });

    // Assert
    expect(setData).toHaveBeenCalled();
  });

  it('dropping a king onto an empty tableau calls moveCard', () => {
    // Arrange
    // Prepare a playfield with empty tableau
    useStore.setState({
      playfield: {
        draw: [],
        waste: [],
        foundation: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
      }
    });

    // Act
    const moveOriginal = useStore.getState().moveCard;
    const moveSpy = vi.fn();
    useStore.setState({ moveCard: moveSpy });
    render(<Solitaire />);

    // create a fake drag event with king
    const data = JSON.stringify({ rank: 'king', suit: 'hearts', cardIndex: 0, pileIndex: -1, pileType: 'draw' });
    const dataTransfer = { getData: () => data };
    const target = screen.getByTestId('play-area').querySelector('#tabpile0') as HTMLElement;

    // Assert
    expect(target).toBeTruthy();

    // Act
    act(() => {
      fireEvent.drop(target, { dataTransfer });
    });

    // Assert
    expect(moveSpy).toHaveBeenCalled();
    useStore.setState({ moveCard: moveOriginal });
  });

  it('waste pile class changes with count', () => {
    // Arrange
    useStore.setState({ playfield: { ...useStore.getState().playfield, waste: [{ rank: 'ace', suit: 'hearts', face: 'up' }, { rank: '2', suit: 'hearts', face: 'up' }] } });
    render(<Solitaire />);
    const waste = screen.getByTestId('play-area').querySelector('#waste') as HTMLElement;
    expect(waste.className).toEqual('offset-one');

    // Act
    act(() => {
      useStore.setState({ playfield: { ...useStore.getState().playfield, waste: [{ rank: 'ace', suit: 'hearts', face: 'up' }, { rank: '2', suit: 'hearts', face: 'up' }, { rank: '5', suit: 'clubs', face: 'up' }] } });
    });
    const waste2 = screen.getByTestId('play-area').querySelector('#waste') as HTMLElement;
    
    // Assert
    expect(waste2.className).toEqual('offset-two');
  });

  it('pressing Esc key closes the menu', () => {
    // Arrange
    const toggleOriginal = useStore.getState().toggleMenu;
    const spy = vi.fn();
    useStore.setState({ toggleMenu: spy });

    render(<Solitaire />);
    const area = screen.getByTestId('play-area');

    // Act
    act(() => {
      fireEvent.keyDown(area, { key: 'Escape' });
    });

    // Assert
    expect(spy).toHaveBeenCalled();
    useStore.setState({ toggleMenu: toggleOriginal });
  });
});
