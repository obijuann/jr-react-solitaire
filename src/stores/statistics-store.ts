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
    gamesLost: number;
    /** Total number of games won. */
    gamesWon: number;
    /** Cumulative time in wins. */
    totalGameTime: number;
    /** Number of losses in the worst losing streak. */
    worstLoseStreak: number;

    /** Grouped store actions */
    actions: {
        /** Returns the win rate as a percentage */
        getWinRate: () => string;
        /** Invoked after the state has been rehydrated from persistent storage. */
        onStorageRehydrated: () => void;
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
            gamesLost: 0,
            gamesWon: 0,
            totalGameTime: 0,
            worstLoseStreak: 0,

            actions: {
                /**
                 * Returns the win rate as a percentage
                 * @returns a string with the percentage of games won
                 */
                getWinRate: () => {
                    const gamesLost = get().gamesLost;
                    const gamesWon = get().gamesWon;
                    const totalGames = gamesLost + gamesWon;
                    const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                    return `${winRate}%`;
                },

                /**
                 * Invoked after the state has been rehydrated from persistent storage.
                 */
                onStorageRehydrated: () => { },

                /**
                 * Records a won game
                 * @param gameTime 
                 */
                recordWin: (gameTime: number) => {
                    // Increase the win total
                    const gamesWon = get().gamesWon + 1;

                    // Add game time to the current total
                    const totalGameTime = get().totalGameTime + gameTime;

                    // Update the streak
                    const currentStreak = get().currentStreakType === "win" ? get().currentStreak + 1 : 1;
                    const bestWinStreak = currentStreak > get().bestWinStreak ? currentStreak : get().bestWinStreak;

                    // Check to see if this is a new record time
                    const currentBestWinTime = get().bestWinTime || gameTime;
                    const bestWinTime = gameTime < currentBestWinTime ? gameTime : currentBestWinTime;

                    // Update the state
                    set(() => ({ bestWinStreak, bestWinTime, currentStreak, currentStreakType: "win", gamesWon, totalGameTime }));
                },

                /**
                 * Records a lost game
                 */
                recordLoss: () => {
                    // Increase the loss total
                    const gamesLost = get().gamesLost + 1;

                    // Update the streak
                    const currentStreak = get().currentStreakType === "loss" ? get().currentStreak + 1 : 1;

                    // Update the state
                    set(() => ({ currentStreak, currentStreakType: "loss", gamesLost }));
                },

                /**
                 * Resets all statistics
                 */
                resetStatistics: () => {
                    set(() => ({
                        bestWinStreak: 0,
                        bestWinTime: 0,
                        currentStreak: 0,
                        gamesLost: 0,
                        gamesWon: 0,
                        totalGameTime: 0,
                        worstLoseStreak: 0
                    }))
                }
            },
        }),
        {
            name: 'stats-store',
            onRehydrateStorage: () => (state, error) => {
                state?.actions?.onStorageRehydrated?.();
                if (error) {
                    console.error(`error on stats store hydration: ${error}`);
                    state?.actions?.resetStatistics();
                }
            },
            version: 1
        },
    ),
)

export default useStatisticsStore;
