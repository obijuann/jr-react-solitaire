import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CardBacks, CardFaces } from "../types/card-data";
import { ThemeColors } from "../types/theme";

type PreferencesStoreState = {
    /** User's preferred theme color. */
    themeColor: ThemeColors;

    /** User's preferred card face artwork. */
    cardFace: CardFaces;

    /** User's preferred card back artwork. */
    cardBack: CardBacks;

    /** Flag indicating whether the game will use a timer. */
    gameTimerEnabled: boolean;

    /** Flag indicating whether card animations are enabled. */
    cardAnimationEnabled: boolean;

    /** Flag indicating whether eligible cards are automatically moved to the foundation. */
    autoCollectEnabled: boolean;

    /** Flag indicating whether new games should be restricted to precomputed solvable deals. */
    solvableOnlyEnabled: boolean;

    /** Grouped store actions */
    actions: {
        /** Resets all user preferences */
        resetPreferences: () => void;
    };
};

export const usePreferencesStore = create<PreferencesStoreState>()(
    persist(
        (set) => ({
            themeColor: "green",
            cardFace: "english",
            cardBack: "blue",
            gameTimerEnabled: true,
            cardAnimationEnabled: true,
            autoCollectEnabled: true,
            solvableOnlyEnabled: true,

            actions: {
                /**
                 * Reset all user preferences to factory defaults.
                 */
                resetPreferences: () => {
                    set(() => ({
                        themeColor: "green",
                        cardFace: "english",
                        cardBack: "blue",
                        gameTimerEnabled: true,
                        cardAnimationEnabled: true,
                        autoCollectEnabled: true,
                        solvableOnlyEnabled: true
                    }))
                }
            },
        }),
        {
            name: "prefs-store",
            partialize: (state) => ({
                themeColor: state.themeColor,
                cardFace: state.cardFace,
                cardBack: state.cardBack,
                gameTimerEnabled: state.gameTimerEnabled,
                cardAnimationEnabled: state.cardAnimationEnabled,
                autoCollectEnabled: state.autoCollectEnabled,
                solvableOnlyEnabled: state.solvableOnlyEnabled
            }),
            // Add default for the solvable-only flag when hydrating older persisted versions.
            migrate: (persistedState, version) => {
                if (version < 4) {
                    return {
                        ...(persistedState as Record<string, unknown>),
                        solvableOnlyEnabled: true,
                    };
                }
                return persistedState;
            },
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                    state?.actions?.resetPreferences?.();
                }
            },
            // Version 4 introduces the persisted `solvableOnlyEnabled` preference.
            version: 4
        },
    ),
)

export default usePreferencesStore;
