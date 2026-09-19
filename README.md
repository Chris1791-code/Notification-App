# Notification App — VP. Đào tạo Quốc tế (OISP), ĐHBK – ĐHQG-HCM

Hệ thống thông báo gồm 3 phần:

- **`web/`** — Web quản trị (Next.js, deploy Vercel): tạo/quản lý thông báo, danh mục, người dùng, thống kê, bản dịch.
- **`mobile/`** — App di động Android & iOS (Expo/React Native, 1 codebase): nơi sinh viên/giảng viên nhận thông báo, đăng ký nhận push, ghi nhận lượt đọc.
- **`firebase/`** — Firestore security rules & indexes dùng chung cho cả web và mobile.
- **`firebase/functions/`** — Cloud Function `onNotificationPublished`: gửi push (qua Expo Push Service) khi một thông báo chuyển sang trạng thái "published".

Kiến trúc và các lựa chọn thiết kế (danh mục thông báo, menu quản trị, cấu trúc app di động, giải pháp đa ngôn ngữ) được thống nhất trong phiên làm việc thiết lập dự án; xem chi tiết trong lịch sử trao đổi hoặc issue liên quan.

## Yêu cầu

- Node.js ≥ 20
- Một Firebase project ở gói **Blaze** (Firestore + Authentication + Storage + Cloud Functions bật sẵn — gói Spark miễn phí không chạy được Cloud Functions)
- Tài khoản Vercel (deploy web) và Expo/EAS (build/publish app di động)
- API key Google Cloud Translation API (dùng cho tính năng dịch nháp)

## Cài đặt

```bash
npm install
```

Đây là npm workspaces monorepo (`web`, `mobile`), cài một lần ở gốc repo là đủ cho cả hai.

## Thiết lập Firebase

1. Tạo project trên [Firebase Console](https://console.firebase.google.com), bật **Authentication** (Email/Password + Google), **Firestore**, **Storage**.
2. Lấy Web SDK config (Project settings → General → Your apps) và điền vào:
   - `web/.env.local` (copy từ `web/.env.local.example`)
   - `mobile/.env` (copy từ `mobile/.env.example`)
3. Deploy Firestore rules & indexes (cần cài [Firebase CLI](https://firebase.google.com/docs/cli)):
   ```bash
   cd firebase
   firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
   ```
4. Tạo document đầu tiên trong collection `users/{uid}` với `role: "admin"` cho tài khoản quản trị đầu tiên (Firestore rules yêu cầu vai trò `admin`/`editor` để tạo/sửa thông báo).
5. Deploy Cloud Function gửi push (cần Firebase project ở gói Blaze — Cloud Functions không chạy trên gói Spark miễn phí):
   ```bash
   cd firebase/functions && npm install && cd ..
   firebase deploy --only functions --project <project-id>
   ```
6. Lấy API key cho [Google Cloud Translation API](https://cloud.google.com/translate/docs/setup) (bật API trong cùng Google Cloud project với Firebase) và điền vào `web/.env.local` → `GOOGLE_TRANSLATE_API_KEY`. Biến này chỉ dùng ở server (Next.js API route `/api/translate`), không lộ ra client.

## Chạy Web admin

```bash
npm run dev:web
# http://localhost:3000 → tự chuyển sang /vi/admin/dashboard hoặc /en/admin/dashboard
```

Deploy lên Vercel: import repo, chọn **Root Directory = `web`**, khai báo các biến môi trường `NEXT_PUBLIC_FIREBASE_*` trong Vercel Project Settings.

## Chạy App di động

```bash
npm run dev:mobile
# quét QR bằng Expo Go, hoặc nhấn `a`/`i` để mở Android/iOS simulator
```

Build production dùng [EAS Build](https://docs.expo.dev/build/introduction/) (`eas build --platform android|ios`). Chạy `eas init` một lần để gắn `extra.eas.projectId` (bắt buộc để lấy Expo push token — xem `mobile/src/notifications.ts`).

## Mô hình dữ liệu Firestore (tóm tắt)

| Collection | Mô tả |
|---|---|
| `users/{uid}` | Hồ sơ người dùng: `role` (`admin`\|`editor`\|`student`\|`staff`), `department`, `cohort`, `locale`, `expoPushTokens` (mảng token nhận push) |
| `categories/{id}` | Danh mục thông báo — seed mặc định trong `web/src/lib/categories.ts` / `mobile/src/data/categories.ts`, ghi đè bằng dữ liệu Firestore khi có |
| `notifications/{id}` | `titleVi/titleEn`, `bodyVi/bodyEn`, `categoryId`, `status`, `priority`, `attachments`, `publishAt`, `translationStatus` |
| `notificationReads/{uid}_{id}` | Lượt đọc, dùng tính tỷ lệ đọc trong báo cáo |
| `savedNotifications/{uid}_{id}` | Bookmark của người dùng |
| `auditLogs/{id}` | Nhật ký thao tác (append-only) |

Chi tiết type: `web/src/lib/types.ts`, `mobile/src/types.ts`.

Danh mục 15 nhóm hiện tại (`academic`, `exams`, `student-affairs`, `finance`, `admissions`, `graduate`, `international`, `student-union`, `dormitory`, `research`, `career`, `library`, `health`, `facilities`, `emergency`) là **khung gợi ý**, cần đối chiếu với danh mục thông báo chính thức của ĐHBK trước khi dùng cho môi trường thật.

## Đa ngôn ngữ

- UI tĩnh: `next-intl` (web, `web/src/messages/{vi,en}.json`) và `i18next`/`react-i18next` (mobile, `mobile/src/i18n/locales/{vi,en}.json`).
- Nội dung thông báo: lưu song song `titleVi/titleEn`, `bodyVi/bodyEn` trong Firestore.
- **Dịch nháp tự động**: nút "Tạo bản dịch nháp" trong form tạo thông báo (`web/src/components/NotificationForm.tsx`) và trên trang **Đa ngôn ngữ / Bản dịch** (`web/src/app/[locale]/admin/translations`) gọi `POST /api/translate` (Next.js API route, `web/src/app/api/translate/route.ts`) → Google Cloud Translation API. Kết quả luôn ở trạng thái `draft` — biên tập viên xem/sửa rồi bấm **Duyệt bản dịch** mới chuyển sang `reviewed`; không có đường nào tự động đăng thẳng bản dịch máy.

## Đẩy thông báo (Push notification)

- Mobile đăng ký nhận push bằng `expo-notifications` (`mobile/src/notifications.ts`): xin quyền, lấy Expo push token, lưu vào `users/{uid}.expoPushTokens`. Chạy tự động sau khi đăng nhập (`mobile/App.tsx`).
- Dùng **Expo Push Service** (không phải gọi thẳng Firebase Admin Messaging): Expo tự chuyển tiếp qua FCM (Android) / APNs (iOS), nên không cần cấu hình credentials FCM/APNs thủ công ở Cloud Function — EAS quản lý phần đó khi build app.
- Cloud Function `onNotificationPublished` (`firebase/functions/src/index.ts`) trigger khi một document trong `notifications` chuyển `status` sang `published` lần đầu, gom token từ toàn bộ `users` rồi gửi qua Expo Push API.
- Quy mô hiện tại (quét toàn bộ `users`) phù hợp cho một trường đại học; nếu cần mở rộng, nên tách token ra collection riêng có index theo `targetGroups` thay vì quét toàn bộ người dùng mỗi lần đăng bài.

## Thống kê & Báo cáo

- Trang **Thống kê & Báo cáo** (`web/src/app/[locale]/admin/reports`): tổng lượt đọc, số thông báo đã đăng, tỷ lệ đọc trung bình (lượt đọc / tổng người dùng, trung bình trên các thông báo đã đăng), danh mục nhiều lượt đọc nhất, biểu đồ lượt đọc theo danh mục và theo 14 ngày gần nhất.
- Nguồn dữ liệu: collection `notificationReads`, được ghi từ mobile mỗi khi người dùng mở chi tiết một thông báo (`mobile/src/screens/NotificationDetailScreen.tsx`).
- TODO khi dữ liệu lớn: hiện tại trang tải toàn bộ `notificationReads` về client (`web/src/hooks/useNotificationReads.ts`) — nên thay bằng số liệu tổng hợp sẵn (ví dụ Cloud Function ghi vào `notificationStats` mỗi khi có lượt đọc mới) khi số bản ghi tăng lên đáng kể.

## Việc còn cần làm trước khi triển khai thật (production)

- [x] Quản lý người dùng: danh sách, tìm kiếm, lọc theo vai trò/khoa, đổi vai trò (admin) — `web/src/app/[locale]/admin/users`.
  - [ ] Nhóm nhận thông báo theo khoa/khóa (target segmentation khi tạo thông báo) — chưa làm, hiện push gửi cho toàn bộ người dùng có token.
- [x] Đẩy thông báo qua Expo Push Service (chuyển tiếp qua FCM/APNs) — `firebase/functions`, `mobile/src/notifications.ts`.
- [x] Dịch nháp tự động qua Google Cloud Translation API + duyệt thủ công — `web/src/app/api/translate`, trang Đa ngôn ngữ.
- [x] Thống kê tỷ lệ đọc theo danh mục/thời gian — `web/src/app/[locale]/admin/reports`.
- [ ] Cấu hình lại `auth` trong `mobile/src/firebase.ts` dùng `initializeAuth` + AsyncStorage persistence (xem TODO trong file) để giữ phiên đăng nhập qua các lần mở app.
- [ ] Đối chiếu khung 15 danh mục thông báo với danh mục chính thức của ĐHBK.
- [ ] Xuất báo cáo (Excel/PDF) từ trang Thống kê — hiện chỉ xem trên web.
- [ ] Rà soát `npm audit` định kỳ ở cả 3 workspace (`web`, `mobile`, `firebase/functions`): nhánh Next.js 14.2.x là bản vá mới nhất trong dòng 14 nhưng advisory database vẫn gộp một số CVE chỉ có bản vá đầy đủ ở Next 16 (breaking change); vài advisory `expo`/`@expo/*` và `uuid` (qua `gaxios` trong `firebase-admin`) ở mức moderate hiện chưa có bản vá phát hành — thuộc tooling build-time/dependency ngoài tầm kiểm soát trực tiếp, cân nhắc trước khi go-live.
