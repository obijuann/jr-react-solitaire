import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';
import { CardData } from '../types/card-data';
import { ModalTypes } from '../types/modal-types';
import { PileTypes } from '../types/pile-types';
import { PlayfieldState } from '../types/playfield-state';
import { Ranks } from '../types/ranks';
import { Suits } from '../types/suits';

/** Ordered ranks from lowest to highest used for game rules. */
const ranks: Ranks[] = [
    'ace',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'jack',
    'queen',
    'king',
];

/** Template for an empty playfield used to reset or initialize state. */
const emptyPlayArea: PlayfieldState = {
    draw: [],
    waste: [],
    foundation: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
};

type StoreState = {
    /** Current playfield layout (draw, waste, foundation, tableau). */
    playfield: PlayfieldState;
    /** The current shuffled deck not yet dealt. */
    shuffledDeck: CardData[];
    /** Stack of prior playfield states used for undo operations. */
    undoQueue: Partial<PlayfieldState>[];
    /** Stack of undone playfield states used for redo operations. */
    redoQueue: Partial<PlayfieldState>[];
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

    // Actions
    setPlayfield: (p: Partial<PlayfieldState>) => void;
    toggleMenu: (hideMenus?: boolean) => void;
    toggleSubmenu: (id?: string | null) => void;
    clearSubmenu: () => void;
    shuffleDeck: () => void;
    dealDeck: () => void;
    newGame: () => void;
    restartGame: () => void;
    quitGame: () => void;
    drawCard: () => void;
    moveCard: (
        sourceCardData: CardData,
        targetPileType: PileTypes,
        targetPileIndex: number,
        sourcePileType?: PileTypes,
        sourcePileIndex?: number,
        sourceCardIndex?: number
    ) => void;
    onStorageRehydrated: () => void,
    undo: () => void;
    redo: () => void;
    startTimer: (resetTime?: boolean) => void;
    stopTimer: (resetTime?: boolean) => void;
    checkGameState: () => void;
};

/**
 * Application store created with Zustand. Holds game playfield state,
 * menu visibility, submenu id, timer and exposes actions for game play.
 */
export const useStore = createWithEqualityFn<StoreState>()(
    persist(
        (set, get) => ({
            playfield: emptyPlayArea,
            shuffledDeck: [],
            undoQueue: [],
            redoQueue: [],
            modalType: undefined,
            menuVisible: true,
            submenuId: "",
            gameTimer: 0,
            timerId: null,

            /**
             * Invoked after the state has been rehydrated from persistent storage.
             */
            onStorageRehydrated: () => {
                // If the timer is non-zero, or the deck is shuffled, it indicates a game in progress.
                // Restart the game timer.
                const timer = get().gameTimer;
                if (timer > 0 || get().shuffledDeck?.length > 0) {
                    get().startTimer(false);
                }
            },

            /**
             * Merge a partial playfield object into the current playfield state.
             * @param {Partial<PlayfieldState>} p Partial playfield values to merge
             * @returns {void}
             */
            setPlayfield: (p: Partial<PlayfieldState>) => {
                set(state => ({ playfield: { ...state.playfield, ...p } }));
            },

            /** 
             * Toggle the main menu visibility. If `hideMenus` is true the menu
             * will be closed, otherwise it toggles current visibility.
             */
            toggleMenu: (hideMenus = false) => {
                if (hideMenus) {
                    set(() => ({ menuVisible: false, submenuId: "" }));
                    return;
                }
                set(state => ({ menuVisible: !state.menuVisible }));
            },

            /** Toggle or close a submenu. If `button` is omitted the submenu is closed. */
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

            /**
             * Clear any open submenu.
             */
            clearSubmenu: () => {
                set(() => ({ submenuId: "" }));
            },

            /**
             * Build and shuffle a fresh 52-card deck and store it in `shuffledDeck`.
             */
            shuffleDeck: () => {
                const newDeck: CardData[] = [];
                const suitsList: Suits[] = ["clubs", "diamonds", "hearts", "spades"];

                for (let si = 0; si < suitsList.length; si++) {
                    for (let ri = 0; ri < ranks.length; ri++) {
                        const card: CardData = { rank: ranks[ri], suit: suitsList[si], face: 'down' };
                        newDeck.push(card);
                    }
                }

                for (let i = newDeck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * i);
                    const temp = newDeck[i];
                    newDeck[i] = newDeck[j];
                    newDeck[j] = temp;
                }

                set(() => ({ shuffledDeck: newDeck }));
            },

            /**
             * Deal the shuffled deck into `tableau` and `draw` piles and reset undo/redo.
             */
            dealDeck: () => {
                const deck = (get().shuffledDeck || []).slice();
                deck.forEach(c => (c.face = 'down'));

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
                }));

                // Ensure flipped cards are updated
                get().checkGameState();
            },

            /**
             * Start a new game: reset modals, shuffle, deal and start timer.
             */
            newGame: () => {
                set(() => ({ modalType: undefined }));
                get().stopTimer();
                get().shuffleDeck();
                get().dealDeck();
                get().startTimer();
            },

            /**
             * Restart the current game: redeal the current shuffled deck and restart timer.
             */
            restartGame: () => {
                set(() => ({ modalType: undefined }));
                get().dealDeck();
                get().stopTimer();
                get().startTimer();
            },

            /**
             * Quit the current game and clear playfield and deck.
             */
            quitGame: () => {
                set(() => ({ modalType: undefined, shuffledDeck: [], playfield: emptyPlayArea, undoQueue: [], redoQueue: [] }));
                get().stopTimer();
            },

            /**
             * Draw a card from the draw pile to the waste, or recycle waste back to draw.
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
                        c.face = 'down';
                        return c;
                    });
                    playfield.waste = [];
                } else if (playfield.draw.length) {
                    const last = playfield.draw.pop();
                    last && playfield.waste.push(last);
                }

                set(() => ({ playfield, undoQueue: undoQueue }));
                get().checkGameState();
            },

            /**
             * Move one or more cards from a source pile to a target pile and record undo data.
             */
            moveCard: (sourceCardData, targetPileType, targetPileIndex, sourcePileType = sourceCardData.pileType as PileTypes, sourcePileIndex = sourceCardData.pileIndex || 0, sourceCardIndex = sourceCardData.cardIndex || 0) => {
                if (!sourcePileType || sourcePileIndex < 0 || sourceCardIndex < 0) return;

                const newPlayfield = structuredClone(get().playfield);
                let cardsToMove: CardData[] = [];

                switch (sourcePileType) {
                    case 'foundation':
                    case 'tableau':
                        cardsToMove = newPlayfield[sourcePileType][sourcePileIndex].slice(sourceCardIndex);
                        newPlayfield[sourcePileType][sourcePileIndex] = newPlayfield[sourcePileType][sourcePileIndex].slice(0, sourceCardIndex);
                        break;
                    case 'waste':
                        cardsToMove = newPlayfield.waste.slice(sourceCardIndex);
                        newPlayfield.waste = newPlayfield.waste.slice(0, sourceCardIndex);
                        break;
                    default:
                        return;
                }

                cardsToMove.forEach(c => (c.face = 'up'));

                switch (targetPileType) {
                    case 'foundation':
                    case 'tableau':
                        newPlayfield[targetPileType][targetPileIndex] = newPlayfield[targetPileType][targetPileIndex].concat(cardsToMove);
                        break;
                    case 'waste':
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

                set(() => ({ playfield: newPlayfield, undoQueue: undoQueue, redoQueue: [] }));
                get().checkGameState();
            },

            /**
             * Undo the last recorded move.
             */
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

                set(() => ({ playfield: current, undoQueue: undoQueue, redoQueue: redoQueue }));
            },

            /**
             * Redo the last undone move.
             */
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

                set(() => ({ playfield: current, undoQueue: undoQueue, redoQueue: redoQueue }));
            },

            /**
             * Start the game timer and reset the elapsed time.
             */
            startTimer: (resetTime = true) => {
                get().stopTimer(resetTime);
                const id = window.setInterval(() => {
                    set(state => ({ gameTimer: state.gameTimer + 1 }));
                }, 1000);
                set((state) => ({ timerId: id, gameTimer: resetTime ? 0 : state.gameTimer }));
            },

            /**
             * Stop the game timer and clear the interval.
             */
            stopTimer: (resetTime = true) => {
                const id = get().timerId;
                if (id) {
                    clearInterval(id);
                }

                const timerProps: Partial<StoreState> = { timerId: null };

                if (resetTime) {
                    timerProps.gameTimer = 0;
                }

                set(() => (timerProps));
            },

            /**
             * Inspect the playfield to flip necessary cards and detect a win.
             */
            checkGameState: () => {
                const playfield = structuredClone(get().playfield);
                let numFoundationCards = 0;
                playfield.foundation.forEach(pile => (numFoundationCards += pile.length));

                if (numFoundationCards === 52) {
                    get().stopTimer(false);
                    set(() => ({ modalType: 'gamewin' }));
                    return;
                }

                let updatePlayfield = false;

                playfield.tableau = playfield.tableau.map(cardDataList => {
                    return cardDataList.map((cardData: CardData, cardIndex: number) => {
                        const lastCard = cardIndex + 1 === cardDataList.length;
                        if (lastCard && cardData.face !== 'up') {
                            updatePlayfield = true;
                            cardData.face = 'up';
                        }
                        return cardData;
                    });
                });

                playfield.waste = playfield.waste.map((cardData, cardIndex) => {
                    const lastCard = cardIndex + 1 === get().playfield.waste.length;
                    if (lastCard && cardData.face !== 'up') {
                        updatePlayfield = true;
                        cardData.face = 'up';
                    }
                    return cardData;
                });

                if (updatePlayfield) {
                    set(() => ({ playfield }));
                }
            },
        }),
        {
            name: 'sol-store',
            onRehydrateStorage: () => (state, error) => {
                state?.onStorageRehydrated();
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                }
            }
        },
    ),
)

export default useStore;
