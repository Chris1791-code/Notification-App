# Notification App — VP. Đào tạo Quốc tế (OISP), ĐHBK – ĐHQG-HCM

Hệ thống thông báo gồm 3 phần:

- **`web/`** — Web quản trị (Next.js, deploy Vercel): tạo/quản lý thông báo, danh mục, người dùng, thống kê, bản dịch.
- **`mobile/`** — App di động Android & iOS (Expo/React Native, 1 codebase): nơi sinh viên/giảng viên nhận thông báo.
- **`firebase/`** — Firestore security rules & indexes dùng chung cho cả web và mobile.

Kiến trúc và các lựa chọn thiết kế (danh mục thông báo, menu quản trị, cấu trúc app di động, giải pháp đa ngôn ngữ) được thống nhất trong phiên làm việc thiết lập dự án; xem chi tiết trong lịch sử trao đổi hoặc issue liên quan.

## Yêu cầu

- Node.js ≥ 20
- Một Firebase project (Firestore + Authentication + Storage bật sẵn)
- Tài khoản Vercel (deploy web) và Expo (build/publish app di động)

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

Build production dùng [EAS Build](https://docs.expo.dev/build/introduction/) (`eas build --platform android|ios`).

## Mô hình dữ liệu Firestore (tóm tắt)

| Collection | Mô tả |
|---|---|
| `users/{uid}` | Hồ sơ người dùng: `role` (`admin`\|`editor`\|`student`\|`staff`), `department`, `cohort`, `locale` |
| `categories/{id}` | Danh mục thông báo — seed mặc định trong `web/src/lib/categories.ts` / `mobile/src/data/categories.ts`, ghi đè bằng dữ liệu Firestore khi có |
| `notifications/{id}` | `titleVi/titleEn`, `bodyVi/bodyEn`, `categoryId`, `status`, `priority`, `attachments`, `publishAt`, `translationStatus` |
| `notificationReads/{uid}_{id}` | Lượt đọc, dùng tính tỷ lệ đọc trong báo cáo |
| `savedNotifications/{uid}_{id}` | Bookmark của người dùng |
| `auditLogs/{id}` | Nhật ký thao tác (append-only) |

Chi tiết type: `web/src/lib/types.ts`, `mobile/src/types.ts`.

Danh mục 15 nhóm hiện tại (`academic`, `exams`, `student-affairs`, `finance`, `admissions`, `graduate`, `international`, `student-union`, `dormitory`, `research`, `career`, `library`, `health`, `facilities`, `emergency`) là **khung gợi ý**, cần đối chiếu với danh mục thông báo chính thức của ĐHBK trước khi dùng cho môi trường thật.

## Đa ngôn ngữ

- UI tĩnh: `next-intl` (web, `web/src/messages/{vi,en}.json`) và `i18next`/`react-i18next` (mobile, `mobile/src/i18n/locales/{vi,en}.json`).
- Nội dung thông báo: lưu song song `titleVi/titleEn`, `bodyVi/bodyEn` trong Firestore. Trang **Đa ngôn ngữ / Bản dịch** (`web/src/app/[locale]/admin/translations`) liệt kê thông báo chưa có bản dịch `reviewed`.
- TODO: nối trang tạo thông báo với Cloud Function gọi Google Cloud Translation API để tạo bản dịch nháp tự động, biên tập viên duyệt trước khi đăng — không tự động đăng bản dịch máy.

## Việc còn cần làm trước khi triển khai thật (production)

- [x] Quản lý người dùng: danh sách, tìm kiếm, lọc theo vai trò/khoa, đổi vai trò (admin) — `web/src/app/[locale]/admin/users`.
  - [ ] Nhóm nhận thông báo theo khoa/khóa (target segmentation khi tạo thông báo) — chưa làm.
- [ ] Đẩy thông báo qua Firebase Cloud Messaging (FCM) cho app di động.
- [ ] Cấu hình lại `auth` trong `mobile/src/firebase.ts` dùng `initializeAuth` + AsyncStorage persistence (xem TODO trong file) để giữ phiên đăng nhập qua các lần mở app.
- [ ] Thống kê tỷ lệ đọc/click theo danh mục, xuất báo cáo.
- [ ] Đối chiếu khung 15 danh mục thông báo với danh mục chính thức của ĐHBK.
- [ ] Rà soát `npm audit`: nhánh Next.js 14.2.x hiện là bản vá mới nhất trong dòng 14, nhưng advisory database vẫn gộp một số CVE chỉ có bản vá đầy đủ ở Next 16 (breaking change) — cân nhắc nâng cấp trước khi go-live. Một vài advisory `expo`/`@expo/*` mức moderate hiện chưa có bản vá phát hành (thuộc tooling build-time, không phải runtime app).
