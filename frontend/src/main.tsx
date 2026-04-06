/**
 * Application entry point.
 * Mounts the React app into the #root element.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found in DOM')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
