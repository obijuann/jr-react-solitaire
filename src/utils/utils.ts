/**
 * Build a `HH:MM:SS` time string from a time value measured in seconds.
 * Hours reset after 24.
 * @param timeValue The time value (in seconds) to format
 */
function getFormattedTimer(timeValue: number) {
    const seconds = Math.floor(timeValue % 60);
    const minutes = Math.floor((timeValue / 60) % 60);
    const hours = Math.floor((timeValue / 60 / 60) % 24);

    let formattedTimer = ""

    if (hours) {
        formattedTimer = `${hours}`.padStart(2, "0") + ":";
    }
    formattedTimer += `${minutes}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");

    return formattedTimer;
}

/**
 * Simple version of the lodash throttle function
 * @param func Funtion to throttle
 * @param delay Delay in ms. Default is 250 
 */
// eslint-disable-next-line
function throttle(func: any, delay: number = 250) {
    let waiting = false;

    // eslint-disable-next-line
    return (...args: any[]) => {
        if (waiting) return;

        func(...args)
        waiting = true
        setTimeout(() => {
            waiting = false
        }, delay)
    }
}

export { throttle, getFormattedTimer };