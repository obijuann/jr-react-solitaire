import './index.css';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Solitaire from './app/solitaire';
import usePreferencesStore from './stores/preferences-store';
import { getTheme } from './themes';

function AppWrapper() {
  const themeColor = usePreferencesStore(state => state.themeColor);
  
  return (
    <ThemeProvider theme={getTheme(themeColor)}>
      <CssBaseline />
      <Solitaire />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
