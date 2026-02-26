import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import useGameStore from '../stores/game-store';

beforeEach(() => {
    useGameStore.setState({ menuVisible: true, submenuId: "", shuffledDeck: [] });
});

import useStatisticsStore from '../stores/statistics-store';
import Menu from './menu';

it("renders the base menu component", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();
    expect(playButton.hasAttribute("disabled")).toBeFalsy();

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
    expect(screen.queryByRole('button', { name: 'New game' })).not.toBeInTheDocument();
    expect(screen.queryByText(/object of the game/i)).not.toBeInTheDocument();
});

it("menu control button toggles menu visibility", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert the toggle control exists
    const toggleControl = screen.getByTitle('Toggle Menu (Esc)');
    expect(toggleControl).toBeInTheDocument();

    // Act - click the toggle control to hide the menu
    fireEvent.click(toggleControl);

    // Assert the menu is no longer visible
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("firing the 'toggleMenu' event hides the menu component", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

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
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

    // Act
    fireEvent.click(playButton);
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
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

    // Act
    fireEvent.click(playButton);

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
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

    // Act
    fireEvent.click(playButton);

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
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

    // Act
    fireEvent.click(playButton);

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

it("clicking the new game button during an active game records a loss", () => {
    // Arrange
    useGameStore.setState({ menuVisible: true, submenuId: "", shuffledDeck: [{ face: "down", rank: "ace", suit: "clubs"}], gameTimer: 0 });
    const newGameOriginal = useGameStore.getState().actions.newGame;
    const recordLossOriginal = useStatisticsStore.getState().actions.recordLoss;
    const newGameSpy = vi.fn();
    const recordLossSpy = vi.fn();
    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameSpy } }));
    useStatisticsStore.setState(state => ({ actions: { ...state.actions, recordLoss: recordLossSpy } }));

    // Act
    render(<Menu />);

    // Assert
    const playButton = screen.getByRole('button', { name: 'Play' });
    expect(playButton).toBeInTheDocument();

    // Act
    fireEvent.click(playButton);

    // Assert
    const newsGameButton = screen.getByRole('button', { name: 'New game' });

    // Act
    fireEvent.click(newsGameButton);

    // Assert
    expect(newGameSpy).toHaveBeenCalled();
    expect(recordLossSpy).toHaveBeenCalled();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");

    useGameStore.setState(state => ({ actions: { ...state.actions, newGame: newGameOriginal } }));
    useStatisticsStore.setState(state => ({ actions: { ...state.actions, recordLoss: recordLossOriginal } }));
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

it("renders the statistics submenu", () => {
    // Arrange + Act
    render(<Menu />);

    // Assert
    const statsMenuButton = screen.getByRole('button', { name: 'Statistics' });
    expect(statsMenuButton).toBeInTheDocument();

    // Act
    fireEvent.click(statsMenuButton);

    // Assert
    expect(screen.getByText(/average/i)).toBeInTheDocument();
});