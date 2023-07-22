import './Menu.css';

import React, { Component } from 'react';
import { subscribe, unsubscribe } from './Events';

class Menu extends Component {

    constructor(props) {
        super(props)

        // Set initial state
        this.state = {
            isMenuVisible: false,
            subMenu: ""
        }
    }

    componentDidMount() {
        // Bind helper functions
        this.enableHelpSubmenu = this.enableHelpSubmenu.bind(this);
        this.enableStartSubmenu = this.enableStartSubmenu.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);

        // Set listener for toggle menu event
        subscribe("toggleMenu", this.toggleMenu);
    }

    componentWillUnmount() {
        // Remove listener for toggle menu event
        unsubscribe("toggleMenu", this.toggleMenu);
    }

    render() {
        return (
            <div id="menu" className={this.state.isMenuVisible ? "visible" : ""}>
                <button id="newgame" onClick={this.enableStartSubmenu}>New</button>
                <button id="undo">Undo</button>
                <button id="redo">Redo</button>
                <button id="help" onClick={this.enableHelpSubmenu}>Help</button>
                {this.renderSubMenu()}
            </div>
        );
    }

    renderSubMenu() {
        if (!this.state.isMenuVisible) {
            return;
        }

        switch (this.state.subMenu) {
            case "help":
                return this.renderHelpSubmenu();
            case "start":
                return this.renderStartSubmenu();
            default:
                return;
        }
    }

    enableStartSubmenu() {
        this.setState({ subMenu: "start" });
    }

    renderStartSubmenu() {
        return (
            <div id="submenu" className="list">
                <button>New game</button>
                <button>Restart this game</button>
                <button>Quit this game</button>
            </div>
        );
    }

    enableHelpSubmenu() {
        this.setState({ subMenu: "help" });
    }

    renderHelpSubmenu() {
        return (
            <div id="submenu" className="help">
                <h2>Object of the game</h2>
                <p>
                    The first objective is to release and play into position certain cards to build up each foundation, in sequence and in suit, from the ace through the king.
                    The ultimate objective is to build the whole pack onto the foundations, and if that can be done, the Solitaire game is won.
                </p>
                <h2>Rank of Cards</h2>
                <p>
                    The rank of cards in Solitaire games is: K (high), Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2, A (low).
                </p>
                <h2>The Deal</h2>
                There are four different types of piles in Solitaire:
                <ul>
                    <li>The Tableau: Seven piles that make up the main table.</li>
                    <li>The Foundations: Four piles on which a whole suit or sequence must be built up.
                        In most Solitaire games, the four aces are the bottom card or base of the foundations.
                        The foundation piles are hearts, diamonds, spades, and clubs.</li>
                    <li>The Stock (or “Hand”) Pile: If the entire pack is not laid out in a tableau at the beginning of a game, the remaining cards form the stock pile from which additional cards are brought into play according to the rules.</li>
                    <li>The Talon (or “Waste”) Pile: Cards from the stock pile that have no place in the tableau or on foundations are laid face up in the waste pile.</li>
                </ul>
                <p>
                    To form the tableau, seven piles need to be created. Starting from left to right, place the first card face up to make the first pile, deal one card face down for the next six piles.
                    Starting again from left to right, place one card face up on the second pile and deal one card face down on piles three through seven.
                    Starting again from left to right, place one card face up on the third pile and deal one card face down on piles four through seven.
                    Continue this pattern until pile seven has one card facing up on top of a pile of six cards facing down.
                </p>
                <p>
                    The remaining cards form the stock (or “hand”) pile and are placed above the tableau.
                </p>
                <p>
                    When starting out, the foundations and waste pile do not have any cards.
                </p>
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
     * Toggling the menu should dismiss the submenu first, then the main menu.
     * Otherwise it should enable the main menu without a submenu
     */
    toggleMenu() {
        if (this.state.subMenu || !this.state.isMenuVisible) {
            this.setState({ isMenuVisible: true, subMenu: "" })
        } else {
            this.setState({ isMenuVisible: false, subMenu: "" })
        }
    }
}

export default Menu;
