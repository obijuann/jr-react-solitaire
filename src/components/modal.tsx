import './modal.css';

import React from 'react';
import useGameStore from '../stores/game-store';
import { getFormattedTimer } from '../utils/utils';

/**
 * Modal component.
 * Renders modal backdrop and content based on the `modalType`.
 */
export default function Modal() {

    const gameTimer = useGameStore(state => state.gameTimer);
    const modalType = useGameStore(state => state.modalType);

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
                        <span>Time: {getFormattedTimer(gameTimer)}</span>
                        <button className="new-game" onClick={newGameHandler}>New Game</button>
                    </React.Fragment>
                )
            default:
                return;
        }
    }

    return (
        <div data-testid="modal-backdrop" className="modal-backdrop" onClick={modalBackdropClickHandler}>
            <div className="modal">
                {renderModalContent()}
            </div>
        </div>
    );
}
