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

Deploy lên Vercel: import repo, chọn **Root Directory = `web`**, khai báo các biến môi trường `NEXT_PUBLIC_FIREBASE_*` trong Vercel Project Settings. Bản chạy thật: https://oisp-notification.vercel.app

Domain phải được thêm vào **Firebase Console → Authentication → Settings → Authorized domains**, nếu không đăng nhập sẽ báo lỗi `auth/unauthorized-domain`.

Nếu build báo lỗi `Couldn't find any pages or app directory`, Root Directory chưa được áp dụng đúng — vào Project Settings → General → Root Directory, xác nhận giá trị là `web`, lưu lại rồi trigger một deployment mới (push commit mới, không dùng nút "Redeploy" trên một deployment cũ vì nó có thể kế thừa cấu hình cũ tại thời điểm deployment đó được tạo).

## Chạy App di động

```bash
npm run dev:mobile
# quét QR bằng Expo Go, hoặc nhấn `a`/`i` để mở Android/iOS simulator
```

Copy `mobile/.env.example` thành `mobile/.env` và điền cùng bộ `NEXT_PUBLIC_FIREBASE_*` đã dùng cho web (đổi tiền tố thành `EXPO_PUBLIC_FIREBASE_*`) — app mobile dùng chung project Firebase với web admin.

Đăng nhập/Đăng ký: sinh viên/giảng viên tự đăng ký bằng email (`mobile/src/screens/LoginScreen.tsx`, email/password qua Firebase Auth). Tài khoản tự đăng ký luôn được gán `role: student` — Firestore rules (`firebase/firestore.rules`) chặn việc client tự đặt vai trò `admin`/`editor` khi tạo hồ sơ; muốn nâng vai trò phải qua trang **Quản lý người dùng** trên web admin.

### Build iOS qua EAS (không cần máy Mac)

```bash
npm install -g eas-cli
cd mobile
eas login                 # đăng nhập tài khoản Expo (tạo miễn phí tại expo.dev nếu chưa có)
eas init                  # gắn project vào EAS, tự điền extra.eas.projectId vào app.json
```

Khai báo biến môi trường `EXPO_PUBLIC_FIREBASE_*` cho bản build cloud (không commit giá trị thật vào repo):

```bash
eas env:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --environment production --visibility plaintext
# lặp lại cho AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID
```

Sau đó build:

```bash
eas build --platform ios --profile preview   # bản .ipa cài thử qua TestFlight/Ad Hoc, cần Apple Developer account (99 USD/năm) khi eas hỏi credentials
eas build --platform ios --profile production
```

`eas.json` đã có sẵn 3 profile (`development`, `preview`, `production`). Lần đầu build iOS, EAS sẽ hỏi tạo/đăng nhập Apple Developer account để tự sinh certificate & provisioning profile — không cần Xcode hay máy Mac vì build chạy trên cloud của Expo.

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

- [x] Quản lý người dùng: danh sách, tìm kiếm, lọc theo vai trò/khoa, đổi vai trò (admin), **thêm người dùng mới** (Cloud Function `createUserAccount`, tránh việc `createUserWithEmailAndPassword` ở client đăng xuất mất phiên admin), sửa trực tiếp Khoa/Đơn vị, **Chương trình**, **Ngành học**, Khóa — `web/src/app/[locale]/admin/users`, `web/src/components/AddUserModal.tsx`.
- [x] Nhóm nhận thông báo theo vai trò/khoa/chương trình/ngành/khóa (target segmentation khi tạo thông báo) — `web/src/components/TargetFilterEditor.tsx`, lọc người nhận push trong `onNotificationPublished` (`firebase/functions/src/targetFilter.ts`). Không chọn gì = gửi cho tất cả (giữ hành vi mặc định cũ).
- [x] Quản lý danh mục thông báo (thêm/sửa/xóa, đổi tên VI/EN, icon, thứ tự) cho admin/editor, có nút nạp nhanh 15 danh mục mặc định — `web/src/app/[locale]/admin/categories`.
- [x] Đăng xuất trên web admin — `web/src/components/Sidebar.tsx`.
- [x] Đẩy thông báo qua Expo Push Service (chuyển tiếp qua FCM/APNs) — `firebase/functions`, `mobile/src/notifications.ts`.
- [x] Dịch nháp tự động qua Google Cloud Translation API + duyệt thủ công — `web/src/app/api/translate`, trang Đa ngôn ngữ.
- [x] Thống kê tỷ lệ đọc theo danh mục/thời gian, **chi tiết theo từng thông báo** (ai đã đọc/thời điểm đọc, ai trong nhóm nhận chưa đọc) — `web/src/app/[locale]/admin/reports`, `web/src/components/NotificationReadDetail.tsx`.
- [x] Chỉ tính "đã đọc" khi người dùng mở màn hình chi tiết thông báo liên tục ≥10 giây (tránh tính lượt đọc cho lượt bấm vào rồi thoát ngay) — `mobile/src/screens/NotificationDetailScreen.tsx`.
- [x] Màn hình đăng nhập/đăng ký cho sinh viên/giảng viên trên mobile (email/password, tự gán `role: student`) — `mobile/src/screens/LoginScreen.tsx`. Phiên đăng nhập được giữ qua AsyncStorage (Firebase Auth tự phát hiện React Native).
  - [ ] Đăng nhập Google trên mobile (`@react-native-google-signin/google-signin`) — hiện chỉ có email/password, web vẫn có nút Google riêng.
- [ ] Đối chiếu khung 15 danh mục thông báo với danh mục chính thức của ĐHBK.
- [ ] Xuất báo cáo (Excel/PDF) từ trang Thống kê — hiện chỉ xem trên web.
- [ ] Rà soát `npm audit` định kỳ ở cả 3 workspace (`web`, `mobile`, `firebase/functions`): nhánh Next.js 14.2.x là bản vá mới nhất trong dòng 14 nhưng advisory database vẫn gộp một số CVE chỉ có bản vá đầy đủ ở Next 16 (breaking change); vài advisory `expo`/`@expo/*` và `uuid` (qua `gaxios` trong `firebase-admin`) ở mức moderate hiện chưa có bản vá phát hành — thuộc tooling build-time/dependency ngoài tầm kiểm soát trực tiếp, cân nhắc trước khi go-live.
