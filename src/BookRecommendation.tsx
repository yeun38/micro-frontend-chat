import { useState, useEffect } from 'react'
import { getBookRecommendation, type Book } from './hooks/gemini.js'
import './BookRecommendation.css'

interface BookRecommendationProps {
  userId?: string | null
  emotions?: string[]
  onBack?: () => void
}

type Status =
  | 'no-access'
  | 'loading-store'
  | 'no-emotions'
  | 'loading-books'
  | 'done'
  | 'error'

function BookRecommendation({ userId, emotions: initialEmotions = [], onBack }: BookRecommendationProps) {
  const hasEmotions = initialEmotions.length > 0
  const [status, setStatus] = useState<Status>(() => {
    if (!userId) return 'no-access'
    if (hasEmotions) return 'loading-books'
    return 'loading-store'
  })
  const [emotions, setEmotions] = useState<string[]>(initialEmotions)
  const [books, setBooks] = useState<Book[]>([])
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Initializer, setInitializer] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    if (!userId) {
      setStatus('no-access')
      return
    }
    // shell에서 emotions를 이미 전달받은 경우 store 로딩 불필요
    if (hasEmotions) return

    let mounted = true
    let unsubscribe: (() => void) | null = null

    ;(async () => {
      try {
        // 1. store import 및 유효성 검사
        const module = await import('mfeHost/sharedEmotionStore')
        if (!mounted) return

        const store = module.useSharedEmotionStore
        if (
          !store ||
          typeof store.getState !== 'function' ||
          typeof store.subscribe !== 'function'
        ) {
          throw new Error('sharedEmotionStore가 유효하지 않습니다.')
        }

        // 2. store 변경 시 감정 records 읽기
        const applyState = () => {
          if (!mounted) return
          const records = store.getState().getRecentWeekRecords?.() ?? []
          const unique = [...new Set(records.map((r) => r.emotion))]
          setEmotions(unique)
          setStatus(unique.length > 0 ? 'loading-books' : 'no-emotions')
        }

        // 3. 구독 먼저 등록 → Initializer가 store를 채울 때 applyState가 반응
        unsubscribe = store.subscribe(applyState)
        applyState()

        // 4. EmotionStoreInitializer 로드 → 마운트하면 Firebase auth 기반으로 주문 조회 후 store 갱신
        try {
          const initModule = await import('mfeHost/EmotionStoreInitializer')
          if (!mounted) return
          const InitComp = initModule?.default
          if (typeof InitComp === 'function') {
            setInitializer(() => InitComp)
          }
        } catch (e) {
          console.warn('[EmotionStoreInitializer] 로드 실패:', e)
        }
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    })()

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [userId])

  // 감정 데이터가 준비되면 책 추천 요청
  useEffect(() => {
    if (status !== 'loading-books' || emotions.length === 0) return

    getBookRecommendation(emotions)
      .then((result) => {
        setBooks(result)
        setStatus('done')
      })
      .catch((err: Error) => {
        setError(err.message)
        setStatus('error')
      })
  }, [status, emotions])

  return (
    <div className="book-page">
      {/* EmotionStoreInitializer: invisible 컴포넌트, Firebase auth로 주문 조회 후 store 갱신 — 항상 렌더 */}
      {Initializer && <Initializer />}

      {/* ── 접근 불가 ── */}
      {status === 'no-access' && (
        <main className="book-main">
          <div className="no-access-state">
            <div className="no-access-icon">!</div>
            <p className="no-access-title">오류가 발생하였습니다</p>
            <p className="no-access-desc">다시 시도해주세요</p>
            <a className="no-access-btn" href="https://dusunax-001.web.app/">
              뒤로가기
            </a>
          </div>
        </main>
      )}

      {/* ── 감정 없음 ── */}
      {status === 'no-emotions' && (
        <div className="empty-state">
          <span>😶</span>
          <p>이번 주 감정 기록이 없습니다.</p>
          <small>Booked by Feelings에서 감정을 기록하고 돌아오세요</small>
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← 돌아가기
            </button>
          )}
        </div>
      )}

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
          <p className="book-subtitle">Gemini가 감정에 꼭 맞는 책 3권을 골라드릴게요</p>
        </div>
      </header>

      <main className="book-main">
        {(status === 'loading-store' || status === 'loading-books') && (
          <div className="loading-state">
            <div className="book-spinner" />
            <p className="loading-text">
              {status === 'loading-store'
                ? '감정 데이터를 불러오는 중...'
                : 'Gemini가 당신을 위한 책을 고르는 중...'}
            </p>
            <p className="loading-sub">잠시만 기다려주세요</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>오류가 발생했습니다.</p>
            <small>{error}</small>
          </div>
        )}

        {status === 'done' && books.length > 0 && (
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
      </main>
    </div>
  )
}

export default BookRecommendation
