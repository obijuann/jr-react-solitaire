// Valid visual themes for the app.
export type ThemeColors = "green" | "yellow" | "cyan" | "blue" | "red" | "violet";

// Basic set of color properties describing a theme.
export type ThemeColorProperties = {
    primary: string;
    dark: string;
    light: string;
    label: string;
};