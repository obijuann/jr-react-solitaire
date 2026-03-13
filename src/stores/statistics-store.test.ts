import { beforeEach, describe, expect, it } from "vitest";
import usePreferencesStore from "./preferences-store";
import useStatisticsStore from "./statistics-store";

describe("Statistics store actions", () => {

    beforeEach(() => {
        useStatisticsStore.setState({
            bestWinStreak: 0,
            bestWinTime: 0,
            currentStreak: 0,
            totalLosses: 0,
            totalWins: 0,
            totalTimedWins: 0,
            totalGameTime: 0,
            worstLosingStreak: 0
        });

        usePreferencesStore.setState({
            gameTimerEnabled: true
        });

    });

    it("getAverageWinTime returns a correct average win time", () => {
        // Arrange + Act
        useStatisticsStore.setState({ totalGameTime: 0, totalTimedWins: 0 });
        // Assert
        expect(useStatisticsStore.getState().getAverageWinTime()).toBe(0);

        // Arrange + Act
        useStatisticsStore.setState({ totalGameTime: 500, totalTimedWins: 5 });
        // Assert
        expect(useStatisticsStore.getState().getAverageWinTime()).toBe(100);

        // Arrange + Act
        useStatisticsStore.setState({ totalGameTime: 9999, totalTimedWins: 5 });
        // Assert
        expect(useStatisticsStore.getState().getAverageWinTime()).toBe(2000);
    });

    it("getCurrentStreakText returns properly formatted string for the current streak", () => {
        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 0, currentStreakType: undefined });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("0");

        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 0, currentStreakType: "win" });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("0");

        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 1, currentStreakType: "win" });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("1 win");

        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 2, currentStreakType: "win" });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("2 wins");

        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 1, currentStreakType: "loss" });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("1 loss");

        // Arrange + Act
        useStatisticsStore.setState({ currentStreak: 2, currentStreakType: "loss" });
        // Assert
        expect(useStatisticsStore.getState().getCurrentStreakText()).toBe("2 losses");
    });

    it("getWinRate returns a properly formatted win rate", () => {
        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 0, totalWins: 0 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("0%");

        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 10, totalWins: 0 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("0%");

        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 2, totalWins: 1 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("33%");

        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 10, totalWins: 10 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("50%");

        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 333, totalWins: 900 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("73%");

        // Arrange + Act
        useStatisticsStore.setState({ totalLosses: 0, totalWins: 10 });
        // Assert
        expect(useStatisticsStore.getState().getWinRate()).toBe("100%");
    });

    it("recordLoss adds a loss to the store", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 120,
            currentStreak: 1,
            currentStreakType: "loss",
            totalLosses: 1,
            totalWins: 4,
            totalGameTime: 500,
            worstLosingStreak: 1
        });

        // Act
        useStatisticsStore.getState().actions.recordLoss();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(120);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("loss");
        expect(useStatisticsStore.getState().totalLosses).toBe(2);
        expect(useStatisticsStore.getState().totalWins).toBe(4);
        expect(useStatisticsStore.getState().totalGameTime).toBe(500);
        expect(useStatisticsStore.getState().worstLosingStreak).toBe(2);
    });

    it("recordLoss breaks a winning streak", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 5,
            bestWinTime: 500,
            currentStreak: 5,
            currentStreakType: "win",
            totalLosses: 5,
            totalWins: 5,
            totalTimedWins: 5,
            totalGameTime: 2500,
            worstLosingStreak: 0
        });

        // Act
        useStatisticsStore.getState().actions.recordLoss();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(5);
        expect(useStatisticsStore.getState().bestWinTime).toBe(500);
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("loss");
        expect(useStatisticsStore.getState().totalLosses).toBe(6);
        expect(useStatisticsStore.getState().totalWins).toBe(5);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(5);
        expect(useStatisticsStore.getState().totalGameTime).toBe(2500);
        expect(useStatisticsStore.getState().worstLosingStreak).toBe(1);
    });

    it("recordWin adds a win to the store", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 120,
            currentStreak: 1,
            currentStreakType: "win",
            totalLosses: 1,
            totalWins: 4,
            totalTimedWins: 3,
            totalGameTime: 500,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(120);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalLosses).toBe(1);
        expect(useStatisticsStore.getState().totalWins).toBe(5);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(4);
        expect(useStatisticsStore.getState().totalGameTime).toBe(740);
    });

    it("recordWin breaks a losing streak", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 0,
            bestWinTime: 0,
            currentStreak: 5,
            currentStreakType: "loss",
            totalLosses: 5,
            totalWins: 0,
            totalTimedWins: 0,
            totalGameTime: 0,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(1);
        expect(useStatisticsStore.getState().bestWinTime).toBe(240);
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalLosses).toBe(5);
        expect(useStatisticsStore.getState().totalWins).toBe(1);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(1);
        expect(useStatisticsStore.getState().totalGameTime).toBe(240);
    });

    it("recordWin updates current best streaks and times", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 10,
            bestWinTime: 500,
            currentStreak: 10,
            currentStreakType: "win",
            totalLosses: 5,
            totalWins: 10,
            totalTimedWins: 10,
            totalGameTime: 1200,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(11);
        expect(useStatisticsStore.getState().bestWinTime).toBe(240);
        expect(useStatisticsStore.getState().currentStreak).toBe(11);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalLosses).toBe(5);
        expect(useStatisticsStore.getState().totalWins).toBe(11);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(11);
        expect(useStatisticsStore.getState().totalGameTime).toBe(1440);
    });

    it("recordWin adds does not add a timed win or increment total game time if the timer is disabled", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 120,
            currentStreak: 1,
            currentStreakType: "win",
            totalLosses: 1,
            totalWins: 4,
            totalTimedWins: 3,
            totalGameTime: 500,
        });

        usePreferencesStore.setState({
            gameTimerEnabled: false
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(119);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(120);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalLosses).toBe(1);
        expect(useStatisticsStore.getState().totalWins).toBe(5);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(3);
        expect(useStatisticsStore.getState().totalGameTime).toBe(500);
    });

    it("recordWin updates timed values for the first timed win", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 0,
            currentStreak: 1,
            currentStreakType: "win",
            totalLosses: 1,
            totalWins: 4,
            totalTimedWins: 0,
            totalGameTime: 0,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(119);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(119);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalLosses).toBe(1);
        expect(useStatisticsStore.getState().totalWins).toBe(5);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(1);
        expect(useStatisticsStore.getState().totalGameTime).toBe(119);
    });

    it("resetStatistics resets the store", () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 500,
            bestWinTime: 120,
            currentStreak: 50,
            currentStreakType: "win",
            totalLosses: 1,
            totalWins: 600,
            totalTimedWins: 200,
            totalGameTime: 983749387,
            worstLosingStreak: 5
        });

        // Act
        useStatisticsStore.getState().actions.resetStatistics();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(0);
        expect(useStatisticsStore.getState().bestWinTime).toBe(0);
        expect(useStatisticsStore.getState().currentStreak).toBe(0);
        expect(useStatisticsStore.getState().currentStreakType).toBeUndefined();
        expect(useStatisticsStore.getState().totalLosses).toBe(0);
        expect(useStatisticsStore.getState().totalWins).toBe(0);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(0);
        expect(useStatisticsStore.getState().totalGameTime).toBe(0);
        expect(useStatisticsStore.getState().worstLosingStreak).toBe(0);
    });

    it("recordWin and recordLoss handle undefined currentStreakType correctly", () => {
        // Arrange
        useStatisticsStore.setState({ currentStreak: 0, currentStreakType: undefined, totalWins: 0, totalLosses: 0, totalGameTime: 0 });

        // Act
        useStatisticsStore.getState().actions.recordWin(120);

        // Assert
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().totalWins).toBe(1);
        expect(useStatisticsStore.getState().totalTimedWins).toBe(1);
        expect(useStatisticsStore.getState().totalGameTime).toBe(120);

        // Act
        useStatisticsStore.getState().actions.resetStatistics();
        useStatisticsStore.getState().actions.recordLoss();

        // Assert
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("loss");
        expect(useStatisticsStore.getState().totalLosses).toBe(1);
    });
});