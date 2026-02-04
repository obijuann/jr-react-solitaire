import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import useGameStore from '../stores/game-store';

beforeEach(() => {
    useGameStore.setState({ menuVisible: true, submenuId: "", shuffledDeck: [] });
});

import Menu from './menu';

it("renders the base menu component", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();
    expect(newButton.hasAttribute("disabled")).toBeFalsy();

    const undoButton = screen.getByRole('button', { name: 'Undo' });
    expect(undoButton).toBeInTheDocument();
    expect(undoButton.hasAttribute("disabled")).toBeTruthy();

    const redoButton = screen.getByRole('button', { name: 'Redo' });
    expect(redoButton).toBeInTheDocument();
    expect(redoButton.hasAttribute("disabled")).toBeTruthy();

    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton).toBeInTheDocument();
    expect(helpButton.hasAttribute("disabled")).toBeFalsy();

    // Assert no submenus are present
    expect(screen.queryByRole('button', { name: 'New Game' })).not.toBeInTheDocument();
    expect(screen.queryByText(/object of the game/i)).not.toBeInTheDocument();
});

it("firing the 'toggleMenu' event hides the menu component", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    act(() => {
        // Wrapped in an act call since this is render-affecting
        useGameStore.getState().actions.toggleMenu();
    });

    // Assert
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("firing the 'toggleMenu' event hides the submenu", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    fireEvent.click(newButton);
    expect(screen.getByRole('button', { name: 'Restart this game' })).toBeInTheDocument();
    act(() => {
        // Wrapped in an act call since this is render-affecting
        useGameStore.getState().actions.toggleMenu();
    });

    // Assert
    expect(screen.queryByRole('button', { name: 'Restart this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("renders the new game submenu", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    fireEvent.click(newButton);

    // Assert
    const newGameButton = screen.getByRole('button', { name: 'New game' });
    expect(newGameButton).toBeInTheDocument();
    expect(newGameButton.hasAttribute("disabled")).toBeFalsy();

    const restartGameButton = screen.getByRole('button', { name: 'Restart this game' });
    expect(restartGameButton).toBeInTheDocument();
    expect(restartGameButton.hasAttribute("disabled")).toBeTruthy();

    const quitGameButton = screen.getByRole('button', { name: 'Quit this game' });
    expect(quitGameButton).toBeInTheDocument();
    expect(quitGameButton.hasAttribute("disabled")).toBeTruthy();
});

it("clicking the restart game button calls store.restartGame and closes all menus", () => {
    // Arrange
    useGameStore.setState({ menuVisible: true, submenuId: "", shuffledDeck: [{ face: "down", rank: "ace", suit: "clubs"}] });
    const original = useGameStore.getState().actions.restartGame;
    const restartSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, restartGame: restartSpy } }));

    // Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    fireEvent.click(newButton);

    // Assert
    const restartGameButton = screen.getByRole('button', { name: 'Restart this game' });

    // Act
    fireEvent.click(restartGameButton);

    // Assert
    expect(restartSpy).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Restart this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");

    useGameStore.setState(state => ({ actions: { ...state.actions, restartGame: original } }));
});

it("clicking the quit game button calls store.quitGame and closes all menus", () => {
    // Arrange
    useGameStore.setState({ menuVisible: true, submenuId: "", shuffledDeck: [{ face: "down", rank: "ace", suit: "clubs"}] });
    const original = useGameStore.getState().actions.quitGame;
    const quitGameSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: quitGameSpy } }));

    // Act
    render(<Menu />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    fireEvent.click(newButton);

    // Assert
    const quitGameButton = screen.getByRole('button', { name: 'Quit this game' });

    // Act
    fireEvent.click(quitGameButton);

    // Assert
    expect(quitGameSpy).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Quit this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");

    useGameStore.setState(state => ({ actions: { ...state.actions, quitGame: original } }));
});

it("renders the help submenu", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton).toBeInTheDocument();

    // Act
    fireEvent.click(helpButton);

    // Assert
    expect(screen.getByText(/object of the game/i)).toBeInTheDocument();
});