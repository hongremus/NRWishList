# NR Wish List

NR Wish List 係 Remus 同 Nicole 共用嘅願望清單，方便記低想一齊完成嘅事情、追蹤完成紀錄、互相評分留言，同埋管理共同日曆。

目前版本：**v1.2.1**

## 功能

- 新增、編輯、完成、重做及刪除願望
- 設定願望提出者、優先度、截止日、地區、Tag 同備註
- 按願望狀態、Tag 或地區篩選，並支援多種排序方式
- 保存每次完成紀錄，包括完成時間、完成者、評分及留言
- 完成願望後顯示待評分及留言提示，點擊後可直接查看已完成願望
- 顯示願望完成統計、完成率、提出者數量及最常完成願望 Top 5
- Random Date 支援「再戰!」加權重做及「嚟緊Try!」未做過等機率抽選，支援 Tag 篩選、抽獎動畫及重做確認
- Wish List 同 Random Date 嘅 Tag 會按使用數量排序，Random Date 預設揀最前 Tag
- 共用日曆，支援活動新增、編輯、刪除及即時同步
- 支援香港公眾假期、紀念日、約會活動、重覆活動及跨日活動
- 支援加入 Google 日曆，同時保留 NR Wish List 畫面
- 針對手機瀏覽器優化願望清單、日曆、表單及彈出視窗

## 技術架構

- React 18
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Supabase

## 開始使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

喺專案根目錄建立 `.env.local`：

```env
VITE_SUPABASE_URL=你的_Supabase_URL
VITE_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key
```

唔好將 `.env.local` 或任何私密 key 提交到 Git。

### 3. 設定資料庫

喺 Supabase SQL Editor 執行專案內嘅 [`supabase-schema.sql`](supabase-schema.sql)，建立所需資料表及資料庫設定。

### 4. 啟動開發伺服器

```bash
npm run dev
```

之後用瀏覽器開啟終端機顯示嘅本機網址，通常係 `http://localhost:5173`。

## 常用指令

```bash
# 啟動開發伺服器
npm run dev

# 建立 Production bundle
npm run build

# 預覽 Production bundle
npm run preview
```

## 使用方式

1. 輸入已設定嘅帳號名稱登入。
2. 喺「願望清單」新增想完成嘅願望。
3. 使用 Tag、地區、優先度或截止日整理及搜尋願望。
4. 完成願望後，喺願望詳情內留下評分及留言。
5. 喺「行事曆」新增共同活動、紀念日或約會安排。

## 專案結構

```text
src/
├── components/   可重用 UI 元件及各類彈出視窗
├── hooks/        React hooks
├── pages/        登入、首頁及日曆頁面
├── styles/       Tailwind CSS 樣式
├── App.tsx       應用程式入口及頁面切換
├── store.ts      共用狀態及資料同步
├── supabase.ts   Supabase client 設定
└── types.ts      TypeScript 型別定義
```

## 版本記錄

詳細功能更新請參閱 [`version.txt`](version.txt)。
