import "./Solitaire.css";

import React, { Component } from 'react';

import Menu from "./Menu";

// const suits = ["clubs", "diamonds", "hearts", "spades"];
// const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
// var deck = [];

class Solitaire extends Component {

  constructor(props) {
    super(props);

    // Set initial state
    this.state = {
      isDebug: props.isDebug || false,
      isMenuVisible: false
    };
  }

  render() {
    return (
      <div id="playarea" onClick={this.toggleMenu.bind(this)} onKeyDown={this.handleKeyDown.bind(this)}>
        <div id="stock">
          <div id="draw" className="card"></div>
        </div>
        <div id="waste">
        </div>
        <div id="foundation">
          <div id="stack1" className="card"></div>
          <div id="stack2" className="card"></div>
          <div id="stack3" className="card"></div>
          <div id="stack4" className="card"></div>
        </div>
        <div id="tableau">
          <div id="tab1" className="card"></div>
          <div id="tab2" className="card"></div>
          <div id="tab3" className="card"></div>
          <div id="tab4" className="card"></div>
          <div id="tab5" className="card"></div>
          <div id="tab6" className="card"></div>
          <div id="tab7" className="card"></div>
        </div>
        <Menu
          isDebug={this.state.isDebug}
          isMenuVisible={this.state.isMenuVisible}
        />
        <div id="timer"></div>
      </div>
    );
  }

  toggleMenu(e) {
    if (!e) {
      return;
    }
    e.preventDefault();
    if (e.target && e.target && (e.target.id === "playarea" || e.target.id === "menu")) {
      this.setState({ isMenuVisible: !this.state.isMenuVisible });
    }
  }

  handleKeyDown(e) {
    if (!e || !e.key) {
      return;
    }
    // Toggle the menu on Esc or m/M
    if (e.keyCode === 27 || e.keyCode === 77) {
      this.setState({ isMenuVisible: !this.state.isMenuVisible });
    }
  }
}

export default Solitaire;
