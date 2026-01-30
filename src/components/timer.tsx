import './timer.css';

import useStore from '../stores/store';
import { getFormattedTimer } from '../utils/utils';

/**
 * Game timer component.
 * Renders the elapsed time of the current game
 */
export default function Timer() {
    const gameTimer = useStore(state => state.gameTimer);

    return (
        <div id="timer">
            {getFormattedTimer(gameTimer)}
        </div>
    );
}
