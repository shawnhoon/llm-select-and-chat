import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Get the root element
const container = document.getElementById('root');

// React 18 way
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 