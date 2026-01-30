import { create } from 'zustand';
import { PlayfieldState } from '../types/playfield-state';
import { CardData } from '../types/card-data';
import { ModalTypes } from '../types/modal-types';
import { PileTypes } from '../types/pile-types';
import { Ranks } from '../types/ranks';
import { Suits } from '../types/suits';

const suits: Partial<Record<Suits, string>> = {
    clubs: 'black',
    diamonds: 'red',
    hearts: 'red',
    spades: 'black',
};

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

const emptyPlayArea: PlayfieldState = {
    draw: [],
    waste: [],
    foundation: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
};

type StoreState = {
    playfield: PlayfieldState;
    shuffledDeck: CardData[];
    undoQueue: Partial<PlayfieldState>[];
    redoQueue: Partial<PlayfieldState>[];
    modalType?: ModalTypes;
    menuVisible: boolean;
    submenuId: string;
    
    gameTimer: number;
    timerId?: number | null;
    // actions
    setPlayfield: (p: Partial<PlayfieldState>) => void;
    toggleMenu: (hideMenus?: boolean) => void;
    toggleSubmenu: (id?: string | null) => void;
    clearSubmenu: () => void;
    shuffleDeck: () => void;
    dealDeck: () => void;
    newGame: () => void;
    restartGame: () => void;
    exitGame: () => void;
    drawCard: () => void;
    moveCard: (
        sourceCardData: CardData,
        targetPileType: PileTypes,
        targetPileIndex: number,
        sourcePileType?: PileTypes,
        sourcePileIndex?: number,
        sourceCardIndex?: number
    ) => void;
    undo: () => void;
    redo: () => void;
    startTimer: () => void;
    stopTimer: () => void;
    checkGameState: () => void;
};

export const useStore = create<StoreState>((set, get) => ({
    playfield: structuredClone(emptyPlayArea),
    shuffledDeck: [],
    undoQueue: [],
    redoQueue: [],
    modalType: undefined,
    menuVisible: true,
    submenuId: "",
    gameTimer: 0,
    timerId: null,

    setPlayfield: (p: Partial<PlayfieldState>) => {
        set(state => ({ playfield: { ...state.playfield, ...p } }));
    },

    /** 
     * Toggle the main menu visibility. If `hideMenus` is true the menu
     * will be closed, otherwise it toggles current visibility.
     */
    toggleMenu: (hideMenus = false) => {
        if (hideMenus) {
            set(() => ({ menuVisible: false, submenuId: "", subMenuPosStyle: {}, submenuArrowPos: 0 }));
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

    clearSubmenu: () => {
        set(() => ({ submenuId: "" }));
    },

    /** Build and shuffle a fresh 52-card deck and store it in `shuffledDeck`. */
    shuffleDeck: () => {
        const newDeck: CardData[] = [];
        const suitsList = Object.keys(suits) as Suits[];
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

    /** Deal the shuffled deck into `tableau` and `draw` piles and reset undo/redo. */
    dealDeck: () => {
        const deck = structuredClone(get().shuffledDeck || []);
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

    /** Start a new game: reset modal, shuffle, deal and start timer. */
    newGame: () => {
        set(() => ({ modalType: undefined }));
        get().stopTimer();
        get().shuffleDeck();
        get().dealDeck();
        get().startTimer();
    },

    /** Restart the current game: redeal the current shuffled deck and restart timer. */
    restartGame: () => {
        set(() => ({ modalType: undefined }));
        get().dealDeck();
        get().stopTimer();
        get().startTimer();
    },

    /** Exit the current game and clear playfield and deck. */
    exitGame: () => {
        set(() => ({ modalType: undefined, shuffledDeck: [], playfield: structuredClone(emptyPlayArea) }));
        get().stopTimer();
    },

    /** Draw a card from the draw pile to the waste, or recycle waste back to draw. */
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

    /** Move one or more cards from a source pile to a target pile and record undo data. */
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

    /** Undo the last recorded move. */
    undo: () => {
        const undoQueue = structuredClone(get().undoQueue || []);
        if (!undoQueue.length) return;

        const lastMoveData = undoQueue.pop() as Partial<PlayfieldState>;
        const current = structuredClone(get().playfield);
        const redoMoveData: Partial<PlayfieldState> = {};

        if (lastMoveData) {
            Object.keys(lastMoveData).forEach(key => {
                redoMoveData[key as keyof PlayfieldState] = structuredClone(current[key as keyof PlayfieldState]);
                // @ts-ignore
                current[key] = structuredClone(lastMoveData[key as keyof PlayfieldState]);
            });
        }

        const redoQueue = structuredClone(get().redoQueue || []);
        redoQueue.push(redoMoveData);

        set(() => ({ playfield: current, undoQueue: undoQueue, redoQueue: redoQueue }));
    },

    /** Redo the last undone move. */
    redo: () => {
        const redoQueue = structuredClone(get().redoQueue || []);
        if (!redoQueue.length) return;

        const lastMoveData = redoQueue.pop() as Partial<PlayfieldState>;
        const current = structuredClone(get().playfield);
        const undoMoveData: Partial<PlayfieldState> = {};

        if (lastMoveData) {
            Object.keys(lastMoveData).forEach(key => {
                undoMoveData[key as keyof PlayfieldState] = structuredClone(current[key as keyof PlayfieldState]);
                // @ts-ignore
                current[key] = structuredClone(lastMoveData[key as keyof PlayfieldState]);
            });
        }

        const undoQueue = structuredClone(get().undoQueue || []);
        undoQueue.push(undoMoveData);

        set(() => ({ playfield: current, undoQueue: undoQueue, redoQueue: redoQueue }));
    },

    /** Start the game timer and reset the elapsed time. */
    startTimer: () => {
        get().stopTimer();
        const id = window.setInterval(() => {
            set(state => ({ gameTimer: state.gameTimer + 1 }));
        }, 1000);
        set(() => ({ timerId: id, gameTimer: 0 }));
    },

    /** Stop the game timer and clear the interval. */
    stopTimer: () => {
        const id = get().timerId;
        if (id) {
            clearInterval(id);
        }
        set(() => ({ timerId: null }));
    },

    /** Inspect the playfield to flip necessary cards and detect a win. */
    checkGameState: () => {
        const playfield = structuredClone(get().playfield);
        let numFoundationCards = 0;
        playfield.foundation.forEach(pile => (numFoundationCards += pile.length));

        if (numFoundationCards === 52) {
            get().stopTimer();
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
}));

export default useStore;
