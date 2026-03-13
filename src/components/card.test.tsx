import "@testing-library/jest-dom/vitest";

import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import usePreferencesStore from "../stores/preferences-store";

import Card from "./card";

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

it("renders moving card state", () => {
    render(<Card rank="10" suit="hearts" face="down" isMoving={true} />);

    const cardElement = screen.getByTestId("card");
    expect(cardElement.className).toContain("moving");
    expect(cardElement.style.position).toEqual("relative");
});

it("adds flip animation classes when an animated card turns face up", () => {
    vi.useFakeTimers();
    usePreferencesStore.setState({ cardAnimationEnabled: true });

    const { rerender } = render(<Card rank="10" suit="hearts" face="down" isMoving={true} />);

    rerender(<Card rank="10" suit="hearts" face="up" isMoving={true} />);

    const cardElement = screen.getByTestId("card");
    expect(cardElement.className).toContain("moving");
    expect(cardElement.className).toContain("faceup");
    expect(cardElement.className).toContain("anim");

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(cardElement.className).not.toContain("anim");
    vi.useRealTimers();
});