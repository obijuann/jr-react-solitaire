import { create } from "zustand";
import { persist } from "zustand/middleware";

type StatisticsStoreState = {
    /** Number of wins in the best winning streak. */
    bestWinStreak: number;
    /** Shortest time for a winning game. */
    bestWinTime: number;
    /** Number of wins/losses in the current streak. */
    currentStreak: number;
    /** Streak type */
    currentStreakType?: "win" | "loss";
    /** Total number of games lost. */
    totalLosses: number;
    /** Total number of games won. */
    totalWins: number;
    /** Cumulative time in wins. */
    totalGameTime: number;
    /** Number of losses in the worst losing streak. */
    worstLosingStreak: number;

    /** Computed values based on state */

    /** Computes the average time per win */
    getAverageWinTime: () => number,
    /** Computes the win rate percentage and returns a formatted string value */
    getWinRate: () => string,
    /** Computes the current streak and returns a formatted string value */
    getCurrentStreakText: () => string,

    /** Grouped store actions */
    actions: {
        /** Records a won game */
        recordWin: (gameTime: number) => void;
        /** Records a lost game */
        recordLoss: () => void;
        /** Resets all statistics */
        resetStatistics: () => void;
    };
};

export const useStatisticsStore = create<StatisticsStoreState>()(
    persist(
        (set, get) => ({
            bestWinStreak: 0,
            bestWinTime: 0,
            currentStreak: 0,
            totalLosses: 0,
            totalWins: 0,
            totalGameTime: 0,
            worstLosingStreak: 0,

            /**
             * Computes the average time per win
             * @returns Average time per win in seconds
             */
            getAverageWinTime: () => {
                const { totalGameTime, totalWins } = get();
                return totalWins ? Math.round(totalGameTime / totalWins) : 0;
            },

            /**
             * Computes the current streak string
             * @returns user-readable string value for the current streak
             */
            getCurrentStreakText: () => {
                const { currentStreak, currentStreakType } = get();
                let currentStreakText = `${currentStreak}`;
                if (currentStreak === 1) {
                    currentStreakText += `${currentStreakType === "win" ? " win" : " loss"}`;
                } else if (currentStreak) {
                    currentStreakText += `${currentStreakType === "win" ? " wins" : " losses"}`;
                }
                return currentStreakText;
            },

            /**
             * Computes the win rate percentage
             * @returns user-readable string value for the win rate percentage
             */
            getWinRate: () => {
                const { totalLosses, totalWins } = get();
                const totalGames = totalWins + totalLosses;
                const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
                return `${winRate}%`;
            },

            actions: {
                /**
                 * Records a won game
                 * @param gameTime 
                 */
                recordWin: (gameTime: number) => {
                    // Increase the win total
                    const gamesWon = get().totalWins + 1;

                    // Add game time to the current total
                    const totalGameTime = get().totalGameTime + gameTime;

                    // Update the streak
                    const currentStreak = get().currentStreakType === "win" ? get().currentStreak + 1 : 1;
                    const bestWinStreak = currentStreak > get().bestWinStreak ? currentStreak : get().bestWinStreak;

                    // Check to see if this is a new record time
                    const currentBestWinTime = get().bestWinTime || gameTime;
                    const bestWinTime = gameTime < currentBestWinTime ? gameTime : currentBestWinTime;

                    // Update the state
                    set(() => ({ bestWinStreak, bestWinTime, currentStreak, currentStreakType: "win", totalWins: gamesWon, totalGameTime }));
                },

                /**
                 * Records a lost game
                 */
                recordLoss: () => {
                    // Increase the loss total
                    const gamesLost = get().totalLosses + 1;

                    // Update the streak
                    const currentStreak = get().currentStreakType === "loss" ? get().currentStreak + 1 : 1;
                    const worstLoseStreak = currentStreak > get().worstLosingStreak ? currentStreak : get().worstLosingStreak;

                    // Update the state
                    set(() => ({ currentStreak, currentStreakType: "loss", totalLosses: gamesLost, worstLosingStreak: worstLoseStreak }));
                },

                /**
                 * Resets all statistics
                 */
                resetStatistics: () => {
                    set(() => ({
                        bestWinStreak: 0,
                        bestWinTime: 0,
                        currentStreak: 0,
                        totalLosses: 0,
                        totalWins: 0,
                        totalGameTime: 0,
                        worstLosingStreak: 0
                    }))
                }
            },
        }),
        {
            name: 'stats-store',
            partialize: (state) => ({
                bestWinStreak: state.bestWinStreak,
                bestWinTime: state.bestWinTime,
                currentStreak: state.currentStreak,
                currentStreakType: state.currentStreakType,
                totalLosses: state.totalLosses,
                totalWins: state.totalWins,
                totalGameTime: state.totalGameTime,
                worstLosingStreak: state.worstLosingStreak
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                }
                state?.actions?.resetStatistics?.();
            },
            version: 1
        },
    ),
)

export default useStatisticsStore;
