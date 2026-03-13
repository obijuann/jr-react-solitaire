import "./index.css";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { preload } from "react-dom";
import ReactDOM from "react-dom/client";
import Solitaire from "./app/solitaire";
import usePreferencesStore from "./stores/preferences-store";
import { getTheme } from "./themes";

function AppWrapper() {
  const themeColor = usePreferencesStore(state => state.themeColor);
  const cardFace = usePreferencesStore(state => state.cardFace);
  const cardBack = usePreferencesStore(state => state.cardBack);

  preload(`/cards/fronts/650_${cardFace}.png`, { as: "image", type: "image/png", media: "(max-width: 889px)"});
  preload(`/cards/fronts/1300_${cardFace}.png`, { as: "image", type: "image/png", media: "(min-width: 890px)"});
  preload(`/cards/backs/${cardBack}.svg`, { as: "image", type: "image/svg+xml"});
  
  return (
    <ThemeProvider theme={getTheme(themeColor)}>
      <CssBaseline />
      <Solitaire />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
