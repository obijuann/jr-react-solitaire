import Modal, { modalTypes } from './Modal';
import { eventNames, subscribe } from './Events';
import { fireEvent, render, screen } from '@testing-library/react';

test("renders game win modal", () => {
    // Arrange + Act
    render(<Modal modalType={modalTypes.GameWin} gameTime="09:99" />);

    // Assert
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: 09:99/i)).toBeInTheDocument();
    expect(screen.getByText(/New Game/i)).toBeInTheDocument();
});

test("clicking the 'new game' button publishes a new game event", () => {
    // Arrange
    const newGameListener = jest.fn();
    subscribe(eventNames.NewGame, newGameListener);
    render(<Modal modalType={modalTypes.GameWin} gameTime="09:99" />);

    // Act
    const newGameButton = screen.getByRole('button', { name: 'New Game' })
    fireEvent.click(newGameButton);

    // Assert
    expect(newGameListener).toHaveBeenCalled();
});

test("clicking the backdrop closes the modal", () => {
    // Arrange
    render(<Modal modalType={modalTypes.GameWin} gameTime="09:99" />);

    // Act
    const backdrop = screen.getByTestId("modal-backdrop")
    fireEvent.click(backdrop);

    // Assert
    expect(screen.queryByTestId("modal-backdrop")).not.toBeInTheDocument();
});
