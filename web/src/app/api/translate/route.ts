import { NextResponse } from 'next/server';

interface TranslateRequestBody {
  titleVi?: string;
  bodyVi?: string;
}

interface GoogleTranslateResponse {
  data?: {
    translations?: { translatedText: string }[];
  };
  error?: { message?: string };
}

async function translateText(text: string, apiKey: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: 'vi', target: 'en', format: 'text' })
  });

  const json = (await res.json()) as GoogleTranslateResponse;
  if (!res.ok || !json.data?.translations?.[0]) {
    throw new Error(json.error?.message ?? `Translation API request failed (${res.status})`);
  }
  return json.data.translations[0].translatedText;
}

// Tạo bản dịch NHÁP tiếng Anh từ nội dung tiếng Việt — không tự động đăng,
// biên tập viên phải xem lại/sửa và bấm "Duyệt" trước khi thông báo xuất bản
// bản EN (xem web/src/app/[locale]/admin/translations).
export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chưa cấu hình GOOGLE_TRANSLATE_API_KEY trên server.' },
      { status: 500 }
    );
  }

  const body = (await request.json()) as TranslateRequestBody;
  const titleVi = body.titleVi?.trim();
  const bodyVi = body.bodyVi?.trim();
  if (!titleVi || !bodyVi) {
    return NextResponse.json({ error: 'Thiếu titleVi hoặc bodyVi.' }, { status: 400 });
  }

  try {
    const [titleEn, bodyEn] = await Promise.all([
      translateText(titleVi, apiKey),
      translateText(bodyVi, apiKey)
    ]);
    return NextResponse.json({ titleEn, bodyEn });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation API request failed.' },
      { status: 502 }
    );
  }
}
