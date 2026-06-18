import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { HashRouter } from 'react-router-dom'
import { ThemeContextProvider } from './ThemeContext.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    </HashRouter>
  </StrictMode>,
)
