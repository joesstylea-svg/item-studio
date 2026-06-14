# ITEM STUDIO 改造プロジェクト

## プロジェクト概要
既存の index.html（ITEM STUDIO）に機能を追加する。
ハンドメイド材料（ビーズ等）と洋服を複数プラットフォームで販売している
個人事業主（株式会社OJAS）のための出品自動化ツール。

販売先：BASE（パーツ）/ minne（パーツ）/ メルカリ（洋服）

## 実装する機能（優先順）

### STEP1：写真補正 + 番号管理 + ZIPダウンロード（フロントのみ）
- 写真選択後に補正モーダル（明るさ・コントラスト・鮮やかさのスライダー）
- Canvas APIでリアルタイムプレビュー＆リサイズ（長辺1000px・JPEG85%）
- 品番は通番のみ（689, 690...）カテゴリprefixなし
- 設定画面で開始番号を指定できる（現在688まで使用中）
- 「📦 写真をまとめてDL」でJSZip → 品番フォルダ構造のZIP

### STEP2：AI自動入力（Vercel API Route + Claude API）
- 写真確定後に「✨ AIで自動入力」ボタン
- パーツモード：素材・サイズ・カラー・説明文を自動生成
- 洋服モード：カテゴリ・ブランド・状態・説明文を自動生成

### STEP3：BASE自動出品（Vercel API Route + BASE API）
- BASE API認証情報：
  - client_id: aeb6af613d18a2855aade12fa99c2dc4
  - client_secret: 88eb4c2bebfb042269808af428d0aed1
  - callback URL: https://joesstylea-svg.github.io/item-studio/callback
- アイテム詳細モーダルに「BASEに出品」ボタン
- 出品済みバッジをカードに表示

### STEP4：minne用ワンタップコピー（フロントのみ）
- アイテム詳細モーダルに「minne用コピー」ボタン
- 品番・素材・サイズ・説明文をminne形式でクリップボードにコピー

## 既存コードの重要ポイント
- index.html 単一ファイル、約2600行
- localStorage でデータ管理（STORAGE_KEY = "item-studio-state-v1"）
- 品番管理キー：SKU_COUNTER_KEY = "item-studio-sku-counter"
- 写真処理の起点：handleImages関数（2082行付近）
- デザイントークン：
  --orange: #F28C52
  --blue: #5B84D7
  --warm-white: #F5F2EC
  --text: #262626
  --soft: #8E8E8E
  --line: #E8E5DF
  --radius: 12px

## デザイン原則
- 既存のデザインシステムを完全踏襲、新しいスタイルを勝手に追加しない
- 追加ボタン：primary（オレンジ）/ blue / ghost
- スマホ対応必須（min-height: 48px以上、ボタンは52px以上）
- カメラ起動対応（accept="image/*" capture="environment"）

## Vercel環境変数（STEP2以降で使用）
- ANTHROPIC_API_KEY
- BASE_CLIENT_ID
- BASE_CLIENT_SECRET
- BASE_ACCESS_TOKEN

## 注意事項
- BASE client_secretはVercel環境変数のみ。index.htmlには絶対に書かない
- JSZip CDN: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
- STEP1はフロントのみで完結（Vercel不要）
- spec-writerが仕様書を出力したら必ず停止してオーナー確認を待つ
- html-builderはspec-writer承認後にのみ実装を開始する
