# PomoTimer

ミニマルな半透明ポモドーロタイマー デスクトップアプリ。

![Tauri](https://img.shields.io/badge/Tauri-v2-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![License](https://img.shields.io/badge/License-MIT-green)

## 特徴

- **設定可能なタイマー** — 作業・休憩の時間を自由に設定
- **通知音** — デフォルトのベル音付き。任意のフォルダからカスタム音声ファイルを選択可能
- **ミニマルUI** — 半透明・常に最前面表示で作業の邪魔にならない
- **オフライン動作** — ネットワーク不要、完全ローカルで動作
- **システムトレイ** — 最小化時はトレイに格納

## スクリーンショット

> _Coming soon_

## 技術スタック

- [Tauri v2](https://v2.tauri.app/) — Rustベースのデスクトップフレームワーク
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — フロントエンド
- [Vite](https://vite.dev/) — ビルドツール

## 開発

### 前提条件

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)

### セットアップ

```bash
npm install
npm run tauri dev
```

### ビルド

```bash
npm run tauri build
```

インストーラーが `src-tauri/target/release/bundle/nsis/` に生成されます。

## ライセンス

MIT
