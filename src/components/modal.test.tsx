import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import useGameStore from '../stores/game-store';
import usePreferencesStore from "../stores/preferences-store";
import Modal from './modal';

beforeEach(() => {
    useGameStore.setState({ gameTimer: 0, modalType: "gamewin" });
});

it("renders game win modal", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 61 }); // 1m 1s

    // Act
    render(<Modal />);

    // Assert
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: 01:01/i)).toBeInTheDocument();
    expect(screen.getByText(/New Game/i)).toBeInTheDocument();
});

it("renders game win modal without a time if the user has disabled the game timer", () => {
    // Arrange
    useGameStore.setState({ gameTimer: 0 });
    usePreferencesStore.setState({ gameTimerEnabled: false });

    // Act
    render(<Modal />);

    // Assert
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.queryByText(/Time:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/New Game/i)).toBeInTheDocument();
});

it("clicking the 'new game' button publishes a new game event", () => {
    // Arrange
    const newGameOriginal = useGameStore.getState().actions.newGame;
    const quitGameOriginal = useGameStore.getState().actions.quitGame;
    const newGameSpy = vi.fn();
    const quitGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameSpy, quitGame: quitGameSpy }, }));
    render(<Modal />);

    // Act
    const newGameButton = screen.getByRole('button', { name: 'New Game' })
    fireEvent.click(newGameButton);

    // Assert
    expect(newGameSpy).toHaveBeenCalledOnce();
    expect(quitGameSpy).not.toHaveBeenCalled();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameOriginal, quitGame: quitGameOriginal } }));
});

it("clicking the game win modal backdrop publishes a quit game event", () => {
    // Arrange
    const original = useGameStore.getState().actions.quitGame;
    const quitGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: quitGameSpy } }));
    render(<Modal />);

    // Act
    const backdrop = screen.getByTestId("modal-backdrop")
    fireEvent.click(backdrop);

    // Assert
    expect(quitGameSpy).toHaveBeenCalledOnce();
    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: original } }));
});

it("clicking the modal backdrop outside of a game win closes the modal", () => {
    // Arrange
    const quitGameOriginal = useGameStore.getState().actions.quitGame;
    const quitGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: quitGameSpy, }, modalType: undefined }));
    render(<Modal />);

    // Act
    const backdrop = screen.getByTestId("modal-backdrop")
    fireEvent.click(backdrop);

    // Assert
    expect(quitGameSpy).not.toHaveBeenCalled();
    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: quitGameOriginal } }));
});