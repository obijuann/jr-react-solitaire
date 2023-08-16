import { render, screen } from '@testing-library/react';

import Card from './Card';

test("renders facedown card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="down" />);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.className).toEqual("card ");
    expect(JSON.parse(cardElement.getAttribute("data-carddata"))).toEqual({ rank: "10", suit: "hearts", face: "down" });
    expect(cardElement.getAttribute("draggable")).toEqual("false");
});

test("renders face up card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="up" />);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.className).toEqual("card hearts faceup");
    expect(JSON.parse(cardElement.getAttribute("data-carddata"))).toEqual({ rank: "10", suit: "hearts", face: "up" });
    expect(cardElement.getAttribute("draggable")).toEqual("true");
});

test("renders offset card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="up" offset="12" />);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.style.transform).toEqual("translateY(12vh)");
});