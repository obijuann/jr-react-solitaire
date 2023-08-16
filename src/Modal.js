import './Modal.css';

import React, { useState } from 'react';

import { publish } from './Events';

export const modalTypes = {
    GameWin: "gamewin"
};

export default function Modal(props) {

    const [isModalVisible, setIsModalVisible] = useState(true);

    if (!isModalVisible) {
        return;
    }

    /**
     * Handler for clicking on the "New Game" menu option
     * @param {*} e The event
     */
    function newGameHandler(e) {
        setIsModalVisible(false);
        publish("newGame");
    }

    /**
     * Renders the inner modal content depending on the type passed
     * @param {ModalTypes}} modalType Modal type to render
     */
    function renderModalContent(modalType) {
        switch (modalType) {
            case modalTypes.GameWin:
                return (
                    <React.Fragment>
                        <span>Congratulations!</span>
                        <span>Time: NYI</span>
                        <button className="new-game" onClick={newGameHandler}>New Game</button>
                    </React.Fragment>
                )
            default:
                return;
        }
    }

    return (
        <div className="modal-backdrop" onClick={() => setIsModalVisible(false)}>
            <div className="modal">
                {renderModalContent(props.modalType)}
            </div>
        </div>
    );
}
