import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { publish, subscribe } from './Events';

import Menu from './Menu';

it("renders the base menu component", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();
    expect(newButton.hasAttribute("disabled")).toBeFalsy();

    const undoButton = screen.getByRole('button', { name: 'Undo' });
    expect(undoButton).toBeDefined();
    expect(undoButton.hasAttribute("disabled")).toBeTruthy();

    const redoButton = screen.getByRole('button', { name: 'Redo' });
    expect(redoButton).toBeDefined();
    expect(redoButton.hasAttribute("disabled")).toBeTruthy();

    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton).toBeDefined();
    expect(helpButton.hasAttribute("disabled")).toBeFalsy();

    // Assert no submenus are present
    expect(screen.queryByRole('button', { name: 'New Game' })).toBeFalsy();
    expect(screen.queryByText(/object of the game/i)).toBeFalsy();
});

it("firing the 'toggleMenu' event hides the menu component", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();

    // Act
    act(() => {
        // Wrapped in an act call since this is render-affecting
        publish("toggleMenu");
    });

    // Assert
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("firing the 'toggleMenu' event hides the submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();

    // Act
    fireEvent.click(newButton);
    expect(screen.getByRole('button', { name: 'Restart this game' })).toBeDefined();
    act(() => {
        // Wrapped in an act call since this is render-affecting
        publish("toggleMenu");
    });

    // Assert
    expect(screen.queryByRole('button', { name: 'Restart this game' })).toBeFalsy();
    expect(screen.getByTestId("menu").className).toEqual("visible");
});

it("renders the new game submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();

    // Act
    fireEvent.click(newButton);

    // Assert
    const newGameButton = screen.getByRole('button', { name: 'New game' });
    expect(newGameButton).toBeDefined();
    expect(newGameButton.hasAttribute("disabled")).toBeFalsy();

    const restartGameButton = screen.getByRole('button', { name: 'Restart this game' });
    expect(restartGameButton).toBeDefined();
    expect(restartGameButton.hasAttribute("disabled")).toBeTruthy();

    const quitGameButton = screen.getByRole('button', { name: 'Quit this game' });
    expect(quitGameButton).toBeDefined();
    expect(quitGameButton.hasAttribute("disabled")).toBeTruthy();
});

it("clicking the restart game button publishes a new game event and closes all menus", () => {
    // Arrange
    const restartGameListener = vi.fn();
    subscribe("restartGame", restartGameListener);

    // Act
    render(<Menu gameActive={true} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();

    // Act
    fireEvent.click(newButton);

    // Assert
    const restartGameButton = screen.getByRole('button', { name: 'Restart this game' });

    // Act
    fireEvent.click(restartGameButton);

    // Assert
    expect(restartGameListener).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Restart this game' })).toBeFalsy();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("clicking the quit game button publishes a new game event and closes all menus", () => {
    // Arrange
    const quitGameListener = vi.fn();
    subscribe("exitGame", quitGameListener);

    // Act
    render(<Menu gameActive={true} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeDefined();

    // Act
    fireEvent.click(newButton);

    // Assert
    const quitGameButton = screen.getByRole('button', { name: 'Quit this game' });

    // Act
    fireEvent.click(quitGameButton);

    // Assert
    expect(quitGameListener).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Quit this game' })).toBeFalsy();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

it("renders the help submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton).toBeDefined();

    // Act
    fireEvent.click(helpButton);

    // Assert
    expect(screen.getByText(/object of the game/i)).toBeDefined();
});
