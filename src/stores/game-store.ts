import { persist } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";
import { CardData } from "../types/card-data";
import { ModalTypes } from "../types/modal-types";
import { PileTypes } from "../types/pile-types";
import { PlayfieldState } from "../types/playfield-state";
import { getRandomGameNumber, shuffleDeckWithGameNumber } from "../utils/deck-shuffler";
import { pickRandomSolvableGameNumber } from "../utils/solvability-table";
import usePreferencesStore from "./preferences-store";
import useStatisticsStore from "./statistics-store";

/** Template for an empty playfield used to reset or initialize state. */
const emptyPlayArea: PlayfieldState = {
    draw: [],
    waste: [],
    foundation: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
};

type GameStoreState = {
    /** Current playfield layout (draw, waste, foundation, tableau). */
    playfield: PlayfieldState;
    /** The current shuffled deck not yet dealt. */
    shuffledDeck: CardData[];
    /** Current game number seed used to produce the shuffled deck. */
    currentGameNumber: number | null;
    /** Stack of prior playfield states used for undo operations. */
    undoQueue: Partial<PlayfieldState>[];
    /** Stack of undone playfield states used for redo operations. */
    redoQueue: Partial<PlayfieldState>[];
    /** Last action type that updated the playfield. */
    lastPlayfieldUpdateType: "init" | "deal" | "draw" | "move" | "undo" | "redo";
    /** Optional modal currently displayed (e.g., 'gamewin'). */
    modalType?: ModalTypes;
    /** Whether the main menu is visible. */
    menuVisible: boolean;
    /** Identifier of the currently opened submenu (empty string when none). */
    submenuId: string;
    /** Elapsed game time in seconds. */
    gameTimer: number;
    /** Interval id for the game timer, if running. */
    timerId?: number | null;

    /** Grouped store actions */
    actions: {
        /**
         * Toggle the main menu visibility.
         * @param hideMenus When true, hide menus and clear any open submenu.
         */
        toggleMenu: (hideMenus?: boolean) => void;

        /**
         * Open or close a submenu by ID. Passing falsy clears the submenu.
         * @param id Submenu identifier or undefined/null to clear.
         */
        toggleSubmenu: (id?: string | null) => void;

        /** Clear the active submenu. */
        clearSubmenu: () => void;

        /** Shuffle a new deck into `shuffledDeck` and return selected game number. */
        shuffleDeck: () => Promise<number>;

        /** Deal the shuffled deck into the tableau and draw piles. */
        dealDeck: () => void;

        /** Start a brand new game: shuffle, deal and start timer. */
        newGame: () => Promise<void>;

        /** Pause the game timer if the game is in progress. */
        pauseGame: () => void;

        /** Resume a previously paused game timer. */
        resumeGame: () => void;

        /** Restart the current game (deal again and reset timer). */
        restartGame: () => void;

        /** Quit the current game and reset play state. */
        quitGame: () => void;

        /** Draw a card from the draw pile to the waste (or recycle waste). */
        drawCard: () => void;

        /**
         * Move one or more cards from a source pile to a target pile.
         * @param sourceCardData The card metadata representing the source card.
         * @param targetPileType The destination pile type (foundation/tableau/waste).
         * @param targetPileIndex Index of the destination pile.
         * @param sourcePileType Optional explicit source pile type (defaults to value on `sourceCardData`).
         * @param sourcePileIndex Optional explicit source pile index (defaults to value on `sourceCardData`).
         * @param sourceCardIndex Optional index within the source pile to move from (defaults to value on `sourceCardData`).
         */
        moveCard: (
            sourceCardData: CardData,
            targetPileType: PileTypes,
            targetPileIndex: number,
            sourcePileType?: PileTypes,
            sourcePileIndex?: number,
            sourceCardIndex?: number
        ) => void;

        /** Called after persistent storage has been rehydrated. */
        onStorageRehydrated: () => void;

        /** Undo the last playfield change. */
        undo: () => void;

        /** Redo the last undone playfield change. */
        redo: () => void;

        /** Reset the in-game timer to zero and stop it. */
        resetTimer: () => void;

        /** Start the in-game timer (increments `gameTimer` every second). */
        startTimer: () => void;

        /** Stop the in-game timer. */
        stopTimer: () => void;

        /** Validate and update derived game state (flipping cards, win check). */
        checkGameState: () => void;
    };
};

export const useGameStore = createWithEqualityFn<GameStoreState>()(
    persist(
        (set, get) => ({
            playfield: emptyPlayArea,
            shuffledDeck: [],
            currentGameNumber: null,
            undoQueue: [],
            redoQueue: [],
            lastPlayfieldUpdateType: "init",
            modalType: undefined,
            menuVisible: true,
            submenuId: "",
            gameTimer: 0,
            timerId: null,

            actions: {
                /**
                 * Invoked after the state has been rehydrated from persistent storage.
                 * Handles resuming or cleaning up timer and modal state after hydration.
                 */
                onStorageRehydrated: () => {
                    const modalType = get().modalType;
                    if (modalType === "gamewin") {
                        get().actions.resetTimer();
                        get().actions.quitGame();
                        return;
                    }

                    const timer = get().gameTimer;
                    const menuVisible = get().menuVisible;
                    if (!menuVisible && (timer > 0 || get().shuffledDeck?.length > 0)) {
                        get().actions.startTimer();
                    }
                },

                /**
                 * Toggle the main menu visibility. Optionally force-hide menus and clear submenu.
                 * @param hideMenus When true, hide menus and clear submenu state.
                 */
                toggleMenu: (hideMenus = false) => {
                    if (hideMenus) {
                        set(() => ({ menuVisible: false, submenuId: "" }));
                        get().actions.resumeGame();
                        return;
                    }

                    // Opening the menu should pause the game. Closing it should resume the game.
                    // Do not pause/resume the game if the modal is open
                    const menuVisible = get().menuVisible;
                    const modalType = get().modalType;
                    if (!modalType) {
                        if (menuVisible) {
                            get().actions.resumeGame();
                        } else {
                            get().actions.pauseGame();
                        }
                    }

                    // Toggle the menu value
                    set(() => ({ menuVisible: !menuVisible }));
                },

                /**
                 * Toggle a submenu by id. Calling with no id clears the submenu.
                 * @param id Submenu identifier to open, or undefined/null to clear.
                 */
                toggleSubmenu: (id?: string | null) => {
                    if (!id) {
                        set(() => ({ submenuId: "" }));
                        return;
                    }

                    const state = get();
                    if (state.submenuId) {
                        const oldId = state.submenuId;
                        set(() => ({ submenuId: "" }));
                        if (oldId === id) return;
                    }

                    set(() => ({ submenuId: id }));
                },

                /** Clear the currently active submenu. */
                clearSubmenu: () => {
                    set(() => ({ submenuId: "" }));
                },

                /**
                 * Shuffle a deck from a selected game number seed.
                 * If solvable-only is enabled, picks a random game number known to be solvable.
                 *
                 * @returns The selected game number used to generate `shuffledDeck`
                 */
                shuffleDeck: async () => {
                    const prefs = usePreferencesStore.getState();
                    // Branch game-number selection based on current user preference.
                    const gameNumber = prefs.solvableOnlyEnabled
                        ? await pickRandomSolvableGameNumber()
                        : getRandomGameNumber();
                    const newDeck = shuffleDeckWithGameNumber(gameNumber);

                    set(() => ({
                        shuffledDeck: newDeck,
                        currentGameNumber: gameNumber,
                    }));

                    return gameNumber;
                },

                /**
                 * Deal the shuffled deck into the tableau piles and prepare the draw pile.
                 */
                dealDeck: () => {
                    const deck = (get().shuffledDeck || []).slice();
                    deck.forEach(c => (c.face = "down"));

                    let cardsToDeal = 1;
                    let cardIndex = 0;
                    const tableauCardData: CardData[][] = [];
                    for (let i = 0; i < 7; i++) {
                        const cardDataList: CardData[] = [];
                        for (let k = 0; k < cardsToDeal; k++) {
                            cardDataList.push(deck[cardIndex++]);
                        }
                        cardsToDeal++;
                        tableauCardData.push(cardDataList);
                    }

                    const drawPileCardData = deck.slice(cardIndex).reverse();

                    set(() => ({
                        playfield: { draw: drawPileCardData, tableau: tableauCardData, waste: [], foundation: [[], [], [], []] },
                        undoQueue: [],
                        redoQueue: [],
                        lastPlayfieldUpdateType: "deal",
                    }));

                    get().actions.checkGameState();
                },

                /**
                 * Start a new game: clear modal, reset timer, shuffle and deal the deck, then start timer.
                 */
                newGame: async () => {
                    set(() => ({ modalType: undefined }));
                    get().actions.stopTimer();
                    get().actions.resetTimer();
                    // Await so the deck/game number state is ready before dealing starts.
                    await get().actions.shuffleDeck();
                    get().actions.dealDeck();
                    get().actions.startTimer();
                },

                /**
                 * Pause the game timer if the game is in progress.
                 */
                pauseGame: () => {
                    if (get().timerId) {
                        get().actions.stopTimer();
                    }
                },

                /**
                 * Resume a previously paused game timer.
                 * Only resumes if a game is actually in progress (timer has advanced or a deck exists).
                 */
                resumeGame: () => {
                    if ((get().gameTimer > 0 || get().shuffledDeck.length > 0) && !get().timerId) {
                        get().actions.startTimer();
                    }
                },

                /** Restart the current game state by re-dealing and resetting the timer. */
                restartGame: () => {
                    set(() => ({ modalType: undefined }));
                    get().actions.stopTimer();
                    get().actions.resetTimer();
                    get().actions.dealDeck();
                    get().actions.startTimer();
                },

                /** Quit the current game and reset playfield and deck state. */
                quitGame: () => {
                    set(() => ({ modalType: undefined, shuffledDeck: [], currentGameNumber: null, playfield: emptyPlayArea, undoQueue: [], redoQueue: [] }));
                    get().actions.stopTimer();
                    get().actions.resetTimer();
                },

                /**
                 * Draw one card from the draw pile to the waste. If draw is empty and waste has cards,
                 * recycle the waste back into the draw pile (face-down).
                 */
                drawCard: () => {
                    const playfield = structuredClone(get().playfield);
                    const undoPileData: Partial<PlayfieldState> = {
                        draw: structuredClone(playfield.draw),
                        waste: structuredClone(playfield.waste),
                    };
                    const undoQueue = structuredClone(get().undoQueue || []);
                    undoQueue.push(undoPileData);

                    if (!playfield.draw.length && playfield.waste.length) {
                        playfield.draw = playfield.waste.reverse().map((c: CardData) => {
                            c.face = "down";
                            return c;
                        });
                        playfield.waste = [];
                    } else if (playfield.draw.length) {
                        const last = playfield.draw.pop();
                        if (last) {
                            playfield.waste.push(last);
                        }
                    }

                    set(() => ({
                        playfield,
                        undoQueue: undoQueue,
                        lastPlayfieldUpdateType: "draw",
                    }));
                    get().actions.checkGameState();
                },

                /**
                 * Move one or more cards from a source pile to a target pile and record undo data.
                 * @param sourceCardData The card data object representing the moved card.
                 * @param targetPileType Destination pile type ('foundation'|'tableau'|'waste').
                 * @param targetPileIndex Destination pile index.
                 * @param sourcePileType Optional explicit source pile type (defaults to value in `sourceCardData`).
                 * @param sourcePileIndex Optional explicit source pile index (defaults to value in `sourceCardData`).
                 * @param sourceCardIndex Optional index within the source pile to move from.
                 */
                moveCard: (sourceCardData, targetPileType, targetPileIndex, sourcePileType = sourceCardData.pileType as PileTypes, sourcePileIndex = sourceCardData.pileIndex || 0, sourceCardIndex = sourceCardData.cardIndex || 0) => {
                    if (!sourcePileType || sourcePileIndex < 0 || sourceCardIndex < 0) return;

                    const newPlayfield = structuredClone(get().playfield);
                    let cardsToMove: CardData[] = [];

                    switch (sourcePileType) {
                        case "foundation":
                        case "tableau":
                            cardsToMove = newPlayfield[sourcePileType][sourcePileIndex].slice(sourceCardIndex);
                            newPlayfield[sourcePileType][sourcePileIndex] = newPlayfield[sourcePileType][sourcePileIndex].slice(0, sourceCardIndex);
                            break;
                        case "waste":
                            cardsToMove = newPlayfield.waste.slice(sourceCardIndex);
                            newPlayfield.waste = newPlayfield.waste.slice(0, sourceCardIndex);
                            break;
                        default:
                            return;
                    }

                    cardsToMove.forEach(c => (c.face = "up"));

                    switch (targetPileType) {
                        case "foundation":
                        case "tableau":
                            newPlayfield[targetPileType][targetPileIndex] = newPlayfield[targetPileType][targetPileIndex].concat(cardsToMove);
                            break;
                        case "waste":
                            newPlayfield.waste = newPlayfield.waste.concat(cardsToMove);
                            break;
                        default:
                            return;
                    }

                    const undoPileData: Partial<PlayfieldState> = {};
                    undoPileData[sourcePileType] = structuredClone(get().playfield[sourcePileType]);
                    if (sourcePileType !== targetPileType) {
                        undoPileData[targetPileType] = structuredClone(get().playfield[targetPileType]);
                    }

                    const undoQueue = structuredClone(get().undoQueue || []);
                    undoQueue.push(undoPileData);

                    set(() => ({
                        playfield: newPlayfield,
                        undoQueue: undoQueue,
                        redoQueue: [],
                        lastPlayfieldUpdateType: "move",
                    }));
                    get().actions.checkGameState();
                },

                /** Undo the last change to the playfield by applying the top of `undoQueue`. */
                undo: () => {
                    const undoQueue = structuredClone(get().undoQueue || []);
                    if (!undoQueue.length) return;

                    const lastMoveData = undoQueue.pop() as Partial<PlayfieldState>;
                    const current = structuredClone(get().playfield);
                    const redoMoveData: Partial<PlayfieldState> = {};

                    if (lastMoveData) {
                        Object.keys(lastMoveData).forEach(key => {
                            const k = key as keyof PlayfieldState;
                            redoMoveData[k] = structuredClone(current[k]);
                            const newVal = lastMoveData[k];
                            if (newVal !== undefined) {
                                current[k] = structuredClone(newVal) as PlayfieldState[typeof k];
                            }
                        });
                    }

                    const redoQueue = structuredClone(get().redoQueue || []);
                    redoQueue.push(redoMoveData);

                    set(() => ({
                        playfield: current,
                        undoQueue: undoQueue,
                        redoQueue: redoQueue,
                        lastPlayfieldUpdateType: "undo",
                    }));
                },

                /** Redo the last undone change by applying the top of `redoQueue`. */
                redo: () => {
                    const redoQueue = structuredClone(get().redoQueue || []);
                    if (!redoQueue.length) return;

                    const lastMoveData = redoQueue.pop() as Partial<PlayfieldState>;
                    const current = structuredClone(get().playfield);
                    const undoMoveData: Partial<PlayfieldState> = {};

                    if (lastMoveData) {
                        Object.keys(lastMoveData).forEach(key => {
                            const k = key as keyof PlayfieldState;
                            undoMoveData[k] = structuredClone(current[k]);
                            const newVal = lastMoveData[k];
                            if (newVal !== undefined) {
                                current[k] = structuredClone(newVal) as PlayfieldState[typeof k];
                            }
                        });
                    }

                    const undoQueue = structuredClone(get().undoQueue || []);
                    undoQueue.push(undoMoveData);

                    set(() => ({
                        playfield: current,
                        undoQueue: undoQueue,
                        redoQueue: redoQueue,
                        lastPlayfieldUpdateType: "redo",
                    }));
                },

                /** Reset the game timer to zero and stop it. */
                resetTimer: () => {
                    get().actions.stopTimer();
                    set(() => ({ gameTimer: 0 }));
                },

                /** Start the game timer; increments `gameTimer` every second. */
                startTimer: () => {
                    get().actions.stopTimer();

                    if (!usePreferencesStore.getState().gameTimerEnabled) {
                        return;
                    }

                    const id = window.setInterval(() => {
                        set(state => ({ gameTimer: state.gameTimer + 1 }));
                    }, 1000);
                    set((state) => ({ timerId: id, gameTimer: state.gameTimer }));
                },

                /** Stop the game timer interval if running. */
                stopTimer: () => {
                    const id = get().timerId;
                    if (id) {
                        clearInterval(id);
                    }

                    set(() => ({ timerId: null }));
                },

                /**
                 * Inspect playfield to detect game win and flip face-down cards where appropriate.
                 * On win, records statistics and sets the `gamewin` modal.
                 */
                checkGameState: () => {
                    const playfield = structuredClone(get().playfield);
                    let numFoundationCards = 0;
                    playfield.foundation.forEach(pile => (numFoundationCards += pile.length));

                    if (numFoundationCards === 52) {
                        get().actions.stopTimer();

                        // Log the win and time with the stats store
                        useStatisticsStore.getState().actions.recordWin(get().gameTimer);

                        // Set the modal type for a game win
                        set(() => ({ modalType: "gamewin" }));
                        return;
                    }

                    let updatePlayfield = false;

                    playfield.tableau = playfield.tableau.map(cardDataList => {
                        return cardDataList.map((cardData: CardData, cardIndex: number) => {
                            const lastCard = cardIndex + 1 === cardDataList.length;
                            if (lastCard && cardData.face !== "up") {
                                updatePlayfield = true;
                                cardData.face = "up";
                            }
                            return cardData;
                        });
                    });

                    playfield.waste = playfield.waste.map((cardData, cardIndex) => {
                        const lastCard = cardIndex + 1 === playfield.waste.length;
                        if (lastCard && cardData.face !== "up") {
                            updatePlayfield = true;
                            cardData.face = "up";
                        }
                        return cardData;
                    });

                    if (updatePlayfield) {
                        set(() => ({ playfield }));
                    }
                },
            },
        }),
        {
            name: "sol-store",
            partialize: (state) => ({
                gameTimer: state.gameTimer,
                modalType: state.modalType,
                playfield: state.playfield,
                redoQueue: state.redoQueue,
                shuffledDeck: state.shuffledDeck,
                currentGameNumber: state.currentGameNumber,
                undoQueue: state.undoQueue,
                menuVisible: state.menuVisible
            }),
            onRehydrateStorage: () => (state, error) => {
                state?.actions?.onStorageRehydrated?.();
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                }
            },
            version: 4
        },
    ),
)

export default useGameStore;
