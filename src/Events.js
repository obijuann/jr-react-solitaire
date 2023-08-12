// Custom event handler functions

/**
 * Subscribe to a custom event
 * @param {string} eventName Event name to subscribe
 * @param {function} listener Callback function when event happens
 */
function subscribe(eventName, listener) {
    document.addEventListener(eventName, listener);
}

/**
 * Unsubscribe from a custom event
 * @param {string} eventName Event name to unsubscribe
 * @param {function} listener Callback function when event happens
 */
function unsubscribe(eventName, listener) {
    document.removeEventListener(eventName, listener);
}

/**
 * Dispatches the custom event
 * @param {string} eventName Event name to dispatch
 * @param {any} data Data to pass to listeners
 */
function publish(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}

export { publish, subscribe, unsubscribe };