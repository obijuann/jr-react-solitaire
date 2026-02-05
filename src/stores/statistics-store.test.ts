import { beforeEach, describe, expect, it } from 'vitest';
import useStatisticsStore from './statistics-store';

beforeEach(() => {
    useStatisticsStore.setState({
        bestWinStreak: 0,
        bestWinTime: 0,
        currentStreak: 0,
        gamesLost: 0,
        gamesWon: 0,
        totalGameTime: 0,
        worstLoseStreak: 0
    });
});

describe('Statistics store actions', () => {
    it('getWinRate returns a properly formatted win rate', () => {
        // Arrange + Act
        useStatisticsStore.setState({ gamesLost: 0, gamesWon: 0 });
        // Assert
        expect(useStatisticsStore.getState().actions.getWinRate()).toBe("0%");

        // Arrange + Act
        useStatisticsStore.setState({ gamesLost: 10, gamesWon: 0 });
        // Assert
        expect(useStatisticsStore.getState().actions.getWinRate()).toBe("0%");

        // Arrange + Act
        useStatisticsStore.setState({ gamesLost: 333, gamesWon: 900 });
        // Assert
        expect(useStatisticsStore.getState().actions.getWinRate()).toBe("73%");

        // Arrange + Act
        useStatisticsStore.setState({ gamesLost: 10, gamesWon: 10 });
        // Assert
        expect(useStatisticsStore.getState().actions.getWinRate()).toBe("50%");

        // Arrange + Act
        useStatisticsStore.setState({ gamesLost: 0, gamesWon: 10 });
        // Assert
        expect(useStatisticsStore.getState().actions.getWinRate()).toBe("100%");
    });

    it('recordLoss adds a loss to the store', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 120,
            currentStreak: 1,
            currentStreakType: "loss",
            gamesLost: 1,
            gamesWon: 4,
            totalGameTime: 500,
        });

        // Act
        useStatisticsStore.getState().actions.recordLoss();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(120);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("loss");
        expect(useStatisticsStore.getState().gamesLost).toBe(2);
        expect(useStatisticsStore.getState().gamesWon).toBe(4);
        expect(useStatisticsStore.getState().totalGameTime).toBe(500);
    });

    it('recordLoss breaks a winning streak', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 5,
            bestWinTime: 500,
            currentStreak: 5,
            currentStreakType: "win",
            gamesLost: 5,
            gamesWon: 5,
            totalGameTime: 2500,
        });

        // Act
        useStatisticsStore.getState().actions.recordLoss();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(5);
        expect(useStatisticsStore.getState().bestWinTime).toBe(500);
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("loss");
        expect(useStatisticsStore.getState().gamesLost).toBe(6);
        expect(useStatisticsStore.getState().gamesWon).toBe(5);
        expect(useStatisticsStore.getState().totalGameTime).toBe(2500);
    });

    it('recordWin adds a win to the store', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 2,
            bestWinTime: 120,
            currentStreak: 1,
            currentStreakType: "win",
            gamesLost: 1,
            gamesWon: 4,
            totalGameTime: 500,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(2);
        expect(useStatisticsStore.getState().bestWinTime).toBe(120);
        expect(useStatisticsStore.getState().currentStreak).toBe(2);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().gamesLost).toBe(1);
        expect(useStatisticsStore.getState().gamesWon).toBe(5);
        expect(useStatisticsStore.getState().totalGameTime).toBe(740);
    });

    it('recordWin breaks a losing streak', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 0,
            bestWinTime: 0,
            currentStreak: 5,
            currentStreakType: "loss",
            gamesLost: 5,
            gamesWon: 0,
            totalGameTime: 0,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(1);
        expect(useStatisticsStore.getState().bestWinTime).toBe(240);
        expect(useStatisticsStore.getState().currentStreak).toBe(1);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().gamesLost).toBe(5);
        expect(useStatisticsStore.getState().gamesWon).toBe(1);
        expect(useStatisticsStore.getState().totalGameTime).toBe(240);
    });

    it('recordWin updates current best streaks and times', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 10,
            bestWinTime: 500,
            currentStreak: 10,
            currentStreakType: "win",
            gamesLost: 5,
            gamesWon: 10,
            totalGameTime: 1200,
        });

        // Act
        useStatisticsStore.getState().actions.recordWin(240);

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(11);
        expect(useStatisticsStore.getState().bestWinTime).toBe(240);
        expect(useStatisticsStore.getState().currentStreak).toBe(11);
        expect(useStatisticsStore.getState().currentStreakType).toBe("win");
        expect(useStatisticsStore.getState().gamesLost).toBe(5);
        expect(useStatisticsStore.getState().gamesWon).toBe(11);
        expect(useStatisticsStore.getState().totalGameTime).toBe(1440);
    });

    it('resetStatistics resets the store', () => {
        // Arrange 
        useStatisticsStore.setState({
            bestWinStreak: 500,
            bestWinTime: 120,
            currentStreak: 50,
            currentStreakType: "win",
            gamesLost: 1,
            gamesWon: 600,
            totalGameTime: 983749387,
            worstLoseStreak: 5
        });

        // Act
        useStatisticsStore.getState().actions.resetStatistics();

        // Assert
        expect(useStatisticsStore.getState().bestWinStreak).toBe(0);
        expect(useStatisticsStore.getState().bestWinTime).toBe(0);
        expect(useStatisticsStore.getState().currentStreak).toBe(0);
        expect(useStatisticsStore.getState().gamesLost).toBe(0);
        expect(useStatisticsStore.getState().gamesWon).toBe(0);
        expect(useStatisticsStore.getState().totalGameTime).toBe(0);
        expect(useStatisticsStore.getState().worstLoseStreak).toBe(0);
    });
});
