/**
 * Build a `HH:MM:SS` time string from a time value measured in seconds.
 * Hours reset after 24.
 * @param timeValue The time value (in seconds) to format
 * @returns Formatted time string in `HH:MM:SS` (hours optional)
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
 * Simple throttle helper. Returns a wrapper that limits `func` calls to
 * once per `delay` milliseconds.
 * @param func Function to throttle
 * @param delay Delay in ms. Default is 250
 * @returns A throttled function wrapper
 */
function throttle(func: (...args: unknown[]) => unknown, delay: number = 250) {
    let waiting = false;

    return (...args: unknown[]) => {
        if (waiting) return;

        func(...args)
        waiting = true
        setTimeout(() => {
            waiting = false
        }, delay)
    }
}

export { throttle, getFormattedTimer };