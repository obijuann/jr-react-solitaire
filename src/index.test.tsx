import "@testing-library/jest-dom/vitest";

import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const preloadSpy = vi.hoisted(() => vi.fn());

vi.mock("react-dom", () => ({
  preload: preloadSpy,
}));

vi.mock("./app/solitaire", () => ({
  default: () => <div data-testid="boot-marker" />,
}));

describe("index bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    preloadSpy.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("renders the app into #root", async () => {
    // Act
    await act(async () => {
      await import("./index");
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("boot-marker")).toBeInTheDocument();
    });
  });

  it("preloads face and back artwork using user preferences", async () => {
    // Arrange
    const storeModule = await import("./stores/preferences-store");
    storeModule.default.setState({
      themeColor: "green",
      cardFace: "french",
      cardBack: "astronaut",
      gameTimerEnabled: true,
      cardAnimationEnabled: true,
    });

    // Act
    await act(async () => {
      await import("./index");
    });

    // Assert
    await waitFor(() => {
      expect(preloadSpy).toHaveBeenCalledWith("/cards/fronts/650_french.png", {
        as: "image",
        type: "image/png",
        media: "(max-width: 889px)",
      });
      expect(preloadSpy).toHaveBeenCalledWith("/cards/fronts/1300_french.png", {
        as: "image",
        type: "image/png",
        media: "(min-width: 890px)",
      });
      expect(preloadSpy).toHaveBeenCalledWith("/cards/backs/astronaut.svg", {
        as: "image",
        type: "image/svg+xml",
      });
    });
  });
});
