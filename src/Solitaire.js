import "./Solitaire.css";

import React, { Component } from 'react';
import { publish, subscribe, unsubscribe } from "./Events";

import Menu from "./Menu";

// const suits = ["clubs", "diamonds", "hearts", "spades"];
// const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
// var deck = [];

class Solitaire extends Component {

  constructor(props) {
    super(props);

    // Set initial state
    this.state = {
      isDebug: props.isDebug || false
    };
  }

  componentDidMount() {
    // Bind helper functions to the class
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.newGameHandler = this.newGameHandler.bind(this);
    this.restartGameHandler = this.restartGameHandler.bind(this);
    this.exitGameHandler = this.exitGameHandler.bind(this);
    this.redoMoveHandler = this.redoMoveHandler.bind(this);
    this.undoMoveHandler = this.undoMoveHandler.bind(this);

    // Set listeners for various game events
    subscribe("newGame", this.newGameHandler);
    subscribe("restartGame", this.restartGameHandler);
    subscribe("exitGame", this.exitGameHandler);
    subscribe("redoMove", this.redoMoveHandler);
    subscribe("undoMove", this.undoMoveHandler);
  }

  componentWillUnmount() {
    // Remove listeners for game events
    unsubscribe("newGame", this.newGameHandler);
    unsubscribe("restartGame", this.restartGameHandler);
    unsubscribe("exitGame", this.exitGameHandler);
    unsubscribe("redoMove", this.redoMoveHandler);
    unsubscribe("undoMove", this.undoMoveHandler);
  }

  render() {
    return (
      <div id="playarea" onClick={this.toggleMenu} onKeyDown={this.keyDownHandler}>
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
        <Menu />
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
      publish("toggleMenu", true);
    }
  }

  keyDownHandler(e) {
    if (!e || !e.key) {
      return;
    }
    // Toggle the menu on Esc or m/M
    if (e.keyCode === 27 || e.keyCode === 77) {
      publish("toggleMenu", true);
    }
  }

  newGameHandler() {
    console.log("new game");
  }

  restartGameHandler() {
    console.log("restart game");
  }

  exitGameHandler() {
    console.log("exit game");
  }

  redoMoveHandler() {
    console.log("redoing last move");
  }

  undoMoveHandler() {
    console.log("undo last move");
  }
}

export default Solitaire;
