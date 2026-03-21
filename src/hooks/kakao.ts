interface KakaoBook {
  title: string;
  authors: string[];
  publisher: string;
  datetime: string;
  thumbnail: string;
  url: string;
  price: number;
  sale_price: number;
}

interface KakaoSearchResponse {
  documents: KakaoBook[];
}

export async function searchBook(title: string, author: string): Promise<KakaoBook | null> {
  const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  const query = `${title} ${author}`.trim();
  const response = await fetch(
    `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=1`,
    {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as KakaoSearchResponse;
  return data.documents[0] ?? null;
}
