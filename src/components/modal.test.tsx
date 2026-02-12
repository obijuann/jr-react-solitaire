import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import useGameStore from '../stores/game-store';
import Modal from './modal';

beforeEach(() => {
    useGameStore.setState({ gameTimer: 0 });
});

it("renders game win modal", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 61 }); // 1m 1s

    // Act
    render(<Modal modalType="gamewin" />);

    // Assert
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: 01:01/i)).toBeInTheDocument();
    expect(screen.getByText(/New Game/i)).toBeInTheDocument();
});

it("clicking the 'new game' button publishes a new game event", () => {
    // Arrange
    const original = useGameStore.getState().actions.newGame;
    const newGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameSpy } }));
    render(<Modal modalType="gamewin" />);

    // Act
    const newGameButton = screen.getByRole('button', { name: 'New Game' })
    fireEvent.click(newGameButton);

    // Assert
    expect(newGameSpy).toHaveBeenCalled();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: original } }));
});

it("clicking the modal backdrop publishes a new game event", () => {
    // Arrange
    const original = useGameStore.getState().actions.newGame;
    const newGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameSpy } }));
    render(<Modal modalType="gamewin" />);

    // Act
    const backdrop = screen.getByTestId("modal-backdrop")
    fireEvent.click(backdrop);

    // Assert
    expect(newGameSpy).toHaveBeenCalled();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: original } }));
});
