import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardData } from '../types/card-data';
import useGameStore from './game-store';

function makeDeck(): CardData[] {
  const suits = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
  const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'] as const;
  const deck: CardData[] = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ rank: r, suit: s, face: 'down' });
    }
  }
  return deck;
}

beforeEach(() => {
  useGameStore.setState({
    playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] },
    shuffledDeck: [],
    undoQueue: [],
    redoQueue: [],
    modalType: undefined,
    gameTimer: 0,
    timerId: null,
  });
});

describe('Zustand store actions', () => {
  it('shuffleDeck produces 52 cards', () => {
    // Arrange + Act
    useGameStore.getState().actions.shuffleDeck();
    const s = useGameStore.getState().shuffledDeck;

    // Assert
    expect(s.length).toBe(52);

    // Act
    // Ensure basic distribution
    const suits = new Set(s.map(c => c.suit));

    // Assert
    expect(suits.size).toBe(4);
  });

  it('dealDeck places correct counts', () => {
    // Arrange
    const deck = makeDeck();
    useGameStore.setState({ shuffledDeck: deck });

    // Act
    useGameStore.getState().actions.dealDeck();
    const pf = useGameStore.getState().playfield;
    const tableauLengths = pf.tableau.map(t => t.length);

    // Assert
    expect(tableauLengths).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pf.waste.length).toBe(0);
    expect(pf.foundation.every(f => f.length === 0)).toBe(true);
    // 52 - 28 = 24
    expect(pf.draw.length).toBe(24);
  });

  it('drawCard moves a card from draw to waste', () => {
    // Arrange
    const a = { rank: 'ace', suit: 'hearts', face: 'down' } as CardData;
    const b = { rank: '2', suit: 'hearts', face: 'down' } as CardData;
    // Draw is an array where pop() will remove last element
    useGameStore.setState({ playfield: { draw: [a, b], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.drawCard();

    // Assert
    const pf = useGameStore.getState().playfield;
    expect(pf.draw.length).toBe(1);
    expect(pf.waste.length).toBe(1);
    expect(pf.waste[0].rank).toEqual(b.rank);
    expect(pf.waste[0].face).toEqual('up');
  });

  it('moveCard and undo/redo work', () => {
    // Arrange
    const card = { rank: 'ace', suit: 'hearts', face: 'up' } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.moveCard({ ...card, pileType: 'tableau', pileIndex: 0, cardIndex: 0 }, 'foundation', 0, 'tableau', 0, 0);

    // Assert
    let pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(0);
    expect(pf.foundation[0].length).toBe(1);

    // Act + Assert undo
    useGameStore.getState().actions.undo();
    pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(1);
    expect(pf.foundation[0].length).toBe(0);

    // Act + Assert redo
    useGameStore.getState().actions.redo();
    pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(0);
    expect(pf.foundation[0].length).toBe(1);
  });

  it('quitGame resets the playfield, deck and undo/redo queues', () => {
    // Arrange
    const deck = makeDeck();
    const card = deck[0];
    useGameStore.setState({ shuffledDeck: deck, playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });

    // Act + Assert
    useGameStore.getState().actions.moveCard({ ...card, pileType: 'tableau', pileIndex: 0, cardIndex: 0 }, 'foundation', 0, 'tableau', 0, 0);
    expect(useGameStore.getState().undoQueue.length).toBe(1);

    // Act
    useGameStore.getState().actions.quitGame();

    // Assert
    expect(useGameStore.getState().modalType).toBeUndefined();
    expect(useGameStore.getState().shuffledDeck).toEqual([]);
    expect(useGameStore.getState().undoQueue.length).toBe(0);
    expect(useGameStore.getState().redoQueue.length).toBe(0);
    expect(useGameStore.getState().gameTimer).toBe(0);

    const pf = useGameStore.getState().playfield;
    expect(pf.tableau.length).toBe(7);
    expect(pf.tableau[0].length).toBe(0);
    expect(pf.foundation.length).toBe(4);
    expect(pf.foundation[0].length).toBe(0);
    expect(pf.draw.length).toBe(0);
    expect(pf.waste.length).toBe(0);
  });

  it('startTimer increments gameTimer and stopTimer clears it by default', () => {
    // Arrange
    vi.useFakeTimers();
    try {
      // Act
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(3100);
      let gameTimeElapsed = useGameStore.getState().gameTimer;

      // Assert
      expect(gameTimeElapsed).toBeGreaterThanOrEqual(3);

      // Act
      useGameStore.getState().actions.stopTimer();

      // Assert
      gameTimeElapsed = useGameStore.getState().gameTimer;
      expect(gameTimeElapsed).toEqual(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stopTimer does not reset the timer value', () => {
    // Arrange
    vi.useFakeTimers();
    try {
      // Act
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(3100);
      let gameTimeElapsed = useGameStore.getState().gameTimer;

      // Assert
      expect(gameTimeElapsed).toBeGreaterThanOrEqual(3);

      // Act
      useGameStore.getState().actions.stopTimer(false);

      // Assert
      gameTimeElapsed = useGameStore.getState().gameTimer;
      expect(gameTimeElapsed).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('checkGameState triggers game win when foundation full', () => {
    // Arrange
    // make 52 cards in foundation (13 each)
    const makeCard = (r: string, s: string) => ({ rank: r, suit: s, face: 'up' } as CardData);
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    const foundation = suits.map(s => ranks.map(r => makeCard(r, s)));
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: foundation, tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    expect(useGameStore.getState().modalType).toBe('gamewin');
  });

  it('onStorageRehydrated resets the game if the previous game was in a win state', () => {
    // Arrange
    useGameStore.setState({ gameTimer: 99, modalType: "gamewin" });

    // Act
    useGameStore.getState().actions.onStorageRehydrated();

    // Assert
    expect(useGameStore.getState().modalType).toBeUndefined;
    expect(useGameStore.getState().gameTimer).toBe(0);
    expect(useGameStore.getState().shuffledDeck.length).toBe(0);
    expect(useGameStore.getState().redoQueue.length).toBe(0);
    expect(useGameStore.getState().undoQueue.length).toBe(0);
  });

  it('onStorageRehydrated starts timer when gameTimer > 0', () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, 'setInterval');
      useGameStore.setState({ gameTimer: 5, timerId: null, shuffledDeck: [] });

      // Act
      useGameStore.getState().actions.onStorageRehydrated();

      // Assert
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('onStorageRehydrated starts timer when shuffledDeck is present', () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, 'setInterval');
      const card = { rank: 'ace', suit: 'hearts', face: 'down' } as CardData;
      useGameStore.setState({ gameTimer: 0, timerId: null, shuffledDeck: [card] });

      // Act
      useGameStore.getState().actions.onStorageRehydrated();

      // Assert
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('onStorageRehydrated does not start timer when no game in progress', () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, 'setInterval');
      useGameStore.setState({ gameTimer: 0, timerId: null, shuffledDeck: [] });

      // Act
      useGameStore.getState().actions.onStorageRehydrated();

      // Assert
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });
});
