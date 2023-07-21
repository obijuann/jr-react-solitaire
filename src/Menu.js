import './Menu.css';

import React, { Component } from 'react';

class Menu extends Component {

    render() {
        let debugMenu;

        if (this.props.isDebug) {
            debugMenu = (
                <div className="debug">
                    <button id="shuffle">shuffle</button>
                </div>
            )
        }

        return (
            <div id="menu" className={this.props.isMenuVisible ? "visible" : ""}>
                {debugMenu}
                <button id="newgame">New</button>
                <button id="undo">Undo</button>
                <button id="redo">Redo</button>
            </div>
        );
    }
}

export default Menu;
