// Custom event handler functions

/**
 * Subscribe to a custom even
 * @param {*} eventName 
 * @param {*} listener 
 */
function subscribe(eventName, listener) {
    document.addEventListener(eventName, listener);
}

/**
 * 
 * @param {*} eventName 
 * @param {*} listener 
 */
function unsubscribe(eventName, listener) {
    document.removeEventListener(eventName, listener);
}

/**
 * 
 * @param {*} eventName 
 * @param {*} listener 
 */
function publish(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}

export { publish, subscribe, unsubscribe };