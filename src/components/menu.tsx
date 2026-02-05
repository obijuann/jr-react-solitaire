import './menu.css';

import { useEffect, useState } from 'react';
import useGameStore from '../stores/game-store';
import { getFormattedTimer, throttle } from '../utils/utils';

const submenuArrowSize: number = 15;
const submenuWidth: number = 300;

/**
 * Menu component.
 * Renders the primary menu and any active submenu. Submenu positioning
 * is calculated locally to avoid storing DOM measurements in the global store.
 * @param props Component props
 */
export default function Menu() {

    // Set up state management
    const gameActive = useGameStore(state => !!state.shuffledDeck.length);
    const undoAvailable = useGameStore(state => !!state.undoQueue.length);
    const redoAvailable = useGameStore(state => !!state.redoQueue.length);
    const isMenuVisible = useGameStore(state => state.menuVisible);
    const submenuId = useGameStore(state => state.submenuId);
    const clearSubmenu = useGameStore(state => state.actions.clearSubmenu);
    const toggleSubmenu = useGameStore(state => state.actions.toggleSubmenu);
    const [subMenuPosStyle, setSubMenuPosStyle] = useState<Record<string, string>>({});
    const [submenuArrowPos, setSubmenuArrowPos] = useState(0);
    const gameTimer = useGameStore(state => state.gameTimer);

    useEffect(() => {
        // Close the submenu on resize
        const resizeHandler = throttle(() => {
            clearSubmenu();
        }, 150);
        window.addEventListener("resize", resizeHandler);

        return () => {
            window.removeEventListener("resize", resizeHandler);
        };
    }, [clearSubmenu]);

    // Ensure submenus are cleared when the main menu is closed
    useEffect(() => {
        if (!isMenuVisible) {
            clearSubmenu();
            setSubMenuPosStyle({});
            setSubmenuArrowPos(0);
        }
    }, [isMenuVisible, clearSubmenu]);

    /**
     * Render the currently selected submenu (if any).
     * @returns JSX.Element | void
     */
    function renderSubmenu() {
        if (!isMenuVisible) {
            return;
        }

        // Adjust where the submenu arrow is pointing
        if (submenuArrowPos) {
            document.documentElement.style.setProperty('--submenu-icon-pos', `${submenuArrowPos}px`);
            document.documentElement.style.setProperty('--submenu-icon-size', `${submenuArrowSize}px`);
            document.documentElement.style.setProperty('--submenu-width', `${submenuWidth}px`);
        }

        switch (submenuId) {
            case "help":
                return renderHelpSubmenu();
            case "new-menu":
                return renderStartSubmenu();
            case "stats":
                return renderStatisticsSubmenu();
            default:
                return;
        }
    }

    /**
     * Render the "Start" submenu (new/restart/quit actions).
     * @returns JSX.Element
     */
    function renderStartSubmenu() {
        return (
            <div id="submenu" className="list" style={subMenuPosStyle}>
                <button className="secondary" id="new-game" onClick={newGameHandler}>New game</button>
                <button className="secondary" id="restart" onClick={restartGameHandler} disabled={!gameActive}>Restart this game</button>
                <button className="secondary" id="quit" onClick={quitGameHandler} disabled={!gameActive}>Quit this game</button>
            </div>
        );
    }

    /**
     * Render the help submenu with gameplay instructions.
     * @returns JSX.Element
     */
    function renderHelpSubmenu() {
        return (
            <div id="submenu" className="help" style={subMenuPosStyle}>
                <h2>Object of the game</h2>
                <p>
                    The first objective is to release and play into position certain cards to build up each foundation, in sequence and in suit, from the ace through the king.
                    The ultimate objective is to build the whole pack onto the foundations, and if that can be done, the Solitaire game is won.
                </p>
                <h2>Rank of Cards</h2>
                <p>
                    The rank of cards in Solitaire games is: K (high), Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2, A (low).
                </p>
                <h2>The Pile</h2>
                There are four different types of piles in Solitaire:
                <ul>
                    <li>The Tableau: Seven piles that make up the main table.</li>
                    <li>The Foundations: Four piles on which a whole suit or sequence must be built up.
                        In most Solitaire games, the four aces are the bottom card or base of the foundations.
                        The foundation piles are hearts, diamonds, spades, and clubs.</li>
                    <li>The Stock (or “Hand”) Pile: If the entire pack is not laid out in a tableau at the beginning of a game, the remaining cards form the stock pile from which additional cards are brought into play according to the rules.</li>
                    <li>The Talon (or “Waste”) Pile: Cards from the stock pile that have no place in the tableau or on foundations are laid face up in the waste pile.</li>
                </ul>
                <h2>The Play</h2>
                <p>
                    The initial array may be changed by "building" - transferring cards among the face-up cards in the tableau.
                    Certain cards of the tableau can be played at once, while others may not be played until certain blocking cards are removed.
                    For example, of the seven cards facing up in the tableau, if one is a nine and another is a ten, you may transfer the nine to on top of the ten to begin building that pile in sequence.
                    Since you have moved the nine from one of the seven piles, you have now unblocked a face down card; this card can be turned over and now is in play.
                </p>
                <p>
                    As you transfer cards in the tableau and begin building sequences, if you uncover an ace, the ace should be placed in one of the foundation piles.
                    The foundations get built by suit and in sequence from ace to king.
                </p>
                <p>
                    Continue to transfer cards on top of each other in the tableau in sequence.
                    If you can't move any more face up cards, you can utilize the stock pile by flipping over the first card.
                    This card can be played in the foundations or tableau.
                    If you cannot play the card in the tableau or the foundations piles, move the card to the waste pile and turn over another card in the stock pile.
                </p>
                <p>
                    If a vacancy in the tableau is created by the removal of cards elsewhere it is called a “space”, and it is of major importance in manipulating the tableau.
                    If a space is created, it can only be filled in with a king.
                    Filling a space with a king could potentially unblock one of the face down cards in another pile in the tableau.
                </p>
                <p>
                    Continue to transfer cards in the tableau and bring cards into play from the stock pile until all the cards are built in suit sequences in the foundation piles to win!
                </p>
            </div>
        );
    }

    /**
     * Render the "Statistics" submenu.
     * @returns JSX.Element
     */
    function renderStatisticsSubmenu() {
        return (
            <div id="submenu" className="list" style={subMenuPosStyle}>
                <div id="stats-submenu">
                    <div className="stats-header">
                        <button className="secondary" id="reset-stats" title='Reset Statistics'></button>
                        Statistics
                    </div>
                    <div className="stats-section-header">Time</div>
                    <div className="stats-section">
                        <div>Current</div>
                        <div>{getFormattedTimer(gameTimer)}</div>
                    </div>
                    <div className="stats-section">
                        <div>Best</div>
                        <div>00:00</div>
                    </div>
                    <div className="stats-section">
                        <div>Average</div>
                        <div>00:00</div>
                    </div>
                    <div className="stats-section-header">Totals</div>
                    <div className="stats-section">
                        <div>Wins</div>
                        <div>0</div>
                    </div>
                    <div className="stats-section">
                        <div>Losses</div>
                        <div>0</div>
                    </div>
                    <div className="stats-section">
                        <div>Rate</div>
                        <div>0%</div>
                    </div>
                    <div className="stats-section-header">Streaks</div>
                    <div className="stats-section">
                        <div>Wins</div>
                        <div>0</div>
                    </div>
                    <div className="stats-section">
                        <div>Losses</div>
                        <div>0</div>
                    </div>
                    <div className="stats-section">
                        <div>Current</div>
                        <div>0 Wins/Losses</div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Toggle the submenu for a primary menu button. Calculates submenu
     * position locally and then delegates visibility state to the store.
     * @param e Mouse event from the button
     */
    function handleSubmenuToggle(e: React.MouseEvent<HTMLButtonElement>) {
        const button = e.currentTarget as HTMLElement;

        if (!button || !button.id) {
            // Close any open submenu
            toggleSubmenu(undefined);
            setSubMenuPosStyle({});
            setSubmenuArrowPos(0);
            return;
        }

        const newSubmenuId = button.id;

        // If same id clicked and submenu already open, toggleSubmenu will close it
        // Compute positions locally so store doesn't handle DOM measurements
        try {
            // Calculate the positions of the submenu element and the arrow
            const submenuViewportOffset = 20;
            const clientRect = button.getBoundingClientRect();
            const menuIconCenter = clientRect.left + (clientRect.width / 2);
            const viewportWidth = window.innerWidth;

            // Make sure the submenu doesn't fall off the viewport
            // Submenus positioned over the leftmost edge of the viewport is reset to the base offset from the left
            // Otherwise, they should be positioned over the center of the button
            // Note: This isn't super precise because we're not accounting for padding or scroll bars, but it's close enough
            const subMenuPos = menuIconCenter - submenuWidth / 2;
            let posStyle: Record<string, string> = { left: `${subMenuPos < 1 ? submenuViewportOffset : subMenuPos}px` };
            // Submenus positioned over the rightmost edge of the viewport is reset to the base offset from the right
            if (subMenuPos + submenuWidth + submenuViewportOffset > viewportWidth) {
                posStyle = { right: `${submenuViewportOffset}px` };
            }

            // The submenu arrow should point to the middle of the parent menu element
            const arrowPos = Math.floor(menuIconCenter - submenuArrowSize);
            // Open the submenu
            setSubMenuPosStyle(posStyle);
            setSubmenuArrowPos(arrowPos);
        } catch (err) {
            setSubMenuPosStyle({});
            setSubmenuArrowPos(0);
        }

        toggleSubmenu(newSubmenuId);
    }

    /**
     * Handler for the "New Game" action; closes menus and starts a new game.
     * @param e Mouse event
     */
    function newGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        useGameStore.getState().actions.toggleMenu(true);
        useGameStore.getState().actions.newGame();
    }

    /**
     * Handler for the "Restart Game" action; closes menus and
     * restarts the current shuffled deck.
     * @param e Mouse event
     */
    function restartGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        useGameStore.getState().actions.toggleMenu(true);
        useGameStore.getState().actions.restartGame();
    }

    /**
     * Handler for the "Quit Game" action; quits the current game.
     * @param e Mouse event
     */
    function quitGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        useGameStore.getState().actions.toggleMenu(true);
        useGameStore.getState().actions.quitGame();
    }

    /**
     * Dispatch a redo action to the store.
     */
    function redoMoveHandler() {
        useGameStore.getState().actions.redo();
    }

    /**
     * Dispatch an undo action to the store.
     */
    function undoMoveHandler() {
        useGameStore.getState().actions.undo();
    }

    return (
        <div id="menu" data-testid="menu" className={isMenuVisible ? "visible" : ""}>
            <div id="primary-menu">
                <button className="primary" id="new-menu" onClick={handleSubmenuToggle}>New</button>
                <button className="primary" id="undo" disabled={!undoAvailable} onClick={undoMoveHandler}>Undo</button>
                <button className="primary" id="redo" disabled={!redoAvailable} onClick={redoMoveHandler}>Redo</button>
                <button className="primary" id="stats" onClick={handleSubmenuToggle}>Statistics</button>
                <button className="primary" id="help" onClick={handleSubmenuToggle}>Help</button>
                {renderSubmenu()}
            </div>
        </div>
    );
}
