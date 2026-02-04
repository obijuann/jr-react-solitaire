import './timer.css';

import useGameStore from '../stores/game-store';
import { getFormattedTimer } from '../utils/utils';

/**
 * Game timer component.
 * Renders the elapsed time of the current game
 */
export default function Timer() {
    const gameTimer = useGameStore(state => state.gameTimer);

    return (
        <div id="timer">
            {getFormattedTimer(gameTimer)}
        </div>
    );
}
