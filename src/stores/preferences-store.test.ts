import { beforeEach, describe, expect, it } from "vitest";
import usePreferencesStore from "./preferences-store";

describe("Preferences store", () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      themeColor: "green",
      cardFace: "english",
      cardBack: "blue",
      gameTimerEnabled: true,
      cardAnimationEnabled: true,
    });
  });

  it("initializes with default values", () => {
    // Arrange + Act
    const state = usePreferencesStore.getState();

    // Assert
    expect(state.themeColor).toBe("green");
    expect(state.cardFace).toBe("english");
    expect(state.cardBack).toBe("blue");
    expect(state.gameTimerEnabled).toBe(true);
    expect(state.cardAnimationEnabled).toBe(true);
  });

  it("resetPreferences resets all values to defaults", () => {
    // Arrange
    usePreferencesStore.setState({
      themeColor: "cyan",
      cardFace: "french",
      cardBack: "red",
      gameTimerEnabled: false,
      cardAnimationEnabled: false,
    });

    // Act
    usePreferencesStore.getState().actions.resetPreferences();

    // Assert
    const state = usePreferencesStore.getState();
    expect(state.themeColor).toBe("green");
    expect(state.cardFace).toBe("english");
    expect(state.cardBack).toBe("blue");
    expect(state.gameTimerEnabled).toBe(true);
    expect(state.cardAnimationEnabled).toBe(true);
  });

  it("allows updating individual theme color", () => {
    // Arrange + Act
    usePreferencesStore.setState({ themeColor: "cyan" });

    // Assert
    expect(usePreferencesStore.getState().themeColor).toBe("cyan");
  });

  it("allows updating card face preference", () => {
    // Arrange + Act
    usePreferencesStore.setState({ cardFace: "french" });

    // Assert
    expect(usePreferencesStore.getState().cardFace).toBe("french");
  });

  it("allows updating card back preference", () => {
    // Arrange + Act
    usePreferencesStore.setState({ cardBack: "red" });

    // Assert
    expect(usePreferencesStore.getState().cardBack).toBe("red");
  });

  it("allows toggling game timer enabled", () => {
    // Arrange
    expect(usePreferencesStore.getState().gameTimerEnabled).toBe(true);

    // Act
    usePreferencesStore.setState({ gameTimerEnabled: false });

    // Assert
    expect(usePreferencesStore.getState().gameTimerEnabled).toBe(false);

    // Act
    usePreferencesStore.setState({ gameTimerEnabled: true });

    // Assert
    expect(usePreferencesStore.getState().gameTimerEnabled).toBe(true);
  });

  it("resetPreferences can be called multiple times", () => {
    // Arrange
    usePreferencesStore.setState({
      themeColor: "cyan",
      cardFace: "french",
      cardBack: "red",
      gameTimerEnabled: false,
    });

    // Act
    usePreferencesStore.getState().actions.resetPreferences();
    expect(usePreferencesStore.getState().themeColor).toBe("green");

    // Modify again
    usePreferencesStore.setState({ themeColor: "blue" });
    expect(usePreferencesStore.getState().themeColor).toBe("blue");

    // Act: reset again
    usePreferencesStore.getState().actions.resetPreferences();

    // Assert
    expect(usePreferencesStore.getState().themeColor).toBe("green");
    expect(usePreferencesStore.getState().cardFace).toBe("english");
    expect(usePreferencesStore.getState().cardBack).toBe("blue");
    expect(usePreferencesStore.getState().gameTimerEnabled).toBe(true);
  });
});
