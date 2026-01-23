
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

export { throttle };