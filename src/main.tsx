import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import {
  TimeTrackingContext,
  defaultTimeTrackingProvider,
} from './providers/TimeTrackingContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TimeTrackingContext.Provider value={defaultTimeTrackingProvider}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TimeTrackingContext.Provider>
  </StrictMode>,
)
