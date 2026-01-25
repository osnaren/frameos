import './index.css';

import { validateEnv } from '@lib/env';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// Validate environment variables
validateEnv();

// Prevent transitions on page load
document.documentElement.classList.add('no-transition');
window.addEventListener('load', () => {
  document.documentElement.classList.remove('no-transition');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
