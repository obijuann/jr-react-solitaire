import "@testing-library/jest-dom/vitest";

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useGameStore from "../stores/game-store";
import usePreferencesStore from "../stores/preferences-store";
import Solitaire from "./solitaire";

beforeEach(() => {
  usePreferencesStore.setState({ cardAnimationEnabled: false, autoCollectEnabled: false });
});

afterEach(() => {
  cleanup();

  // Reset store to avoid cross-test leakage
  useGameStore.setState({
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

describe("Solitaire app behavior", () => {
  it("renders the play area", () => {
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

    const menuArea = screen.getByTestId("menu-area");
    expect(menuArea.querySelector("#menu")).toBeInTheDocument();
  });

  it("Deals the cards when a new game event is published", () => {
    // Arrange
    render(<Solitaire />);

    // Act
    act(() => {
      // Use the store action directly
      useGameStore.getState().actions.newGame();
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

    const menuArea = screen.getByTestId("menu-area");
    expect(menuArea.querySelector("#menu")).toBeInTheDocument();
  });

  it("Removes cards from the playfield when the game is quit", () => {
    // Arrange
    render(<Solitaire />);

    // Act
    act(() => {
      // Use the store action directly
      useGameStore.getState().actions.newGame();
    });

    // Assert
    const playArea = screen.getByTestId("play-area");
    expect(playArea).toBeInTheDocument();
    expect(playArea.querySelector("#draw")).toBeInTheDocument();
    expect(playArea.querySelector("#draw")?.childNodes.length).toEqual(24);

    // Act
    act(() => {
      // Use the store action directly
      useGameStore.getState().actions.quitGame();
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

  it("renders the timer component", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 3661 }); // 1h 1m 1s

    // Act
    render(<Solitaire />);
    const timer = screen.getByText(/01:01:01/);

    // Assert
    expect(timer).toBeInTheDocument();
  });

  it("clicking draw calls store.drawCard", () => {
    // Arrange
    const original = useGameStore.getState().actions.drawCard;
    const spy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, drawCard: spy } }));

    // Act
    render(<Solitaire />);
    // click the draw pile element
    const drawElem = screen.getByTestId("play-area").querySelector("#draw") as HTMLElement;
    expect(drawElem).toBeInTheDocument();

    act(() => {
      fireEvent.click(drawElem);
    });

    // Assert
    expect(spy).toHaveBeenCalled();
    act(() => {
      // Wrapping this in act() call to avoid console warnings
      useGameStore.setState(state => ({ actions: { ...state.actions, drawCard: original } }));
    });
  });

  it("animated draw delays the waste update until the animation completes", () => {
    vi.useFakeTimers();

    usePreferencesStore.setState({ cardAnimationEnabled: true });
    useGameStore.setState({
      playfield: {
        draw: [{ rank: "ace", suit: "hearts", face: "down" }],
        waste: [],
        foundation: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
      }
    });

    render(<Solitaire />);

    const playArea = screen.getByTestId("play-area");
    const drawElem = playArea.querySelector("#draw") as HTMLElement;
    const wasteElem = playArea.querySelector("#waste") as HTMLElement;

    expect(drawElem.childNodes.length).toBe(1);
    expect(wasteElem.childNodes.length).toBe(0);

    act(() => {
      fireEvent.click(drawElem);
    });

    expect(wasteElem.childNodes.length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(wasteElem.childNodes.length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(75);
    });

    expect(wasteElem.childNodes.length).toBe(1);

    vi.useRealTimers();
  });

  it("dragStart sets cardData on dataTransfer", () => {
    // Arrange
    // Ensure there is a game with cards
    act(() => useGameStore.getState().actions.newGame());

    // Act
    render(<Solitaire />);

    // Assert
    const firstCard = document.querySelector(".card[data-carddata]") as HTMLElement;
    expect(firstCard).toBeTruthy();

    // Arrange
    const setData = vi.fn();
    const clearData = vi.fn();
    const dataTransfer = { setData, clearData, effectAllowed: "" };

    // Act
    act(() => {
      fireEvent.dragStart(firstCard, { dataTransfer });
    });

    // Assert
    expect(setData).toHaveBeenCalled();
  });

  it("dropping a king onto an empty tableau calls moveCard", () => {
    // Arrange
    // Prepare a playfield with empty tableau
    useGameStore.setState({
      playfield: {
        draw: [],
        waste: [],
        foundation: [[], [], [], []],
        tableau: [[], [], [], [], [], [], []],
      }
    });

    // Act
    const moveOriginal = useGameStore.getState().actions.moveCard;
    const moveSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
    render(<Solitaire />);

    // create a fake drag event with king
    const data = JSON.stringify({ rank: "king", suit: "hearts", cardIndex: 0, pileIndex: -1, pileType: "draw" });
    const dataTransfer = { getData: () => data };
    const target = screen.getByTestId("play-area").querySelector("#tabpile0") as HTMLElement;

    // Assert
    expect(target).toBeTruthy();

    // Act
    act(() => {
      fireEvent.drop(target, { dataTransfer });
    });

    // Assert
    expect(moveSpy).toHaveBeenCalled();
    act(() => {
      // Wrapping this in act() call to avoid console warnings
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveOriginal } }));
    });
  });

  it("waste pile class changes with count", () => {
    // Arrange
    useGameStore.setState({ playfield: { ...useGameStore.getState().playfield, waste: [{ rank: "ace", suit: "hearts", face: "up" }, { rank: "2", suit: "hearts", face: "up" }] } });
    render(<Solitaire />);
    const waste = screen.getByTestId("play-area").querySelector("#waste") as HTMLElement;
    expect(waste.className).toEqual("offset-one");

    // Act
    act(() => {
      useGameStore.setState({ playfield: { ...useGameStore.getState().playfield, waste: [{ rank: "ace", suit: "hearts", face: "up" }, { rank: "2", suit: "hearts", face: "up" }, { rank: "5", suit: "clubs", face: "up" }] } });
    });
    const waste2 = screen.getByTestId("play-area").querySelector("#waste") as HTMLElement;

    // Assert
    expect(waste2.className).toEqual("offset-two");
  });

  it("pressing Esc key closes the menu", () => {
    // Arrange
    const toggleOriginal = useGameStore.getState().actions.toggleMenu;
    const spy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, toggleMenu: spy } }));

    render(<Solitaire />);
    const area = screen.getByTestId("play-area");

    // Act
    act(() => {
      fireEvent.keyDown(area, { key: "Escape" });
    });

    // Assert
    expect(spy).toHaveBeenCalled();
    useGameStore.setState(state => ({ actions: { ...state.actions, toggleMenu: toggleOriginal } }));
  });

  it("tableau tap prefers moving the tapped run when legal", () => {
    const moveOriginal = useGameStore.getState().actions.moveCard;
    const moveSpy = vi.fn();
    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[], [], [], []],
          tableau: [
            [
              { rank: "8", suit: "clubs", face: "up" },
              { rank: "7", suit: "hearts", face: "up" },
            ],
            [{ rank: "8", suit: "spades", face: "up" }],
            [{ rank: "9", suit: "diamonds", face: "up" }],
            [],
            [],
            [],
            [],
          ],
        }
      });
    });

    render(<Solitaire />);

    const tappedCard = screen.getByTestId("play-area").querySelector("#tabpile0 .card") as HTMLElement;
    expect(tappedCard).toBeTruthy();

    act(() => {
      fireEvent.click(tappedCard);
    });

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(moveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ rank: "8", suit: "clubs", face: "up" }),
      "tableau",
      2,
      "tableau",
      0,
      0,
    );

    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveOriginal } }));
    });
  });

  it("tableau tap falls back to progressively shorter runs", () => {
    const moveOriginal = useGameStore.getState().actions.moveCard;
    const moveSpy = vi.fn();
    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[], [], [], []],
          tableau: [
            [
              { rank: "9", suit: "clubs", face: "up" },
              { rank: "8", suit: "hearts", face: "up" },
              { rank: "7", suit: "clubs", face: "up" },
            ],
            [{ rank: "8", suit: "diamonds", face: "up" }],
            [{ rank: "9", suit: "spades", face: "up" }],
            [],
            [],
            [],
            [],
          ],
        }
      });
    });

    render(<Solitaire />);

    const tappedCard = screen.getByTestId("play-area").querySelector("#tabpile0 .card") as HTMLElement;
    expect(tappedCard).toBeTruthy();

    act(() => {
      fireEvent.click(tappedCard);
    });

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(moveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ rank: "8", suit: "hearts", face: "up" }),
      "tableau",
      2,
      "tableau",
      0,
      1,
    );

    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveOriginal } }));
    });
  });

  it("tableau tap does not move when no run from tap point has a legal destination", () => {
    const moveOriginal = useGameStore.getState().actions.moveCard;
    const moveSpy = vi.fn();
    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[], [], [], []],
          tableau: [
            [
              { rank: "9", suit: "clubs", face: "up" },
              { rank: "8", suit: "hearts", face: "up" },
            ],
            [{ rank: "queen", suit: "spades", face: "up" }],
            [{ rank: "4", suit: "diamonds", face: "up" }],
            [],
            [],
            [],
            [],
          ],
        }
      });
    });

    render(<Solitaire />);

    const tappedCard = screen.getByTestId("play-area").querySelector("#tabpile0 .card") as HTMLElement;
    expect(tappedCard).toBeTruthy();

    act(() => {
      fireEvent.click(tappedCard);
    });

    expect(moveSpy).not.toHaveBeenCalled();

    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveOriginal } }));
    });
  });

  it("tableau tap on top card can fall back to a longer run below it", () => {
    const moveOriginal = useGameStore.getState().actions.moveCard;
    const moveSpy = vi.fn();
    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[], [], [], []],
          tableau: [
            [{ rank: "7", suit: "clubs", face: "up" }],
            [
              { rank: "6", suit: "diamonds", face: "up" },
              { rank: "5", suit: "spades", face: "up" },
            ],
            [],
            [],
            [],
            [],
            [],
          ],
        }
      });
    });

    render(<Solitaire />);

    const sourceCards = screen.getByTestId("play-area").querySelectorAll("#tabpile1 .card");
    const tappedTopCard = sourceCards[sourceCards.length - 1] as HTMLElement;
    expect(tappedTopCard).toBeTruthy();

    act(() => {
      fireEvent.click(tappedTopCard);
    });

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(moveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ rank: "6", suit: "diamonds", face: "up" }),
      "tableau",
      0,
      "tableau",
      1,
      0,
    );

    act(() => {
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveOriginal } }));
    });
  });

  // ---------------------------------------------------------------------------
  // Auto-collect feature tests
  // ---------------------------------------------------------------------------

  describe("auto-collect", () => {
    it("moves a safe card to foundation when auto-collect is enabled", () => {
      // Arrange: ace on waste, auto-collect on, animations off.
      const moveSpy = vi.fn();
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
      });

      // Act: render triggers the playfieldState useEffect → runAutoCollect.
      render(<Solitaire />);

      // Assert: auto-collect should have dispatched moveCard for the ace.
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "ace", suit: "hearts" }),
        "foundation",
        0,
        "waste",
        0,
        0,
      );
    });

    it("does not move any card when auto-collect is disabled", () => {
      // Arrange: same playfield as above, but auto-collect disabled.
      const moveSpy = vi.fn();
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: false });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
      });

      render(<Solitaire />);

      expect(moveSpy).not.toHaveBeenCalled();
    });

    it("does not move a card that is unsafe (rank too far ahead)", () => {
      // Arrange: foundation at "2"; "5" on waste — legal but not safe.
      const moveSpy = vi.fn();
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "5", suit: "hearts", face: "up" }],
          foundation: [
            [{ rank: "ace", suit: "hearts", face: "up" }, { rank: "2", suit: "hearts", face: "up" }],
            [], [], [],
          ],
          tableau: [[], [], [], [], [], [], []],
        },
      });

      render(<Solitaire />);

      expect(moveSpy).not.toHaveBeenCalled();
    });

    it("picks up a tableau top card before a waste candidate (left-to-right scan)", () => {
      // Arrange: ace on both tableau col 0 and waste; ace should come from tableau first.
      const moveSpy = vi.fn();
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "ace", suit: "diamonds", face: "up" }],
          foundation: [[], [], [], []],
          tableau: [
            [{ rank: "ace", suit: "clubs", face: "up" }],
            [], [], [], [], [], [],
          ],
        },
      });

      render(<Solitaire />);

      // The tableau ace (clubs) should be chosen before the waste ace (diamonds).
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "ace", suit: "clubs" }),
        "foundation",
        expect.any(Number),
        "tableau",
        0,
        0,
      );
    });

    it("does not run auto-collect after undo", () => {
      // Arrange: ace of hearts on foundation after one move was made.
      // undoQueue has that move recorded.
      const moveSpy = vi.fn();
      usePreferencesStore.setState({ autoCollectEnabled: true });
      useGameStore.setState(state => ({
        actions: { ...state.actions, moveCard: moveSpy },
        playfield: {
          draw: [],
          waste: [],
          foundation: [[{ rank: "ace", suit: "hearts", face: "up" }], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
        // Record an undo entry so the undo action can restore the ace to waste.
        undoQueue: [{
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
        }],
        redoQueue: [],
      }));

      render(<Solitaire />);

      // No candidates on initial render (waste empty, no tableau cards).
      expect(moveSpy).not.toHaveBeenCalled();

      // Act: undo restores the ace to waste — a prime auto-collect target.
      act(() => {
        useGameStore.getState().actions.undo();
      });

      // Assert: auto-collect must NOT have fired after the undo.
      expect(moveSpy).not.toHaveBeenCalled();
    });

    it("does not run auto-collect after redo", () => {
      // Arrange: empty state suitable to set up a redo scenario.
      const moveSpy = vi.fn();
      usePreferencesStore.setState({ autoCollectEnabled: true });
      // Place ace on waste; set redoQueue so redo can be exercised.
      useGameStore.setState(state => ({
        actions: { ...state.actions, moveCard: moveSpy },
        playfield: {
          draw: [],
          waste: [],
          foundation: [[{ rank: "ace", suit: "hearts", face: "up" }], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
        undoQueue: [],
        redoQueue: [{
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
        }],
      }));

      render(<Solitaire />);
      expect(moveSpy).not.toHaveBeenCalled();

      // Act: redo applies the forward move and changes playfieldState.
      // The resulting state still has a candidate (the ace moves back to waste on undo/redo
      // book-keeping), but auto-collect must not fire.
      act(() => {
        useGameStore.getState().actions.redo();
      });

      expect(moveSpy).not.toHaveBeenCalled();
    });

    it("skips one auto-collect turn after a manual foundation-to-tableau move", () => {
      const realMoveCard = useGameStore.getState().actions.moveCard;
      const moveSpy = vi.fn((...args: Parameters<typeof realMoveCard>) => realMoveCard(...args));

      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true, cardAnimationEnabled: false });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[
            { rank: "ace", suit: "hearts", face: "up" },
            { rank: "2", suit: "hearts", face: "up" },
          ], [], [], []],
          tableau: [
            [{ rank: "3", suit: "clubs", face: "up" }],
            [], [], [], [], [], [],
          ],
        },
      });

      render(<Solitaire />);

      // Click the top foundation card (2 of hearts), which is a legal move to tableau.
      const foundationTopCard = screen.getByTestId("play-area").querySelector("#fpile0 .card:last-child") as HTMLElement;
      act(() => {
        fireEvent.click(foundationTopCard);
      });

      // The manual foundation -> tableau move should happen.
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "2", suit: "hearts" }),
        "tableau",
        0,
        "foundation",
        0,
        1,
      );

      // Auto-collect must not immediately reverse that move back to foundation.
      expect(moveSpy).toHaveBeenCalledTimes(1);
    });

    it("does not immediately reverse an animated foundation-to-tableau move", () => {
      vi.useFakeTimers();

      const realMoveCard = useGameStore.getState().actions.moveCard;
      const moveSpy = vi.fn((...args: Parameters<typeof realMoveCard>) => realMoveCard(...args));

      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true, cardAnimationEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [],
          foundation: [[
            { rank: "ace", suit: "clubs", face: "up" },
            { rank: "2", suit: "clubs", face: "up" },
            { rank: "3", suit: "clubs", face: "up" },
            { rank: "4", suit: "clubs", face: "up" },
          ], [], [], []],
          tableau: [
            [{ rank: "5", suit: "hearts", face: "up" }],
            [], [], [], [], [], [],
          ],
        },
      });

      render(<Solitaire />);

      // User moves 4 of clubs from foundation to tableau.
      const foundationTopCard = screen.getByTestId("play-area").querySelector("#fpile0 .card:last-child") as HTMLElement;
      act(() => {
        fireEvent.click(foundationTopCard);
      });

      // Advance enough time for the manual animation to commit and any immediate
      // follow-up auto-collect animation/commit to occur if buggy.
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Only the manual move should have been committed.
      expect(moveSpy).toHaveBeenCalledTimes(1);
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "4", suit: "clubs" }),
        "tableau",
        0,
        "foundation",
        0,
        3,
      );

      vi.useRealTimers();
    });

    it("blocks pile taps while auto-collect animation is in progress", () => {
      vi.useFakeTimers();

      // Arrange: animations enabled so auto-collect uses the overlay path and
      // movingCards stays non-empty until the timer fires.
      const realMoveCard = useGameStore.getState().actions.moveCard;
      const moveSpy = vi.fn((...args: Parameters<typeof realMoveCard>) => realMoveCard(...args));
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true, cardAnimationEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
          // King in tableau provides a tap target that would trigger moveCard
          // if the click were not blocked.
          tableau: [
            [{ rank: "king", suit: "clubs", face: "up" }],
            [], [], [], [], [], [],
          ],
        },
      });

      render(<Solitaire />);

      // Auto-collect has started animating the ace; timer not yet advanced.
      // Tap the king — should be blocked because autoCollectingRef is true.
      const kingCard = screen.getByTestId("play-area").querySelector("#tabpile0 .card") as HTMLElement;
      act(() => {
        fireEvent.click(kingCard);
      });

      // moveSpy must not have been called yet (animation pending, click blocked).
      expect(moveSpy).not.toHaveBeenCalled();

      // Advance past the animation duration to let the auto-collect commit.
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Now the ace commit should have fired.
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "ace", suit: "hearts" }),
        "foundation",
        expect.any(Number),
        "waste",
        expect.any(Number),
        expect.any(Number),
      );

      vi.useRealTimers();
    });

    it("blocks drops while auto-collect animation is in progress", () => {
      vi.useFakeTimers();

      const realMoveCard = useGameStore.getState().actions.moveCard;
      const moveSpy = vi.fn((...args: Parameters<typeof realMoveCard>) => realMoveCard(...args));
      useGameStore.setState(state => ({ actions: { ...state.actions, moveCard: moveSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true, cardAnimationEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [],
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
      });

      render(<Solitaire />);

      // Auto-collect is animating. Attempt a drop onto tableau pile 0.
      const tabPile = screen.getByTestId("play-area").querySelector("#tabpile0") as HTMLElement;
      const kingData = JSON.stringify({ rank: "king", suit: "spades", cardIndex: 0, pileIndex: undefined, pileType: "waste" });
      act(() => {
        fireEvent.drop(tabPile, { dataTransfer: { getData: () => kingData } });
      });

      expect(moveSpy).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Only the auto-collect ace commit should have fired.
      expect(moveSpy).toHaveBeenCalledTimes(1);
      expect(moveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rank: "ace", suit: "hearts" }),
        "foundation",
        expect.any(Number),
        "waste",
        expect.any(Number),
        expect.any(Number),
      );

      vi.useRealTimers();
    });

    it("blocks draw-pile clicks while auto-collect animation is in progress", () => {
      vi.useFakeTimers();

      const realDrawCard = useGameStore.getState().actions.drawCard;
      const drawSpy = vi.fn(realDrawCard);
      useGameStore.setState(state => ({ actions: { ...state.actions, drawCard: drawSpy } }));
      usePreferencesStore.setState({ autoCollectEnabled: true, cardAnimationEnabled: true });
      useGameStore.setState({
        playfield: {
          draw: [{ rank: "2", suit: "clubs", face: "down" }],
          waste: [{ rank: "ace", suit: "hearts", face: "up" }],
          foundation: [[], [], [], []],
          tableau: [[], [], [], [], [], [], []],
        },
      });

      render(<Solitaire />);

      // Auto-collect is running. Clicking the draw pile must be blocked.
      const drawElem = screen.getByTestId("play-area").querySelector("#draw") as HTMLElement;
      act(() => {
        fireEvent.click(drawElem);
      });

      expect(drawSpy).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(350);
      });

      vi.useRealTimers();
    });
  });
});
