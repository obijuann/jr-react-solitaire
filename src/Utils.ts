function throttle(func, delay = 250) {
    let waiting = false;

    return (...args) => {
        if (waiting) return;

        func(...args)
        waiting = true
        setTimeout(() => {
            waiting = false
        }, delay)
    }
}

export { throttle };