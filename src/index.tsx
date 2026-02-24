import './index.css';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Solitaire from './app/solitaire';
import ThemeSwitcher from './components/theme-switcher';
import { defaultThemeKey, getTheme } from './themes';

function AppWrapper() {
  const [themeKey, setThemeKey] = React.useState<string>(defaultThemeKey);
  const theme = React.useMemo(() => getTheme(themeKey), [themeKey]);
  const isDev = Boolean(import.meta.env.DEV);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Solitaire />
      {isDev ? <ThemeSwitcher value={themeKey} onChange={setThemeKey} /> : null}
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
