import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { BCBRateProviderWrapper } from './contexts/BCBRateContext'
import { QueryProvider } from './providers/QueryProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <BCBRateProviderWrapper>
            <App />
          </BCBRateProviderWrapper>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
