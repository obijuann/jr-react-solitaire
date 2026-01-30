import { beforeEach, describe, expect, it, vi } from 'vitest';
import useStore from './store';
import { CardData } from '../types/card-data';

function makeDeck(): CardData[] {
  const suits = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
  const ranks = ['ace','2','3','4','5','6','7','8','9','10','jack','queen','king'] as const;
  const deck: CardData[] = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ rank: r, suit: s, face: 'down' });
    }
  }
  return deck;
}

beforeEach(() => {
  useStore.setState({
    playfield: { draw: [], waste: [], foundation: [[],[],[],[]], tableau: [[],[],[],[],[],[],[]] },
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
    useStore.getState().shuffleDeck();
    const s = useStore.getState().shuffledDeck;

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
    useStore.setState({ shuffledDeck: deck });

    // Act
    useStore.getState().dealDeck();
    const pf = useStore.getState().playfield;
    const tableauLengths = pf.tableau.map(t => t.length);

    // Assert
    expect(tableauLengths).toEqual([1,2,3,4,5,6,7]);
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
    useStore.setState({ playfield: { draw: [a,b], waste: [], foundation: [[],[],[],[]], tableau: [[],[],[],[],[],[],[]] } });

    // Act
    useStore.getState().drawCard();

    // Assert
    const pf = useStore.getState().playfield;
    expect(pf.draw.length).toBe(1);
    expect(pf.waste.length).toBe(1);
    expect(pf.waste[0].rank).toEqual(b.rank);
    expect(pf.waste[0].face).toEqual('up');
  });

  it('moveCard and undo/redo work', () => {
    // Arrange
    const card = { rank: 'ace', suit: 'hearts', face: 'up' } as CardData;
    useStore.setState({ playfield: { draw: [], waste: [], foundation: [[],[],[],[]], tableau: [[card],[],[],[],[],[],[]] } });

    // Act
    useStore.getState().moveCard({ ...card, pileType: 'tableau', pileIndex: 0, cardIndex: 0 }, 'foundation', 0, 'tableau', 0, 0);

    // Assert
    let pf = useStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(0);
    expect(pf.foundation[0].length).toBe(1);

    // Act + Assert undo
    useStore.getState().undo();
    pf = useStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(1);
    expect(pf.foundation[0].length).toBe(0);

    // Act + Assert redo
    useStore.getState().redo();
    pf = useStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(0);
    expect(pf.foundation[0].length).toBe(1);
  });

  it('startTimer increments gameTimer and stopTimer clears it', () => {
    // Arrange
    vi.useFakeTimers();
    try {
      // Act
      useStore.getState().startTimer();
      vi.advanceTimersByTime(3100);
      let t = useStore.getState().gameTimer;

      // Assert
      expect(t).toBeGreaterThanOrEqual(3);

      // Act
      useStore.getState().stopTimer();
      
      // Assert
      t = useStore.getState().gameTimer;
      expect(t).toEqual(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('checkGameState triggers game win when foundation full', () => {
    // Arrange
    // make 52 cards in foundation (13 each)
    const makeCard = (r: string, s: string) => ({ rank: r, suit: s, face: 'up' } as CardData);
    const suits = ['clubs','diamonds','hearts','spades'];
    const ranks = ['ace','2','3','4','5','6','7','8','9','10','jack','queen','king'];
    const foundation = suits.map(s => ranks.map(r => makeCard(r, s)));
    useStore.setState({ playfield: { draw: [], waste: [], foundation: foundation, tableau: [[],[],[],[],[],[],[]] } });

    // Act
    useStore.getState().checkGameState();

    // Assert
    expect(useStore.getState().modalType).toBe('gamewin');
  });
});
