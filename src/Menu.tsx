import './Menu.css';

import React, { useEffect, useState } from 'react';
import { eventNames, publish, subscribe, unsubscribe } from './Events';

import { throttle } from './Utils';

const submenuArrowSize = 15;
const submenuWidth = 300;

export default function Menu(props) {

    // Set up state management
    const [isMenuVisible, setIsMenuVisible] = useState(true);
    const [submenuId, setSubmenuId] = useState("");
    const [subMenuPosStyle, setSubMenuPosStyle] = useState(0);
    const [submenuArrowPos, setSubmenuArrowPos] = useState(0);

    useEffect(() => {
        // Set listener for toggle menu event, which happens in the main Solitaire component
        subscribe(eventNames.ToggleMenu, toggleMenu);

        // Close the submenu on resize
        window.addEventListener("resize", throttle(resizeHandler, 150));

        return () => {
            // Remove listeners for game events
            unsubscribe(eventNames.ToggleMenu, toggleMenu);
            window.removeEventListener("resize", throttle(resizeHandler, 150));
        };
    });

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
            case "new-game":
                return renderStartSubmenu();
            default:
                return;
        }
    }

    function renderStartSubmenu() {
        return (
            <div id="submenu" className="list" style={subMenuPosStyle}>
                <button className="secondary" id="new-game" onClick={newGameHandler}>New game</button>
                <button className="secondary" id="restart" onClick={restartGameHandler} disabled={!props.gameActive}>Restart this game</button>
                <button className="secondary" id="quit" onClick={exitGameHandler} disabled={!props.gameActive}>Quit this game</button>
            </div>
        );
    }

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
     * Closes the submenu on window resize
     */
    function resizeHandler() {
        setSubmenuId("");
    }

    /**
     * Toggling the menu should dismiss the submenu first, then the main menu.
     * Otherwise it should enable the main menu without a submenu
     */

    /**
     * Toggling the menu should dismiss the submenu first, then the main menu.
     * Otherwise it should enable the main menu without a submenu
     * @param {Event} e 
     * @param {boolean} hideMenus Flag to hide all menus
     */
    function toggleMenu(e, hideMenus) {

        if (hideMenus) {
            setIsMenuVisible(false);
        } else if (submenuId || !isMenuVisible) {
            setIsMenuVisible(true);
        } else {
            setIsMenuVisible(false);
        }

        // Clear the submenu ID
        setSubmenuId("");
    }

    /**
     * Toggles the submenu
     */
    function toggleSubmenu(e) {

        // If no menu ID was passed, close any existing submenus
        if (!e || !e.target || !e.target.id) {
            setSubmenuId("");
            setSubMenuPosStyle(0);
            return;
        }

        const newSubmenuId = e.target.id;

        // Close any open submenus
        if (submenuId) {
            let oldSubmenuId = submenuId;
            setSubmenuId("");
            setSubMenuPosStyle(0);

            // If the same menu button was clicked again, we're done after closing the menu
            if (oldSubmenuId === newSubmenuId) {
                return;
            }
        }

        // Calculate the positions of the submenu element and the arrow
        const submenuViewportOffset = 20;
        const clientRect = e.target.getBoundingClientRect();
        const menuIconCenter = clientRect.left + (clientRect.width / 2);
        const viewportWidth = window.innerWidth;

        // Make sure the submenu doesn't fall off the viewport
        // Submenus positioned over the leftmost edge of the viewport is reset to the base offset from the left
        // Otherwise, they should be positioned over the center of the button
        // Note: This isn't super precise because we're not accounting for padding or scroll bars, but it's close enough
        let subMenuPos = menuIconCenter - submenuWidth / 2;
        let subMenuPosStyle = { left: `${subMenuPos < 1 ? submenuViewportOffset : subMenuPos}px` }

        // Submenus positioned over the rightmost edge of the viewport is reset to the base offset from the right
        if (subMenuPos + submenuWidth + submenuViewportOffset > viewportWidth) {
            subMenuPosStyle = { right: `${submenuViewportOffset}px` };
        }

        // The submenu arrow should point to the middle of the parent menu element
        const submenuArrowPos = parseInt(menuIconCenter - submenuArrowSize);

        // Open the submenu
        setSubmenuId(newSubmenuId);
        setSubMenuPosStyle(subMenuPosStyle);
        setSubmenuArrowPos(submenuArrowPos);
    }

    /**
     * Handler for clicking on the "New Game" menu option
     * @param {*} e The event
     */
    function newGameHandler(e) {
        toggleMenu(e, true);
        publish(eventNames.NewGame);
    }

    /**
     * Handler for clicking on the "Restart Game" menu option
     * @param {*} e The event
     */
    function restartGameHandler(e) {
        toggleMenu(e, true);
        publish(eventNames.RestartGame);
    }

    /**
     * Handler for clicking on the "Exit Game" menu option
     * @param {*} e The event
     */
    function exitGameHandler(e) {
        toggleMenu(e, true);
        publish(eventNames.ExitGame);
    }

    /**
     * Handler for clicking on the "redo" menu option
     * @param {*} e The event
     */
    function redoMoveHandler(e) {
        publish(eventNames.RedoMove);
    }

    /**
     * Handler for clicking on the "undo" menu option
     * @param {*} e The event
     */
    function undoMoveHandler(e) {
        publish(eventNames.UndoMove);
    }

    return (
        <div id="menu" data-testid="menu" className={isMenuVisible ? "visible" : ""}>
            <button className="primary" id="new-game" onClick={toggleSubmenu}>New</button>
            <button className="primary" id="undo" disabled={!props.undoAvailable} onClick={undoMoveHandler}>Undo</button>
            <button className="primary" id="redo" disabled={!props.redoAvailable} onClick={redoMoveHandler}>Redo</button>
            <button className="primary" id="help" onClick={toggleSubmenu}>Help</button>
            {renderSubmenu()}
        </div>
    );
}
