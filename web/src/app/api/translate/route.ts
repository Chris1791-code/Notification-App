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

const MAX_INPUT_LENGTH = 4000;

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

/**
 * Xác thực ID token qua Identity Toolkit REST (không cần firebase-admin/service
 * account — chỉ cần Web API key đã có sẵn), rồi đọc hồ sơ users/{uid} qua
 * Firestore REST API bằng CHÍNH token đó, để Firestore Security Rules tự
 * quyết định request có được đọc hay không (rule cho phép self-read).
 * Trả về role nếu hợp lệ, null nếu token sai/không có hồ sơ.
 */
async function getCallerRole(idToken: string, webApiKey: string, projectId: string): Promise<string | null> {
  const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${webApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!lookupRes.ok) return null;
  const lookupJson = (await lookupRes.json()) as { users?: { localId?: string }[] };
  const uid = lookupJson.users?.[0]?.localId;
  if (!uid) return null;

  const docRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!docRes.ok) return null;
  const docJson = (await docRes.json()) as { fields?: { role?: { stringValue?: string } } };
  return docJson.fields?.role?.stringValue ?? null;
}

// Tạo bản dịch NHÁP tiếng Anh từ nội dung tiếng Việt — không tự động đăng,
// biên tập viên phải xem lại/sửa và bấm "Duyệt" trước khi thông báo xuất bản
// bản EN (xem web/src/app/[locale]/admin/translations).
//
// Chỉ admin/editor đã đăng nhập mới gọi được — route này gọi Google Cloud
// Translation API (tốn phí theo lượt gọi), nếu không xác thực thì bất kỳ ai
// biết URL cũng gọi được không giới hạn.
export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  const webApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !webApiKey || !projectId) {
    return NextResponse.json({ error: 'Server thiếu biến môi trường bắt buộc.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Cần đăng nhập để dùng chức năng này.' }, { status: 401 });
  }

  const role = await getCallerRole(idToken, webApiKey, projectId);
  if (role !== 'admin' && role !== 'editor') {
    return NextResponse.json({ error: 'Chỉ Quản trị viên/Biên tập viên mới được dùng chức năng dịch.' }, { status: 403 });
  }

  const body = (await request.json()) as TranslateRequestBody;
  const titleVi = body.titleVi?.trim();
  const bodyVi = body.bodyVi?.trim();
  if (!titleVi || !bodyVi) {
    return NextResponse.json({ error: 'Thiếu titleVi hoặc bodyVi.' }, { status: 400 });
  }
  if (titleVi.length > MAX_INPUT_LENGTH || bodyVi.length > MAX_INPUT_LENGTH) {
    return NextResponse.json({ error: `Nội dung vượt quá ${MAX_INPUT_LENGTH} ký tự.` }, { status: 400 });
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
