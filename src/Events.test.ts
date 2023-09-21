import { publish, subscribe, unsubscribe } from "./Events";

test("subscribe and publish functions", () => {
    // Arrange
    const listener = jest.fn();
    subscribe("test", listener);

    // Act
    publish("test", "test data");

    // Assert
    expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
            type: "test",
            detail: "test data",
        })
    );
});

test("unsubscribe function", () => {
    // Arrange
    const listener = jest.fn();
    subscribe("test", listener);

    // Act
    unsubscribe("test", listener);
    publish("test", "test data");

    // Assert
    expect(listener).not.toHaveBeenCalled();
});

