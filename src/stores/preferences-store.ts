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

            actions: {
                /**
                 * Resets all user preferences
                 */
                resetPreferences: () => {
                    set(() => ({
                        themeColor: "green",
                        cardFace: "english",
                        cardBack: "blue",
                        gameTimerEnabled: true
                    }))
                }
            },
        }),
        {
            name: 'prefs-store',
            partialize: (state) => ({
                themeColor: state.themeColor,
                cardFace: state.cardFace,
                cardBack: state.cardBack,
                useGameTimer: state.gameTimerEnabled
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error(`error on store hydration: ${error}`);
                    state?.actions?.resetPreferences?.();
                }
            },
            version: 1
        },
    ),
)

export default usePreferencesStore;
