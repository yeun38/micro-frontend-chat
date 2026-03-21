import { useState, useRef, useEffect } from "react";
import { Message } from "./types/index.js";
import "./Chatbot.css";
import {
  getBookRecommendation,
  sendChatMessage,
  type Book,
  type ChatMessage,
} from "./hooks/gemini.js";

interface ChatbotProps {
  emotions?: string[];
}

function Chatbot({ emotions = [] }: ChatbotProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    if (emotions.length === 0) return;
    setLoading(true);
    try {
      const data = await getBookRecommendation(emotions);
      setBooks(data);
    } catch (error) {
      console.error("추천 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "안녕하세요! 무엇을 도와드릴까요? 🤖",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue("");

    const userMessage: Message = {
      id: Date.now().toString(),
      content: userText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(chatHistoryRef.current, userText);

      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        { role: "user", content: userText },
        { role: "model", content: reply },
      ];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: reply,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Gemini 응답 오류:", error);
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot">
      <header className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">💬</span>
          <span>AI 챗봇</span>
        </div>
      </header>

      <div>
        <h2>오늘 당신의 마음은 어떤가요?</h2>
        {emotions.length > 0 && <p>{emotions.join(", ")}</p>}
        <button
          onClick={handleRecommend}
          disabled={emotions.length === 0 || loading}
        >
          {emotions.length > 0
            ? "이 감정들로 책 추천받기"
            : "감정 데이터가 없습니다"}
        </button>

        {loading && <p>Gemini가 책을 고르는 중...</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {books.map((book, i) => (
            <li
              key={i}
              style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
            >
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  style={{
                    width: "60px",
                    height: "85px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "60px",
                    height: "85px",
                    background: "#eee",
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                {book.url ? (
                  <a href={book.url} target="_blank" rel="noopener noreferrer">
                    <strong>{book.title}</strong>
                  </a>
                ) : (
                  <strong>{book.title}</strong>
                )}
                <div style={{ fontSize: "0.85em", color: "#555" }}>
                  {book.author}
                  {book.publisher && ` · ${book.publisher}`}
                  {book.year && ` · ${book.year}`}
                  {book.price && ` · ${book.price.toLocaleString()}원`}
                </div>
                <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                  {book.description}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          className="input-field"
          disabled={isTyping}
        />
        <button
          onClick={handleSendMessage}
          className="send-btn"
          disabled={!inputValue.trim() || isTyping}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
