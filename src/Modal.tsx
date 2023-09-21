import './Modal.css';

import React from 'react';
import { publish } from './Events';

export const modalTypes = {
    GameWin: "gamewin"
};

export default function Modal(props) {

    /**
     * Handler for clicking on the "New Game" menu option
     * @param {*} e The event
     */
    function newGameHandler(e) {
        publish("newGame");
    }


    /**
     * Renders the inner modal content depending on the type passed
     * @param {modalTypes}} modalType Modal type to render
     */
    function renderModalContent(modalType) {
        switch (modalType) {
            case modalTypes.GameWin:
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
