import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import useGameStore from "../stores/game-store";
import usePreferencesStore from "../stores/preferences-store";
import Timer from "./timer";

beforeEach(() => {
    useGameStore.setState({ gameTimer: 0 });
});

it("renders empty timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 0 });

    // Act
    render(<Timer />);

    // Assert
    expect(screen.queryByText(/--:--/i)).toBeInTheDocument();
});

it("renders timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 61 }); // 1m 1s

    // Act
    render(<Timer />);

    // Assert
    expect(screen.queryByText(/01:01/i)).toBeInTheDocument();
});

it("does not render timer if the user has disabled the game timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 0 });
    usePreferencesStore.setState({ gameTimerEnabled: false });

    // Act
    render(<Timer />);

    // Assert
    expect(screen.queryByText(/--:--/i)).not.toBeInTheDocument();
});