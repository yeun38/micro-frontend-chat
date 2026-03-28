import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BookRecommendation from './BookRecommendation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookRecommendation userid={new URLSearchParams(window.location.search).get('userid')} />
  </StrictMode>,
)
