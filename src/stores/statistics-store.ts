import { create } from "zustand";
import { persist } from "zustand/middleware";
import usePreferencesStore from "./preferences-store";

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
    /** Total number of games won with the timer enabled. */
    totalTimedWins: number;
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
            totalTimedWins: 0,
            totalGameTime: 0,
            worstLosingStreak: 0,

            /**
             * Computes the average time per win
             * @returns Average time per win in seconds
             */
            getAverageWinTime: () => {
                const { totalGameTime, totalTimedWins } = get();
                return totalTimedWins ? Math.round(totalGameTime / totalTimedWins) : 0;
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

                    let totalGameTime = get().totalGameTime;
                    let totalTimedWins = get().totalTimedWins;
                    let bestWinTime = get().bestWinTime;

                    // Update time-based stats if the game timer is enabled
                    if (usePreferencesStore.getState().gameTimerEnabled) {
                        // Add game time to the current total
                        totalGameTime += gameTime;
                        totalTimedWins++;

                        // Check to see if this is a new record time
                        const currentBestWinTime = bestWinTime || gameTime;
                        bestWinTime = gameTime < currentBestWinTime ? gameTime : currentBestWinTime;
                    }

                    // Update the streak
                    const currentStreak = get().currentStreakType === "win" ? get().currentStreak + 1 : 1;
                    const bestWinStreak = currentStreak > get().bestWinStreak ? currentStreak : get().bestWinStreak;

                    // Update the state
                    set(() => ({ bestWinStreak, bestWinTime, currentStreak, currentStreakType: "win", totalWins: gamesWon, totalTimedWins, totalGameTime }));
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
                        currentStreakType: undefined,
                        totalLosses: 0,
                        totalWins: 0,
                        totalTimedWins: 0,
                        totalGameTime: 0,
                        worstLosingStreak: 0
                    }))
                },
            },
        }),
        {
            name: "stats-store",
            partialize: (state) => ({
                bestWinStreak: state.bestWinStreak,
                bestWinTime: state.bestWinTime,
                currentStreak: state.currentStreak,
                currentStreakType: state.currentStreakType,
                totalLosses: state.totalLosses,
                totalWins: state.totalWins,
                totalTimedWins: state.totalTimedWins,
                totalGameTime: state.totalGameTime,
                worstLosingStreak: state.worstLosingStreak
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                    state?.actions?.resetStatistics?.();
                }
            },
            migrate: (persistedState, version) => {

                const persisted = persistedState as StatisticsStoreState;

                // Version two added a separate store for total timed games
                // If the state was rehydrated with zero timed wins but non-zero wins,
                // set the default timed win number to match the number of wins
                if (version < 2 && persisted.totalWins && !persisted.totalTimedWins) {
                    persisted.totalTimedWins = persisted.totalWins;
                }

                return persisted as unknown;
            },
            version: 2
        },
    ),
)

export default useStatisticsStore;
