import { expect, it, vi } from 'vitest';
import { publish, subscribe, unsubscribe } from "./Events";

it("subscribe and publish functions", () => {
    // Arrange
    const listener = vi.fn();
    subscribe("newGame", listener);

    // Act
    publish("newGame", "test data");

    // Assert
    expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
            type: "newGame",
            detail: "test data",
        })
    );
});

it("unsubscribe function", () => {
    // Arrange
    const listener = vi.fn();
    subscribe("newGame", listener);

    // Act
    unsubscribe("newGame", listener);
    publish("newGame", "test data");

    // Assert
    expect(listener).not.toHaveBeenCalled();
});

