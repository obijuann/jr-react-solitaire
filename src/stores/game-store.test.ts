import { beforeEach, describe, expect, it, vi } from "vitest";
import { CardData } from "../types/card-data";
import useGameStore from "./game-store";
import usePreferencesStore from "./preferences-store";
import useStatisticsStore from "./statistics-store";

function makeDeck(): CardData[] {
  const suits = ["clubs", "diamonds", "hearts", "spades"] as const;
  const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"] as const;
  const deck: CardData[] = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ rank: r, suit: s, face: "down" });
    }
  }
  return deck;
}

beforeEach(() => {
  usePreferencesStore.setState({ gameTimerEnabled: true });

  useGameStore.setState({
    playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] },
    shuffledDeck: [],
    undoQueue: [],
    redoQueue: [],
    modalType: undefined,
    gameTimer: 0,
    timerId: null,
    menuVisible: false
  });

  vi.resetAllMocks();
});

describe("Game store actions", () => {
  it("shuffleDeck produces 52 cards", () => {
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

  it("dealDeck places correct counts", () => {
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

  it("drawCard moves a card from draw to waste", () => {
    // Arrange
    const a = { rank: "ace", suit: "hearts", face: "down" } as CardData;
    const b = { rank: "2", suit: "hearts", face: "down" } as CardData;
    // Draw is an array where pop() will remove last element
    useGameStore.setState({ playfield: { draw: [a, b], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.drawCard();

    // Assert
    const pf = useGameStore.getState().playfield;
    expect(pf.draw.length).toBe(1);
    expect(pf.waste.length).toBe(1);
    expect(pf.waste[0].rank).toEqual(b.rank);
    expect(pf.waste[0].face).toEqual("up");
  });

  it("drawCard recycles waste into draw when draw is empty", () => {
    // Arrange
    const a = { rank: "ace", suit: "hearts", face: "up" } as CardData;
    const b = { rank: "2", suit: "hearts", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [a, b], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.drawCard();

    // Assert
    const pf = useGameStore.getState().playfield;
    expect(pf.draw.length).toBe(2);
    expect(pf.waste.length).toBe(0);
    // After recycling, cards in draw should be face-down
    expect(pf.draw[0].face).toBe("down");
    expect(pf.draw[1].face).toBe("down");
  });

  it("drawCard with both draw and waste empty does nothing", () => {
    // Arrange
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.drawCard();

    // Assert
    const pf = useGameStore.getState().playfield;
    expect(pf.draw.length).toBe(0);
    expect(pf.waste.length).toBe(0);
  });

  it("drawCard with no waste cards produces undo entry", () => {
    // Arrange
    const a = { rank: "ace", suit: "hearts", face: "down" } as CardData;
    useGameStore.setState({ playfield: { draw: [a], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] }, undoQueue: [] });

    // Act
    useGameStore.getState().actions.drawCard();

    // Assert
    expect(useGameStore.getState().undoQueue.length).toBe(1);
  });

  it("moveCard and undo/redo work", () => {
    // Arrange
    const card = { rank: "ace", suit: "hearts", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.moveCard({ ...card, pileType: "tableau", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "tableau", 0, 0);

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

  it("newGame shuffles a new deck, redeals the playfield, clears the undo/redo queues, and starts a new game timer", () => {

    // Arrange
    vi.useFakeTimers();
    try {
      // Arrange
      const deck = makeDeck();
      const card = deck[0];
      useGameStore.setState({ gameTimer: 5000, shuffledDeck: deck, playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });

      // Act + Assert
      useGameStore.getState().actions.moveCard({ ...card, pileType: "tableau", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "tableau", 0, 0);
      expect(useGameStore.getState().undoQueue.length).toBe(1);

      // Act
      useGameStore.getState().actions.newGame();
      vi.advanceTimersByTime(1100);

      // Assert
      expect(useGameStore.getState().modalType).toBeUndefined();
      expect(useGameStore.getState().shuffledDeck.length).toEqual(52);
      expect(useGameStore.getState().undoQueue.length).toBe(0);
      expect(useGameStore.getState().redoQueue.length).toBe(0);
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(1);

      const pf = useGameStore.getState().playfield;
      expect(pf.tableau.length).toBe(7);
      expect(pf.tableau[0].length).toBe(1);
      expect(pf.foundation.length).toBe(4);
      expect(pf.foundation[0].length).toBe(0);
      expect(pf.draw.length).toBe(24);
      expect(pf.waste.length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("quitGame resets the playfield, deck and undo/redo queues", () => {
    // Arrange
    const deck = makeDeck();
    const card = deck[0];
    useGameStore.setState({ shuffledDeck: deck, playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });

    // Act + Assert
    useGameStore.getState().actions.moveCard({ ...card, pileType: "tableau", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "tableau", 0, 0);
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

  it("resetTimer resets the timer value", () => {
    // Arrange
    vi.useFakeTimers();
    try {
      // Act
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(3100);

      // Assert
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(3);

      // Act
      useGameStore.getState().actions.stopTimer();

      // Assert
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("startTimer increments gameTimer", () => {
    // Arrange
    vi.useFakeTimers();
    try {
      // Act
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(3100);

      // Assert
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("startTimer does not increment gameTimer when the user has disabled timers", () => {
    // Arrange
    vi.useFakeTimers();
    usePreferencesStore.setState({ gameTimerEnabled: false });
    try {
      // Act
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(3100);

      // Assert
      expect(useGameStore.getState().gameTimer).toEqual(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stopTimer does not reset the timer value", () => {
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
      expect(gameTimeElapsed).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("checkGameState triggers game win when foundation full", () => {
    // Arrange
    // make 52 cards in foundation (13 each)
    const makeCard = (r: string, s: string) => ({ rank: r, suit: s, face: "up" } as CardData);
    const suits = ["clubs", "diamonds", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    const foundation = suits.map(s => ranks.map(r => makeCard(r, s)));
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: foundation, tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    expect(useGameStore.getState().modalType).toBe("gamewin");
  });

  it("onStorageRehydrated resets the game if the previous game was in a win state", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 99, modalType: "gamewin" });

    // Act
    useGameStore.getState().actions.onStorageRehydrated();

    // Assert
    expect(useGameStore.getState().modalType).toBeUndefined();
    expect(useGameStore.getState().gameTimer).toBe(0);
    expect(useGameStore.getState().shuffledDeck.length).toBe(0);
    expect(useGameStore.getState().redoQueue.length).toBe(0);
    expect(useGameStore.getState().undoQueue.length).toBe(0);
  });

  it("onStorageRehydrated starts timer when gameTimer > 0", () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, "setInterval");
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

  it("onStorageRehydrated starts timer when shuffledDeck is present", () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, "setInterval");
      const card = { rank: "ace", suit: "hearts", face: "down" } as CardData;
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

  it("onStorageRehydrated does not start the timer when the menu is displayed", () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, "setInterval");
      useGameStore.setState({ gameTimer: 5, timerId: null, shuffledDeck: [], menuVisible: true });

      // Act
      useGameStore.getState().actions.onStorageRehydrated();

      // Assert
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("onStorageRehydrated does not start timer when no game in progress", () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const spy = vi.spyOn(window, "setInterval");
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

  it("setPlayfield merges partial playfield updates", () => {
    // Arrange
    const a = { rank: "ace", suit: "hearts", face: "down" } as CardData;
    const b = { rank: "2", suit: "hearts", face: "down" } as CardData;
    useGameStore.setState({ playfield: { draw: [a], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.setPlayfield({ waste: [b] });

    // Assert: draw remains, waste updated
    const pf = useGameStore.getState().playfield;
    expect(pf.draw.length).toBe(1);
    expect(pf.waste.length).toBe(1);
    expect(pf.waste[0].rank).toBe("2");
  });

  it("restartGame re-deals and restarts the timer", () => {
    vi.useFakeTimers();
    try {
      // Arrange
      const deck = makeDeck();
      useGameStore.setState({ shuffledDeck: deck, gameTimer: 123 });

      // Act
      useGameStore.getState().actions.restartGame();
      vi.advanceTimersByTime(1100);

      // Assert
      const pf = useGameStore.getState().playfield;
      expect(pf.tableau.length).toBe(7);
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("resetTimer stops and zeros the timer", () => {
    vi.useFakeTimers();
    try {
      useGameStore.getState().actions.startTimer();
      vi.advanceTimersByTime(2100);
      expect(useGameStore.getState().gameTimer).toBeGreaterThanOrEqual(2);

      // Act
      useGameStore.getState().actions.resetTimer();

      // Assert
      expect(useGameStore.getState().gameTimer).toBe(0);
      expect(useGameStore.getState().timerId).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("moveCard from waste moves cards and invalid params do nothing", () => {
    // Arrange
    const w1 = { rank: "7", suit: "clubs", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [w1], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });

    // Act: valid move from waste to foundation
    useGameStore.getState().actions.moveCard({ ...w1, pileType: "waste", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "waste", 0, 0);

    // Assert moved
    const pf = useGameStore.getState().playfield;
    expect(pf.waste.length).toBe(0);
    expect(pf.foundation[0].length).toBe(1);

    // Arrange invalid params
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });
    const before = structuredClone(useGameStore.getState().playfield);

    // Act: invalid source index (use a valid CardData object but invalid indices)
    useGameStore.getState().actions.moveCard({ rank: "ace", suit: "clubs", face: "down", pileType: "tableau", pileIndex: 0, cardIndex: 0 } as CardData, "tableau", 0, "tableau", -1, -1);

    // Assert: no change
    expect(useGameStore.getState().playfield).toEqual(before);
  });

  it("undo/redo with empty queues do nothing (no throw)", () => {
    // Arrange + Act: ensure queues empty
    useGameStore.setState({ undoQueue: [], redoQueue: [] });

    // Assert (should not throw)
    expect(() => useGameStore.getState().actions.undo()).not.toThrow();
    expect(() => useGameStore.getState().actions.redo()).not.toThrow();
  });

  it("startTimer clears previous interval on double start", () => {
    vi.useFakeTimers();
    try {
      const clearSpy = vi.spyOn(globalThis, "clearInterval");

      // Act: start twice
      useGameStore.getState().actions.startTimer();
      const firstId = useGameStore.getState().timerId;
      useGameStore.getState().actions.startTimer();

      // Assert clearInterval called with previous id
      expect(clearSpy).toHaveBeenCalledWith(firstId as number);
      clearSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("checkGameState records win via statistics store when foundation full", () => {
    // Arrange
    const makeCard = (r: string, s: string) => ({ rank: r, suit: s, face: "up" } as CardData);
    const suits = ["clubs", "diamonds", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    const foundation = suits.map(s => ranks.map(r => makeCard(r, s)));
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: foundation, tableau: [[], [], [], [], [], [], []] }, gameTimer: 77 });

    const spy = vi.spyOn(useStatisticsStore.getState().actions, "recordWin");

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    expect(spy).toHaveBeenCalledWith(77);
    spy.mockRestore();
  });

  it("clearSubmenu clears the submenu id", () => {
    // Arrange
    useGameStore.setState({ submenuId: "options" });

    // Act
    useGameStore.getState().actions.clearSubmenu();

    // Assert
    expect(useGameStore.getState().submenuId).toBe("");
  });

  it("undo beyond history is a no-op and does not throw", () => {
    // Arrange: perform a single move to create undo entry
    const card = { rank: "ace", suit: "hearts", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] } });
    useGameStore.getState().actions.moveCard({ ...card, pileType: "tableau", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "tableau", 0, 0);

    // Act: undo twice
    useGameStore.getState().actions.undo();

    // second undo should be a no-op and not throw
    expect(() => useGameStore.getState().actions.undo()).not.toThrow();
  });

  it("moveCard with invalid target pile does nothing", () => {
    // Arrange
    const c = { rank: "9", suit: "spades", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [c], foundation: [[], [], [], []], tableau: [[], [], [], [], [], [], []] } });
    const before = structuredClone(useGameStore.getState().playfield);

    // Act: pass an invalid target pile (bypass types)
    // Intentionally pass an invalid pile type at runtime to hit the default branch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useGameStore.getState().actions.moveCard({ ...c, pileType: "waste", pileIndex: 0, cardIndex: 0 } as any, "invalid" as any, 0, "waste", 0, 0);

    // Assert: no change
    expect(useGameStore.getState().playfield).toEqual(before);
  });

  it("dealDeck with empty shuffledDeck does not throw and clears queues", () => {
    // Arrange
    useGameStore.setState({ shuffledDeck: [], undoQueue: [{ draw: [], waste: [] }], redoQueue: [{ draw: [], waste: [] }] });
    const spy = vi.spyOn(useGameStore.getState().actions, "checkGameState").mockImplementation(() => { });

    // Act / Assert
    expect(() => useGameStore.getState().actions.dealDeck()).not.toThrow();
    expect(useGameStore.getState().undoQueue.length).toBe(0);
    expect(useGameStore.getState().redoQueue.length).toBe(0);

    spy.mockRestore();
  });


  it("checkGameState flips last card in tableau and waste when face-down", () => {
    // Arrange
    const downCard = { rank: "ace", suit: "clubs", face: "down" } as CardData;
    const upCard = { rank: "2", suit: "clubs", face: "up" } as CardData;
    // tableau: first pile has two cards, last is face-down
    useGameStore.setState({ playfield: { draw: [], waste: [upCard, { ...downCard }], foundation: [[], [], [], []], tableau: [[upCard, { ...downCard }], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    const pf = useGameStore.getState().playfield;
    // last tableau card should be flipped up
    expect(pf.tableau[0][1].face).toBe("up");
    // last waste card should be flipped up
    expect(pf.waste[1].face).toBe("up");
  });

  it("moveCard moves multiple cards from tableau and undo/redo restores correctly", () => {
    // Arrange: three cards in tableau[0]
    const c1 = { rank: "3", suit: "spades", face: "up" } as CardData;
    const c2 = { rank: "4", suit: "spades", face: "up" } as CardData;
    const c3 = { rank: "5", suit: "spades", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[c1, c2, c3], [], [], [], [], [], []] } });

    // Act: move starting from index 1 (should move c2 and c3)
    useGameStore.getState().actions.moveCard({ ...c2, pileType: "tableau", pileIndex: 0, cardIndex: 1 }, "tableau", 1, "tableau", 0, 1);

    // Assert moved
    let pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(1);
    expect(pf.tableau[1].length).toBe(2);
    expect(pf.tableau[1][0].rank).toBe("4");

    // Undo
    useGameStore.getState().actions.undo();
    pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(3);
    expect(pf.tableau[1].length).toBe(0);

    // Redo
    useGameStore.getState().actions.redo();
    pf = useGameStore.getState().playfield;
    expect(pf.tableau[0].length).toBe(1);
    expect(pf.tableau[1].length).toBe(2);
  });

  it("toggleMenu and toggleSubmenu behavior", () => {
    // Arrange: start with menu hidden so toggling opens it (and should pause)
    useGameStore.setState({ menuVisible: false, submenuId: "" });

    const pauseSpy = vi.spyOn(useGameStore.getState().actions, "pauseGame").mockImplementation(() => { });
    const resumeSpy = vi.spyOn(useGameStore.getState().actions, "resumeGame").mockImplementation(() => { });

    // Act: open menu (should pause)
    useGameStore.getState().actions.toggleMenu();
    expect(useGameStore.getState().menuVisible).toBe(true);
    expect(pauseSpy).toHaveBeenCalled();

    // Act: close menu (should resume)
    useGameStore.getState().actions.toggleMenu();
    expect(useGameStore.getState().menuVisible).toBe(false);
    expect(resumeSpy).toHaveBeenCalled();

    // Act: show submenu
    useGameStore.getState().actions.toggleSubmenu("settings");
    expect(useGameStore.getState().submenuId).toBe("settings");

    // Act: toggle same submenu (should close)
    useGameStore.getState().actions.toggleSubmenu("settings");
    expect(useGameStore.getState().submenuId).toBe("");

    // Act: force hide menus (should clear submenu and resume)
    pauseSpy.mockClear();
    resumeSpy.mockClear();
    useGameStore.getState().actions.toggleMenu(true);
    expect(useGameStore.getState().menuVisible).toBe(false);
    expect(useGameStore.getState().submenuId).toBe("");
    expect(resumeSpy).toHaveBeenCalled();

    pauseSpy.mockRestore();
    resumeSpy.mockRestore();
  });

  it("toggleMenu should not pause/resume the game if a modal is open", () => {
    // Arrange: start with menu hidden and modal set so toggling opens the menu but does not pause the game
    useGameStore.setState({ menuVisible: false, submenuId: "", modalType: "gamewin" });

    const pauseSpy = vi.spyOn(useGameStore.getState().actions, "pauseGame").mockImplementation(() => { });
    const resumeSpy = vi.spyOn(useGameStore.getState().actions, "resumeGame").mockImplementation(() => { });

    // Act: open menu (should not pause)
    useGameStore.getState().actions.toggleMenu();

    // Assert
    expect(useGameStore.getState().menuVisible).toBe(true);
    expect(pauseSpy).not.toHaveBeenCalled();

    // Act: close menu (should not resume)
    useGameStore.getState().actions.toggleMenu();

    // Assert
    expect(useGameStore.getState().menuVisible).toBe(false);
    expect(resumeSpy).not.toHaveBeenCalled();

    pauseSpy.mockRestore();
    resumeSpy.mockRestore();
  });

  it("pauseGame calls stopTimer when timerId present", () => {
    // Arrange
    useGameStore.setState({ timerId: 123 });
    const stopSpy = vi.spyOn(useGameStore.getState().actions, "stopTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.pauseGame();

    // Assert
    expect(stopSpy).toHaveBeenCalled();
    stopSpy.mockRestore();
  });

  it("pauseGame does nothing when timerId is null", () => {
    // Arrange
    useGameStore.setState({ timerId: null });
    const stopSpy = vi.spyOn(useGameStore.getState().actions, "stopTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.pauseGame();

    // Assert - stopTimer should not be called since no timer is running
    expect(stopSpy).not.toHaveBeenCalled();
    stopSpy.mockRestore();
  });

  it("resumeGame starts timer when gameTimer > 0 and timerId null", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 5, timerId: null });
    const startSpy = vi.spyOn(useGameStore.getState().actions, "startTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.resumeGame();

    // Assert
    expect(startSpy).toHaveBeenCalled();
    startSpy.mockRestore();
  });

  it("resumeGame starts timer when gameTimer === 0 and timerId null", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 0, timerId: null });
    const startSpy = vi.spyOn(useGameStore.getState().actions, "startTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.resumeGame();

    // Assert
    expect(startSpy).toHaveBeenCalled();
    startSpy.mockRestore();
  });

  it("resumeGame does nothing when timerId is already set", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 5, timerId: 123 });
    const startSpy = vi.spyOn(useGameStore.getState().actions, "startTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.resumeGame();

    // Assert - startTimer should not be called since timer already running
    expect(startSpy).not.toHaveBeenCalled();
    startSpy.mockRestore();
  });

  it("resumeGame does nothing when gameTimer < 0", () => {
    // Arrange - gameTimer should never actually be < 0 but testing edge case
    useGameStore.setState({ gameTimer: -1, timerId: null });
    const startSpy = vi.spyOn(useGameStore.getState().actions, "startTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.resumeGame();

    // Assert
    expect(startSpy).not.toHaveBeenCalled();
    startSpy.mockRestore();
  });

  it("checkGameState does not flip cards that are already face-up", () => {
    // Arrange
    const upCard = { rank: "ace", suit: "clubs", face: "up" } as CardData;
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[upCard], [], [], [], [], [], []] } });

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    const pf = useGameStore.getState().playfield;
    expect(pf.tableau[0][0].face).toBe("up");
  });

  it("checkGameState stops the timer when game is won", () => {
    // Arrange - full foundation (52 cards)
    const makeCard = (r: string, s: string) => ({ rank: r, suit: s, face: "up" } as CardData);
    const suits = ["clubs", "diamonds", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    const foundation = suits.map(s => ranks.map(r => makeCard(r, s)));
    useGameStore.setState({ playfield: { draw: [], waste: [], foundation: foundation, tableau: [[], [], [], [], [], [], []] }, timerId: 123 });
    const stopSpy = vi.spyOn(useGameStore.getState().actions, "stopTimer").mockImplementation(() => { });

    // Act
    useGameStore.getState().actions.checkGameState();

    // Assert
    expect(stopSpy).toHaveBeenCalled();
    stopSpy.mockRestore();
  });

  it("toggleSubmenu switching between different submenus works", () => {
    // Arrange
    useGameStore.setState({ submenuId: "" });

    // Act: open first submenu
    useGameStore.getState().actions.toggleSubmenu("stats");
    expect(useGameStore.getState().submenuId).toBe("stats");

    // Act: switch to different submenu (should close first then open second)
    useGameStore.getState().actions.toggleSubmenu("settings");

    // Assert
    expect(useGameStore.getState().submenuId).toBe("settings");
  });

  it("moveCard clears redo queue after moving", () => {
    // Arrange
    const card = { rank: "ace", suit: "hearts", face: "up" } as CardData;
    useGameStore.setState({
      playfield: { draw: [], waste: [], foundation: [[], [], [], []], tableau: [[card], [], [], [], [], [], []] },
      redoQueue: [{ draw: [] }] // Has a redo item
    });

    // Act
    useGameStore.getState().actions.moveCard({ ...card, pileType: "tableau", pileIndex: 0, cardIndex: 0 }, "foundation", 0, "tableau", 0, 0);

    // Assert
    expect(useGameStore.getState().redoQueue.length).toBe(0);
  });
});


