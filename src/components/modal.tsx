import './modal.css';

import React from 'react';
import useStore from '../stores/store';
import { ModalTypes } from '../types/modal-types';
import { getFormattedTimer } from '../utils/utils';

interface ModalComponentProps {
    modalType: ModalTypes
}

/**
 * Modal component.
 * Renders modal backdrop and content based on the provided `modalType`.
 * @param props Component props
 */
export default function Modal(props: ModalComponentProps) {

    const gameTimer = useStore(state => state.gameTimer);

    /**
     * Handler for the New Game button inside the modal. Starts a new game.
     * @param e Mouse event
     */
    function newGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        useStore.getState().newGame();
    }

    /**
     * Render modal inner content for the given type.
     * @param modalType Modal type to render
     * @returns JSX.Element | void
     */
    function renderModalContent(modalType: ModalTypes) {
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
        <div data-testid="modal-backdrop" className="modal-backdrop" onClick={newGameHandler}>
            <div className="modal">
                {renderModalContent(props.modalType)}
            </div>
        </div>
    );
}
