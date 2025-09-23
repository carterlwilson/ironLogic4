import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import { theme } from './theme/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider theme={theme}>
        <Notifications />
        <AuthProvider>
          <App />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>,
);