import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BookRecommendation from './BookRecommendation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookRecommendation emotions={['기쁨', '설렘']} />
  </StrictMode>,
)
