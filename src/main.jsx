import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { StoreProvider } from './context/StoreContext.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
