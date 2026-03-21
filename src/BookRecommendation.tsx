import { useState, useEffect } from 'react'
import { getBookRecommendation, type Book } from './hooks/gemini.js'
import './BookRecommendation.css'

interface BookRecommendationProps {
  emotions?: string[]
  onBack?: () => void
}

function BookRecommendation({ emotions = [], onBack }: BookRecommendationProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (emotions.length === 0) return
    setLoading(true)
    setError(null)
    getBookRecommendation(emotions)
      .then((result) => setBooks(result))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="book-page">
      <header className="book-header">
        <div className="book-header-inner">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← 돌아가기
            </button>
          )}
          <h1 className="book-heading">나를 위한 책 찾기</h1>
          {emotions.length > 0 && (
            <div className="emotion-row">
              <span className="emotion-label">지금 나의 감정</span>
              <div className="emotion-tags">
                {emotions.map((e) => (
                  <span key={e} className="emotion-tag">{e}</span>
                ))}
              </div>
            </div>
          )}
          <p className="book-subtitle">
            {emotions.length > 0
              ? 'Gemini가 감정에 꼭 맞는 책 3권을 골라드릴게요'
              : '감정 데이터가 없습니다. 먼저 감정을 기록해주세요.'}
          </p>
        </div>
      </header>

      <main className="book-main">
        {loading && (
          <div className="loading-state">
            <div className="book-spinner" />
            <p className="loading-text">Gemini가 당신을 위한 책을 고르는 중...</p>
            <p className="loading-sub">잠시만 기다려주세요</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>책 추천 중 오류가 발생했습니다.</p>
            <small>{error}</small>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <>
            <p className="result-label">감정을 바탕으로 추천된 책이에요</p>
            <div className="books-grid">
              {books.map((book, i) => (
                <div key={i} className="book-card">
                  <div className="book-cover">
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} />
                    ) : (
                      <div className="book-cover-placeholder">
                        <span>📖</span>
                      </div>
                    )}
                    <div className="book-rank">#{i + 1}</div>
                  </div>
                  <div className="book-info">
                    {book.url ? (
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="book-title"
                      >
                        {book.title}
                      </a>
                    ) : (
                      <h3 className="book-title">{book.title}</h3>
                    )}
                    <p className="book-author">{book.author}</p>
                    {(book.publisher || book.year || book.price) && (
                      <div className="book-meta">
                        {book.publisher && <span>{book.publisher}</span>}
                        {book.year && <span>{book.year}</span>}
                        {book.price && <span>{book.price.toLocaleString()}원</span>}
                      </div>
                    )}
                    <p className="book-description">{book.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && books.length === 0 && emotions.length === 0 && (
          <div className="empty-state">
            <span>📚</span>
            <p>감정 기록이 있어야 책을 추천해드릴 수 있어요</p>
            <small>Booked by Feelings에서 감정을 기록하고 돌아오세요</small>
          </div>
        )}
      </main>
    </div>
  )
}

export default BookRecommendation
