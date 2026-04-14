# PTIT Dating Admin

Trang quản trị cho PTIT Dating, xây bằng React + Vite.

## 1. Yêu cầu

- Node.js 18+ (khuyến nghị Node 20+)
- npm
- Backend PTIT Dating đang chạy ở `http://localhost:3000`

## 2. Cài đặt

```bash
cd ADMIN
npm install
```

## 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Nội dung mặc định:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

## 4. Chạy development

```bash
npm run dev
```

Mặc định app chạy tại:

- `http://localhost:5173`

## 5. Build production

```bash
npm run build
```
