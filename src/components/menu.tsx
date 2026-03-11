import './menu.css';

import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RedoRoundedIcon from '@mui/icons-material/RedoRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import { Tooltip } from "@mui/material";
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ChangeEvent, useEffect, useState } from 'react';
import useGameStore from '../stores/game-store';
import usePreferencesStore from '../stores/preferences-store';
import useStatisticsStore from '../stores/statistics-store';
import { themeColors } from '../themes/palette';
import { CardBacks, CardFaces } from '../types/card-data';
import { ThemeColors } from "../types/theme";
import { getFormattedTimer, throttle } from '../utils/utils';
import { cardBackArtwork, cardFaceArtwork } from "./card";

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
    const modalType = useGameStore(state => state.modalType);
    const undoAvailable = useGameStore(state => !!state.undoQueue.length);
    const redoAvailable = useGameStore(state => !!state.redoQueue.length);
    const isMenuVisible = useGameStore(state => state.menuVisible);
    const submenuId = useGameStore(state => state.submenuId);
    const clearSubmenu = useGameStore(state => state.actions.clearSubmenu);
    const toggleSubmenu = useGameStore(state => state.actions.toggleSubmenu);
    const [subMenuPosStyle, setSubMenuPosStyle] = useState<Record<string, string>>({});
    const [submenuArrowPos, setSubmenuArrowPos] = useState(0);
    const gameTimer = useGameStore(state => state.gameTimer);

    // Statistics state and computed values
    const averageWinTime = useStatisticsStore(state => state.getAverageWinTime);
    const winRate = useStatisticsStore(state => state.getWinRate);
    const currentStreakText = useStatisticsStore(state => state.getCurrentStreakText);
    const bestWinTime = useStatisticsStore(state => state.bestWinTime);
    const totalLosses = useStatisticsStore(state => state.totalLosses);
    const totalWins = useStatisticsStore(state => state.totalWins);
    const bestWinStreak = useStatisticsStore(state => state.bestWinStreak);
    const worstLoseStreak = useStatisticsStore(state => state.worstLosingStreak);

    // User preferences
    const themeColor = usePreferencesStore(state => state.themeColor);
    const cardBack = usePreferencesStore(state => state.cardBack);
    const cardFace = usePreferencesStore(state => state.cardFace);
    const gameTimerEnabled = usePreferencesStore(state => state.gameTimerEnabled);

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
            case "prefs":
                return renderPreferencesSubmenu();
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
                <button className="secondary" id="new-game" onClick={newGameHandler}><PlayArrowRoundedIcon fontSize='large' />New game</button>
                <button className="secondary" id="restart" onClick={restartGameHandler} disabled={!gameActive}><ReplayRoundedIcon fontSize='large' />Restart this game</button>
                <button className="secondary" id="quit" onClick={quitGameHandler} disabled={!gameActive}><ClearRoundedIcon fontSize='large' />Quit this game</button>
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
     * Update the user preference for theme
     * @param e Change event from the select element
     */
    function handleThemeChange(e: SelectChangeEvent<ThemeColors>): void {
        usePreferencesStore.setState(() => ({ themeColor: e.target.value as ThemeColors }));
    }

    /**
     * Update the user preference for card face artwork
     * @param e Change event from the select element
     */
    function handleCardFaceChange(e: SelectChangeEvent<CardFaces>): void {
        usePreferencesStore.setState(() => ({ cardFace: e.target.value as CardFaces }));
    }

    /**
     * Update the user preference for card back artwork
     * @param e Change event from the select element
     */
    function handleCardBackChange(e: SelectChangeEvent<CardBacks>): void {
        usePreferencesStore.setState(() => ({ cardBack: e.target.value as CardBacks }));
    }

    /**
     * Update the user preference for using the game timer
     * @param e Change event from the input element
     */
    function handleTimerSwitchChange(e: ChangeEvent<HTMLInputElement>): void {
        usePreferencesStore.setState(() => ({ gameTimerEnabled: e.target.checked }));
    }

    /**
     * Render the "Preferences" submenu.
     * @returns JSX.Element
     */
    function renderPreferencesSubmenu() {
        return (
            <div id="submenu" className="list" style={subMenuPosStyle}>
                <div id="group-submenu">
                    <div className="group-header">
                        <span>Preferences</span>
                    </div>
                    <div className="group-section-header">General</div>
                    <div className="group-section">
                        <div>Timer</div>
                        <div>
                            <Tooltip
                                arrow
                                placement="top"
                                title={gameActive ? "Timer cannot be enabled or disabled during an active game" : ""}
                            >
                                <div>
                                    <Checkbox
                                        checked={gameTimerEnabled}
                                        disabled={gameActive}
                                        size="medium"
                                        onChange={handleTimerSwitchChange}
                                        sx={{
                                            color: "white",
                                            padding: 0,
                                            "& .MuiSvgIcon-root": { fontSize: 35 },
                                            '&.Mui-checked': { color: gameActive ? "rgba(0, 0, 0, 0.26)" : "white" },
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                    <div className="group-section-header">Appearance</div>
                    <div className="group-section">
                        <div>
                            Theme
                        </div>
                        <div>
                            <FormControl size="small" sx={{ m: 0, minWidth: 120 }}>
                                <Select
                                    id="theme-select"
                                    inputProps={{ 'aria-label': 'Theme' }}
                                    onChange={handleThemeChange}
                                    value={themeColor}
                                    sx={{
                                        "& .MuiSvgIcon-root": { color: "unset" },
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                    }}
                                >
                                    {
                                        Object.entries(themeColors).map(([themeKey, themeProps]) => (
                                            <MenuItem key={themeKey} value={themeKey}>
                                                {themeProps.label}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                    <div className="group-section">
                        <div>
                            Card Face
                        </div>
                        <div>
                            <FormControl size="small" sx={{ m: 0, minWidth: 120 }}>
                                <Select
                                    id="card-face-select"
                                    inputProps={{ 'aria-label': 'Card face' }}
                                    onChange={handleCardFaceChange}
                                    value={cardFace}
                                    sx={{
                                        "& .MuiSvgIcon-root": { color: "unset" },
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                    }}
                                >
                                    {
                                        Object.entries(cardFaceArtwork).map(([cardFace, cardFaceArtwork]) => (
                                            <MenuItem key={cardFace} value={cardFace}>
                                                {cardFaceArtwork.label}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                    <div className="group-section">
                        <div>
                            Card Back
                        </div>
                        <div>
                            <FormControl size="small" sx={{ m: 0, minWidth: 120 }}>
                                <Select
                                    id="card-back-select"
                                    inputProps={{ 'aria-label': 'Card back' }}
                                    onChange={handleCardBackChange}
                                    value={cardBack}
                                    sx={{
                                        "& .MuiSvgIcon-root": { color: "unset" },
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                    }}
                                >
                                    {
                                        Object.entries(cardBackArtwork).map(([cardBack, cardBackArtwork]) => (
                                            <MenuItem key={cardBack} value={cardBack}>
                                                {cardBackArtwork.label}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                </div>
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
                <div id="group-submenu">
                    <div className="group-header">
                        <button onClick={resetStatistics} className="secondary" id="reset-stats" title='Reset Statistics'><RestoreRoundedIcon fontSize='medium' /></button>
                        <span>Statistics</span>
                    </div>
                    {renderTimeStatistics()}
                    <div className="group-section-header">Totals</div>
                    <div className="group-section">
                        <div>Wins</div>
                        <div>{totalWins}</div>
                    </div>
                    <div className="group-section">
                        <div>Losses</div>
                        <div>{totalLosses}</div>
                    </div>
                    <div className="group-section">
                        <div>Rate</div>
                        <div>{winRate()}</div>
                    </div>
                    <div className="group-section-header">Streaks</div>
                    <div className="group-section">
                        <div>Wins</div>
                        <div>{bestWinStreak}</div>
                    </div>
                    <div className="group-section">
                        <div>Losses</div>
                        <div>{worstLoseStreak}</div>
                    </div>
                    <div className="group-section">
                        <div>Current</div>
                        <div>{currentStreakText()}</div>
                    </div>
                </div>
            </div>
        );
    }


    /**
     * Render the statistics related to game time. Returns null if the the user has disabled the game timer.
     * @returns JSX.Element
     */
    function renderTimeStatistics() {
        if (gameTimerEnabled) {
            return (
                <div data-testid="time-stats">
                    <div className="group-section-header">Time</div>
                    <div className="group-section">
                        <div>Current</div>
                        <div>{getFormattedTimer(gameTimer)}</div>
                    </div>
                    <div className="group-section">
                        <div>Best</div>
                        <div>{getFormattedTimer(bestWinTime)}</div>
                    </div>
                    <div className="group-section">
                        <div>Average</div>
                        <div>{getFormattedTimer(averageWinTime())}</div>
                    </div>
                </div>
            );
        }
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
        } catch {
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

        // If there is a current game in progress, starting a new game counts as a loss.
        // Record the loss with the stats store
        if (gameActive && gameTimer >= 0) {
            useStatisticsStore.getState().actions.recordLoss();
        }

        useGameStore.getState().actions.toggleMenu(true);
        useGameStore.getState().actions.newGame();
    }

    /**
     * Handler for the "Reset Statistics" action
     * @param e Mouse event
     */
    function resetStatistics(e: React.MouseEvent) {
        e.preventDefault();
        useStatisticsStore.getState().actions.resetStatistics();
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
        // Log the loss with the stats store
        useStatisticsStore.getState().actions.recordLoss();
    }

    /**
     * Dispatch a redo action to the store.
     */
    function redoMoveHandler() {
        useGameStore.getState().actions.redo();
    }

    /**
     * Menu toggle even for the menu control
     * @param e Mouse event
     */
    function toggleMenu(e: React.MouseEvent) {
        e.preventDefault();
        useGameStore.getState().actions.toggleMenu();
    }

    /**
     * Dispatch an undo action to the store.
     */
    function undoMoveHandler() {
        useGameStore.getState().actions.undo();
    }

    return (
        <div id="menu" data-testid="menu" className={isMenuVisible ? "visible" : ""}>
            <div id="menu-control">
                <button onClick={toggleMenu} title="Toggle Menu (Esc)"><KeyboardArrowUpOutlinedIcon fontSize='medium' /></button>
            </div>
            <div id="primary-menu">
                <button className="primary" id="new-menu" onClick={handleSubmenuToggle}><PlayArrowRoundedIcon />Play</button>
                <button className="primary" id="undo" disabled={!undoAvailable || !!modalType} onClick={undoMoveHandler}><UndoRoundedIcon />Undo</button>
                <button className="primary" id="redo" disabled={!redoAvailable || !!modalType} onClick={redoMoveHandler}><RedoRoundedIcon />Redo</button>
                <button className="primary" id="prefs" onClick={handleSubmenuToggle}><SettingsRoundedIcon /> Preferences</button>
                <button className="primary" id="stats" onClick={handleSubmenuToggle}><LeaderboardRoundedIcon /> Statistics</button>
                <button className="primary" id="help" onClick={handleSubmenuToggle}><HelpOutlineRoundedIcon />Help</button>
                {renderSubmenu()}
            </div>
        </div>
    );
}
