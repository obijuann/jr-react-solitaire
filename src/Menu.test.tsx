import { act, fireEvent, render, screen } from '@testing-library/react';
import { eventNames, publish, subscribe } from './Events';

import Menu from './Menu';

test("renders the base menu component", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

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

test("firing the 'toggleMenu' event hides the menu component", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    act(() => {
        // Wrapped in an act call since this is render-affecting
        publish("toggleMenu");
    });

    // Assert
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

test("firing the 'toggleMenu' event hides the submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const newButton = screen.getByRole('button', { name: 'New' });
    expect(newButton).toBeInTheDocument();

    // Act
    fireEvent.click(newButton);
    expect(screen.getByRole('button', { name: 'Restart this game' })).toBeInTheDocument();
    act(() => {
        // Wrapped in an act call since this is render-affecting
        publish("toggleMenu");
    });

    // Assert
    expect(screen.queryByRole('button', { name: 'Restart this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).toEqual("visible");
});

test("renders the new game submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

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

test("clicking the restart game button publishes a new game event and closes all menus", () => {
    // Arrange
    const restartGameListener = jest.fn();
    subscribe("restartGame", restartGameListener);

    // Act
    render(<Menu gameActive={true} />);

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
    expect(restartGameListener).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Restart this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

test("clicking the quit game button publishes a new game event and closes all menus", () => {
    // Arrange
    const quitGameListener = jest.fn();
    subscribe("exitGame", quitGameListener);

    // Act
    render(<Menu gameActive={true} />);

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
    expect(quitGameListener).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Quit this game' })).not.toBeInTheDocument();
    expect(screen.getByTestId("menu").className).not.toEqual("visible");
});

test("renders the help submenu", () => {
    // Arrange + Act
    render(<Menu gameActive={false} />);

    // Assert
    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton).toBeInTheDocument();

    // Act
    fireEvent.click(helpButton);

    // Assert
    expect(screen.getByText(/object of the game/i)).toBeInTheDocument();
});
