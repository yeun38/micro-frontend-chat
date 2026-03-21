import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchBook } from "./kakao.js";

export interface Book {
  title: string;
  author: string;
  description: string;
  thumbnail?: string;
  url?: string;
  publisher?: string;
  year?: string;
  price?: number;
}

export async function getBookRecommendation(
  emotions: string[],
): Promise<Book[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const emotionList = emotions.join(", ");
  const prompt = `현재 감정 상태: ${emotionList}
이 감정들을 복합적으로 느끼는 사람에게 가장 어울리는 책 3권을 추천해주세요.
각 감정이 책 선택에 어떻게 반영되었는지 description에 구체적으로 설명해주세요.
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트나 마크다운 없이 JSON만 출력하세요:
[
  {"title": "책 제목", "author": "저자", "description": "이 감정들에 어울리는 이유 한 줄"}
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonText = text.replace(/```json\n?|\n?```/g, "").trim();
  const geminiBooks = JSON.parse(jsonText) as Book[];

  const enriched = await Promise.all(
    geminiBooks.map(async (book) => {
      const kakaoBook = await searchBook(book.title, book.author);
      if (!kakaoBook) return book;

      return {
        ...book,
        thumbnail: kakaoBook.thumbnail || undefined,
        url: kakaoBook.url || undefined,
        publisher: kakaoBook.publisher || undefined,
        year: kakaoBook.datetime ? kakaoBook.datetime.slice(0, 4) : undefined,
        price:
          kakaoBook.sale_price > 0
            ? kakaoBook.sale_price
            : kakaoBook.price || undefined,
      };
    }),
  );

  return enriched;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function sendChatMessage(
  history: ChatMessage[],
  newMessage: string,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}
