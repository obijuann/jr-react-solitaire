import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import usePreferencesStore from '../stores/preferences-store';

import Card from './card';

beforeEach(() => {
  usePreferencesStore.setState({ cardAnimationEnabled: false });
});

it("renders facedown card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="down"/>);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.className).toEqual("card ");
    const cardData = cardElement.getAttribute("data-carddata") || "";
    expect(JSON.parse(cardData)).toEqual({ rank: "10", suit: "hearts", face: "down" });
    expect(cardElement.getAttribute("draggable")).toBeFalsy();
});

it("renders face up card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="up" draggable={true} />);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.className).toEqual("card hearts faceup");
    const cardData = cardElement.getAttribute("data-carddata") || "";
    expect(JSON.parse(cardData)).toEqual({ rank: "10", suit: "hearts", face: "up" });
    expect(cardElement.getAttribute("draggable")).toBeTruthy();
});

it("renders offset card", () => {
    // Arrange + Act
    render(<Card rank="10" suit="hearts" face="up" offset={12} />);

    // Assert
    const cardElement = screen.getByTestId("card");
    expect(cardElement).toBeInTheDocument();
    expect(cardElement.style.top).toEqual("12vh");
});