// Custom game event handler functions and types

import { EventNames } from "./@types/EventNames";

/**
 * Subscribe to a custom event
 * @param {eventNames} eventName Event name to subscribe
 * @param {EventListener} listener Callback that will be invoked when the event is dispatched
 */
// eslint-disable-next-line
function subscribe(eventName: EventNames, listener: any) {
    document.addEventListener(eventName, listener);
}

/**
 * Unsubscribe from a custom event
 * @param {eventNames} eventName Event name to unsubscribe
 * @param {EventListener} listener Callback that will be invoked when the event is dispatched
 */
// eslint-disable-next-line
function unsubscribe(eventName: EventNames, listener: any) {
    document.removeEventListener(eventName, listener);
}

/**
 * Dispatches the custom event
 * @param {eventNames} eventName Event name to dispatch
 * @param {any} data Data to pass to listeners
 */
// eslint-disable-next-line
function publish(eventName: EventNames, data?: any) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}

export { publish, subscribe, unsubscribe };