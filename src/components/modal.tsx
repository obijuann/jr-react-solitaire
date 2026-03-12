import './modal.css';

import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import React from 'react';
import useGameStore from '../stores/game-store';
import usePreferencesStore from "../stores/preferences-store";
import { getFormattedTimer } from '../utils/utils';

/**
 * Modal component.
 * Renders modal backdrop and content based on the `modalType`.
 */
export default function Modal() {

    const gameTimer = useGameStore(state => state.gameTimer);
    const modalType = useGameStore(state => state.modalType);
    const gameTimerEnabled = usePreferencesStore(state => state.gameTimerEnabled);

    /**
     * Handler for the New Game button inside the modal. Starts a new game.
     * @param e Mouse event
     */
    function newGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        useGameStore.getState().actions.newGame();
    }

    /**
     * Handler for handling click events on the modal backdrop.
     * @param e Mouse event
     */
    function modalBackdropClickHandler(e: React.MouseEvent) {
        e.preventDefault();

        if (modalType === "gamewin") {
            // If the user has won the game, reset the playfield
            useGameStore.getState().actions.quitGame();
        } else {
            // Otherwise, just close the modal
            useGameStore.setState(() => ({ modalType: undefined }));
        }
    }

    /**
     * Render modal inner content
     * @returns JSX.Element | void
     */
    function renderModalContent() {
        switch (modalType) {
            case "gamewin":
                return (
                    <React.Fragment>
                        <span>Congratulations!</span>
                        {renderGameTime()}
                        <button className="new-game" onClick={newGameHandler}><PlayArrowRoundedIcon fontSize='large' />New Game</button>
                    </React.Fragment>
                )
            default:
                return;
        }
    }

    /**
     * Renders the final game time
     * @returns JSX.Element | void
     */
    function renderGameTime() {

        if (!gameTimerEnabled) {
            return;
        }

        return (
            <span>Time: {getFormattedTimer(gameTimer)}</span>
        )
    }

    return (
        <div data-testid="modal-backdrop" className="modal-backdrop" onClick={modalBackdropClickHandler}>
            <div className="modal">
                {renderModalContent()}
            </div>
        </div>
    );
}
