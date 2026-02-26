# PomoTimerDesk 開発知見まとめ

このドキュメントは PomoTimerDesk（Tauri + React + TypeScript 製デスクトップアプリ）の開発で得た知見を記録したものです。  
TypeScript / React の実践的な使い方を中心に、Tauri 固有の知識も含めて解説します。

---

## 目次

1. [プロジェクト構成](#1-プロジェクト構成)
2. [TypeScript 基礎と実践](#2-typescript-基礎と実践)
3. [React Hooks 詳解](#3-react-hooks-詳解)
4. [useEffect の依存配列と落とし穴](#4-useeffect-の依存配列と落とし穴)
5. [Tauri IPC — フロントエンドと Rust の連携](#5-tauri-ipc--フロントエンドと-rust-の連携)
6. [CSS 変数を React から動的に制御する](#6-css-変数を-react-から動的に制御する)
7. [グローバルマウス追従の実装パターン](#7-グローバルマウス追従の実装パターン)
8. [SVG アニメーションとプログレスリング](#8-svg-アニメーションとプログレスリング)

---

## 1. プロジェクト構成

```
src/                    # フロントエンド (React + TypeScript)
  components/           # UI コンポーネント
  hooks/                # カスタム Hooks
  styles/               # グローバル CSS
  utils/                # 定数・ユーティリティ
src-tauri/              # バックエンド (Rust)
  src/lib.rs            # Tauri コマンド定義
  capabilities/         # 権限設定
  tauri.conf.json       # ウィンドウ・ビルド設定
```


**技術スタック:**

| レイヤー | 技術 |
|---|---|
| UI フレームワーク | React 19 |
| 言語 | TypeScript 5 |
| バンドラー | Vite |
| デスクトップランタイム | Tauri v2 |
| バックエンド | Rust |

---

## 2. TypeScript 基礎と実践

### 2-1. インターフェースで Props を型定義する

コンポーネントが受け取る props を `interface` で定義することで、渡し忘れや型ミスをコンパイル時に検出できます。

```typescript
// 定義
interface TimerProps {
  timeLeft: number;
  mode: TimerMode;        // 自作の Union 型
  progress: number;
  isRunning: boolean;
}

// 使用
export function Timer({ timeLeft, mode, progress, isRunning }: TimerProps) {
  // ...
}
```

### 2-2. Union 型でモードを表現する

`string` より意図が明確で、型チェックも効きます。

```typescript
// Union 型
export type TimerMode = "work" | "break";

// 条件分岐でも型が絞り込まれる
const modeLabel = mode === "work" ? "作業中" : "休憩中";
```

### 2-3. Partial\<T\> で設定の部分更新を型安全に行う

```typescript
export interface AppSettings {
  workMinutes: number;
  breakMinutes: number;
  volume: number;
  bgOpacity: number;
  // ...
}

// Partial<AppSettings> = すべてのプロパティが省略可能になった型
const updateSettings = (patch: Partial<AppSettings>) => {
  setSettings(prev => ({ ...prev, ...patch }));
};

// 呼び出し側 — 変更したいプロパティだけ渡せばよい
updateSettings({ volume: 80 });
updateSettings({ bgOpacity: 60, workMinutes: 30 });
```

### 2-4. ジェネリクスで `invoke` の戻り値を型付けする

```typescript
// Tauri invoke はジェネリクスで戻り値の型を指定できる
const [x, y] = await invoke<[number, number]>("get_cursor_pos");
//                          ^^^^^^^^^^^^^^^^ 戻り値の型
```

### 2-5. as React.CSSProperties で CSS 変数を型安全に渡す

カスタム CSS 変数（`--foo`）は標準の `React.CSSProperties` に含まれないため、型アサーションが必要です。

```typescript
<div
  style={{ "--bg-opacity": settings.bgOpacity / 100 } as React.CSSProperties}
>
```

---

## 3. React Hooks 詳解

### 3-1. useState — 状態管理の基本

```typescript
// 初期値を関数で遅延評価（高コストな計算に有効）
const [timeLeft, setTimeLeft] = useState(() => totalSeconds("work"));

// null を許容する型
const [dotAngle, setDotAngle] = useState<number | null>(null);

// 前の値を参照して更新（より安全）
setTimeLeft(prev => prev - 1);
```

### 3-2. useRef — レンダーをまたいで値を保持する

`useRef` は値が変わっても**再レンダーを起こさない**点が `useState` と異なります。

```typescript
// DOM 要素への参照
const ringRef = useRef<HTMLDivElement>(null);
const rect = ringRef.current?.getBoundingClientRect();

// インターバル ID を保持（再レンダーしたくない）
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

// 直前の設定値をキャッシュ（変化検出に利用）
const prevSettingsRef = useRef({ workMinutes: 25, breakMinutes: 5 });
```

### 3-3. useCallback — 関数をメモ化する

`useCallback` は依存配列の値が変わらない限り同じ関数インスタンスを返します。  
`useEffect` の依存配列に関数を含める場合は必須です。

```typescript
const clearTimer = useCallback(() => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
}, []); // 依存なし → 常に同じ関数インスタンス

const reset = useCallback(() => {
  setIsRunning(false);
  clearTimer();               // clearTimer は安定しているので依存配列に入れても安全
  setTimeLeft(totalSeconds(mode));
}, [mode, totalSeconds, clearTimer]);
```

### 3-4. useEffect — 副作用の管理

```typescript
useEffect(() => {
  // 副作用の処理（イベントリスナー, タイマー, API コールなど）
  const interval = setInterval(() => { /* ... */ }, 16);

  // クリーンアップ関数（コンポーネントがアンマウントされるとき、
  // または依存配列の値が変わって再実行されるときに呼ばれる）
  return () => clearInterval(interval);
}, [依存値]); // 依存配列が変化したときだけ再実行
```

---

## 4. useEffect の依存配列と落とし穴

### バグの例：一時停止でタイマーがリセットされる

```typescript
// ❌ 問題のあるコード
useEffect(() => {
  if (!isRunning) {
    setTimeLeft(totalSeconds(mode)); // 一時停止する度にリセットされてしまう！
  }
}, [settings.workMinutes, settings.breakMinutes, mode, isRunning, totalSeconds]);
//                                                              ^^^^^^^^^^^
// isRunning が依存配列にあるため、pause() で isRunning=false になるたびに
// このエフェクトが再実行される
```

**なぜこうなるか:**  
`pause()` → `setIsRunning(false)` → `isRunning` が変化 → `useEffect` 再実行 → `setTimeLeft(totalSeconds(mode))` でリセット

### 修正：設定値が「実際に変わったとき」だけリセットする

```typescript
// ✅ 修正後
const prevSettingsRef = useRef({
  workMinutes: settings.workMinutes,
  breakMinutes: settings.breakMinutes
});

useEffect(() => {
  const settingsChanged =
    prevSettingsRef.current.workMinutes !== settings.workMinutes ||
    prevSettingsRef.current.breakMinutes !== settings.breakMinutes;

  // 設定が変わった、かつ停止中のときだけリセット
  if (settingsChanged && !isRunning) {
    setTimeLeft(totalSeconds(mode));
  }

  // 現在値を記録
  prevSettingsRef.current = {
    workMinutes: settings.workMinutes,
    breakMinutes: settings.breakMinutes
  };
}, [settings.workMinutes, settings.breakMinutes, mode, isRunning, totalSeconds]);
```

### 教訓

> **依存配列には「このエフェクトの処理に必要な値」だけを入れる。**  
> 「この値が変わったときだけ実行したい」という意図があるなら、`useRef` で前回値を保持して差分チェックを自前で行う。

---

## 5. Tauri IPC — フロントエンドと Rust の連携

### 5-1. Rust でコマンドを定義する

```rust
// src-tauri/src/lib.rs

#[tauri::command]
fn get_cursor_pos(window: tauri::WebviewWindow) -> Result<(f64, f64), String> {
    let pos = window.cursor_position().map_err(|e| e.to_string())?;
    Ok((pos.x, pos.y))
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_cursor_pos]) // ← 登録
        // ...
}
```

### 5-2. フロントエンドから呼び出す

```typescript
import { invoke } from "@tauri-apps/api/core";

// ジェネリクスで戻り値の型を指定
const [x, y] = await invoke<[number, number]>("get_cursor_pos");
```

### 5-3. capabilities で権限を制御する

Tauri v2 では明示的に権限を許可しないと API が使えません。

```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "core:window:allow-inner-position",
    "core:window:allow-scale-factor",
    "core:window:allow-cursor-position"
  ]
}
```

### 5-4. window.イベント でウィンドウ移動を検知する

```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";

const win = getCurrentWindow();

// ウィンドウが移動したときにキャッシュを更新
const unlisten = await win.onMoved((e) => {
  winCacheRef.current.x = e.payload.x;
  winCacheRef.current.y = e.payload.y;
});

// クリーンアップ
return () => unlisten();
```

### 5-5. 物理座標 → 論理座標の変換

OS が返すウィンドウ座標・カーソル座標は**物理ピクセル**（DPI 考慮済み）ですが、  
CSS / DOM の座標は**論理ピクセル**（デバイスピクセル比で割ったもの）です。

```typescript
const [cursorX, cursorY] = await invoke<[number, number]>("get_cursor_pos");

// 物理座標 → 論理座標
const logicalX = (cursorX - windowX) / scaleFactor;
const logicalY = (cursorY - windowY) / scaleFactor;
```

---

## 6. CSS 変数を React から動的に制御する

### 6-1. CSS 側で変数を使う

```css
.app-container {
  /* var(変数名, フォールバック値) */
  background: rgba(20, 20, 30, var(--bg-opacity, 0.88));
}
```

### 6-2. React から style 属性で注入する

```tsx
<div
  className="app-container"
  style={{ "--bg-opacity": settings.bgOpacity / 100 } as React.CSSProperties}
>
```

**メリット:**
- JavaScript の状態をそのまま CSS に反映できる
- 子要素すべてに継承される
- Tauri / Rust 側の変更が不要

---

## 7. グローバルマウス追従の実装パターン

### ❌ アプローチ 1: DOM の mousemove イベント（失敗）

```typescript
window.addEventListener("mousemove", handler);
```

**問題:** WebView 外（デスクトップ上）でマウスを動かしても DOM イベントは発火しない。

### ❌ アプローチ 2: Tauri JS API の cursorPosition（存在しない）

```typescript
const pos = await getCurrentWindow().cursorPosition(); // ← Tauri v2 に存在しない
```

### ✅ アプローチ 3: Rust コマンドでポーリング（採用）

```typescript
// Rust: window.cursor_position() = OS レベルのグローバル座標
// JS: setInterval で 16ms ごとに呼び出す (~60fps)

useEffect(() => {
  const interval = setInterval(async () => {
    const [cx, cy] = await invoke<[number, number]>("get_cursor_pos");
    // 座標変換してリング角度を計算
    setDotAngle(Math.atan2(cy - ringCy, cx - ringCx));
  }, 16);

  return () => clearInterval(interval);
}, []);
```

**`Math.atan2(y, x)` で角度計算:**

```
                  -π/2 (上)
                    │
    π (左) ─────────┼───────── 0 (右)
                    │
                  +π/2 (下)
```

```typescript
const dotX = centerX + radius * Math.cos(angle);
const dotY = centerY + radius * Math.sin(angle);
```

---

## 8. SVG アニメーションとプログレスリング

### 円形プログレスバーの仕組み

`stroke-dasharray` と `stroke-dashoffset` を組み合わせて実装します。

```typescript
const radius = 52;
const circumference = 2 * Math.PI * radius; // 円周長

// progress: 0〜100
const dashOffset = circumference - (progress / 100) * circumference;
// dashOffset = 0    → 全部表示（100%）
// dashOffset = 全周 → 全部非表示（0%）
```

```tsx
<circle
  r={radius}
  cx="65" cy="65"
  fill="none"
  stroke="red"
  strokeWidth="4"
  strokeDasharray={circumference}   // 破線の繰り返し長さ
  strokeDashoffset={dashOffset}     // 破線のオフセット
  transform="rotate(-90 65 65)"    // 12時方向から開始
/>
```

### スムーズなアニメーション

```css
.progress-ring {
  transition: stroke-dashoffset 0.5s ease;
}
```

---

## まとめ：今回の実装で役立った知見

| 課題 | 解決策 |
|---|---|
| 一時停止でタイマーリセット | `useRef` で前回値キャッシュ → 変化検出 |
| アプリ外のマウス追従 | Rust `cursor_position()` + setInterval ポーリング |
| 動的な背景透明度 | CSS 変数 + `style` 属性から注入 |
| 物理/論理座標の不一致 | `scaleFactor` で除算 |
| Tauri API 権限エラー | `capabilities/default.json` に明示的に追加 |
