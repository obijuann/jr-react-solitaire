import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { expect, it, describe, vi, afterEach } from 'vitest';

import Solitaire from './Solitaire';
import useStore from './store';

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
    // reset store to avoid cross-test leakage
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
    useStore.setState({ gameTimer: 3661 }); // 1h 1m 1s
    render(<Solitaire />);
    const timer = screen.getByText(/01:01:01/);
    expect(timer).toBeInTheDocument();
  });

  it('clicking draw calls store.drawCard', () => {
    const original = useStore.getState().drawCard;
    const spy = vi.fn();
    useStore.setState({ drawCard: spy });

    render(<Solitaire />);
    // click the draw pile element
    const drawElem = screen.getByTestId('play-area').querySelector('#draw') as HTMLElement;
    expect(drawElem).toBeInTheDocument();

    act(() => {
      fireEvent.click(drawElem);
    });

    expect(spy).toHaveBeenCalled();
    useStore.setState({ drawCard: original });
  });

  it('dragStart sets cardData on dataTransfer', () => {
    // Ensure there is a game with cards
    act(() => useStore.getState().newGame());
    render(<Solitaire />);

    const firstCard = document.querySelector('.card[data-carddata]') as HTMLElement;
    expect(firstCard).toBeTruthy();

    const setData = vi.fn();
    const clearData = vi.fn();
    const dataTransfer: any = { setData, clearData, effectAllowed: '' };

    act(() => {
      fireEvent.dragStart(firstCard, { dataTransfer });
    });

    expect(setData).toHaveBeenCalled();
  });

  it('dropping a king onto an empty tableau calls moveCard', () => {
    // Prepare a playfield with empty tableau
    useStore.setState({
      playfield: {
        draw: [],
        waste: [],
        foundation: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
      }
    });

    const moveOriginal = useStore.getState().moveCard;
    const moveSpy = vi.fn();
    useStore.setState({ moveCard: moveSpy });

    render(<Solitaire />);

    // create a fake drag event with king
    const data = JSON.stringify({ rank: 'king', suit: 'hearts', cardIndex: 0, pileIndex: -1, pileType: 'draw' });
    const dataTransfer: any = { getData: () => data };

    const target = screen.getByTestId('play-area').querySelector('#tabpile0') as HTMLElement;
    expect(target).toBeTruthy();

    act(() => {
      fireEvent.drop(target, { dataTransfer });
    });

    expect(moveSpy).toHaveBeenCalled();
    useStore.setState({ moveCard: moveOriginal });
  });

  it('waste pile class changes with count', () => {
    useStore.setState({ playfield: { ...useStore.getState().playfield, waste: [{ rank: 'ace', suit: 'hearts', face: 'up' }, { rank: '2', suit: 'hearts', face: 'up' }] } });
    render(<Solitaire />);
    const waste = screen.getByTestId('play-area').querySelector('#waste') as HTMLElement;
    expect(waste.className).toEqual('offset-one');

    act(() => {
      useStore.setState({ playfield: { ...useStore.getState().playfield, waste: [{}, {}, {}] as any } });
    });

    const waste2 = screen.getByTestId('play-area').querySelector('#waste') as HTMLElement;
    expect(waste2.className).toEqual('offset-two');
  });

  it('pressing m key closes the menu', () => {
    const toggleOriginal = useStore.getState().toggleMenu;
    const spy = vi.fn();
    useStore.setState({ toggleMenu: spy });

    render(<Solitaire />);
    const area = screen.getByTestId('play-area');

    act(() => {
      fireEvent.keyDown(area, { key: 'm' });
    });

    expect(spy).toHaveBeenCalled();
    useStore.setState({ toggleMenu: toggleOriginal });
  });
});
