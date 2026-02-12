import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';

import useGameStore from '../stores/game-store';
import Timer from './timer';

beforeEach(() => {
    useGameStore.setState({ gameTimer: 0 });
});

it("renders empty timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 0 });

    // Act
    render(<Timer />);

    // Assert
    expect(screen.getByText(/00:00/i)).toBeInTheDocument();
});

it("renders timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 61 }); // 1m 1s

    // Act
    render(<Timer />);

    // Assert
    expect(screen.getByText(/01:01/i)).toBeInTheDocument();
});