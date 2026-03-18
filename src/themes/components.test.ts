import { describe, expect, it } from "vitest";
import { ThemeColorProperties } from "../types/theme";
import { makeComponents } from "./components";

describe("makeComponents", () => {
	it("exposes CSS variables and global body styles from theme colors", () => {
		// Arrange
		const props: ThemeColorProperties = {
			primary: "#112233",
			dark: "#001122",
			light: "#445566",
			label: "test"
		};

		// Act
		const components = makeComponents(props) as unknown as {
			MuiCssBaseline: { styleOverrides: Record<string, Record<string, string>> };
		};

		// Assert
		const root = components.MuiCssBaseline.styleOverrides[":root"];
		expect(root["--color-primary"]).toBe(props.primary);
		expect(root["--color-primary-dark"]).toBe(props.dark);
		expect(root["--color-primary-light"]).toBe(props.light);

		const body = components.MuiCssBaseline.styleOverrides.body;
		expect(body.background).toContain(props.light);
		expect(body.color).toBe("var(--color-text)");
	});
});

