import './Modal.css';

import { ModalComponentProps } from './@types/ModalComponentProps';
import { ModalTypes } from './@types/ModalTypes';
import React from 'react';
import useStore from './store';

export default function Modal(props: ModalComponentProps) {

    /**
     * Handler for clicking on the "New Game" menu option
     * @param {*} e The event
     */
    function newGameHandler(e: React.MouseEvent) {
        e.preventDefault();
        useStore.getState().newGame();
    }

    /**
     * Renders the inner modal content depending on the type passed
     * @param {ModalTypes} modalType Modal type to render
     */
    function renderModalContent(modalType: ModalTypes) {
        switch (modalType) {
            case "gamewin":
                return (
                    <React.Fragment>
                        <span>Congratulations!</span>
                        <span>Time: {props.gameTime}</span>
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
