import '@testing-library/jest-dom/vitest';

import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import Modal from './modal';
import useStore from '../stores/store';

beforeEach(() => {
    useStore.setState({ gameTimer: 0 });
});

it("renders game win modal", () => {
    // Arrange
    useStore.setState({ gameTimer: 61 }); // 1m 1s

    // Act
    render(<Modal modalType="gamewin" />);

    // Assert
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: 01:01/i)).toBeInTheDocument();
    expect(screen.getByText(/New Game/i)).toBeInTheDocument();
});

it("clicking the 'new game' button publishes a new game event", () => {
    // Arrange
    const original = useStore.getState().newGame;
    const newGameSpy = vi.fn();
    useStore.setState({ newGame: newGameSpy });
    render(<Modal modalType="gamewin" />);

    // Act
    const newGameButton = screen.getByRole('button', { name: 'New Game' })
    fireEvent.click(newGameButton);

    // Assert
    expect(newGameSpy).toHaveBeenCalled();
    useStore.setState({ newGame: original });
});

it("clicking the modal backdrop publishes a new game event", () => {
    // Arrange
    const original = useStore.getState().newGame;
    const newGameSpy = vi.fn();
    useStore.setState({ newGame: newGameSpy });
    render(<Modal modalType="gamewin" />);

    // Act
    const backdrop = screen.getByTestId("modal-backdrop")
    fireEvent.click(backdrop);

    // Assert
    expect(newGameSpy).toHaveBeenCalled();
    useStore.setState({ newGame: original });
});
