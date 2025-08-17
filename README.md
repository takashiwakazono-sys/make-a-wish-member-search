# make a wish 会員マッチング

- Vite + React + Tailwind
- トップ：会員スライダー（3秒ごと）
- 検索：キーワードで会員横断検索
- イベント：近日のイベント → クリックで詳細
- 画像：イベントは Hero(16:9) と Thumb(1:1) の2種を切り取り保存
- データ保存：ブラウザの LocalStorage（デモ用途）
- スマホ対応

## 開発
```bash
npm i
npm run dev
# http://localhost:5173
```

## ビルド & プレビュー
```bash
npm run build
npm run preview
```

## デプロイ
- Vercel / Cloudflare Pages / Netlify いずれも OK（Build: `npm run build`, Output: `dist`）
- GitHub Pages の場合は `vite.config.js` の `base` を `/<repo>/` に変更してください。
