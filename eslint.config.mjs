import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss"; // 🔥 追加: Tailwind CSS用プラグイン

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. グローバル無視設定（ビルド成果物やキャッシュを除外）
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "out/**/*",
      "build/**/*",
      "public/**/*",
    ],
  },

  // 2. Next.js & TypeScript の公式推奨設定
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 3. Tailwind CSS の推奨設定
  ...tailwind.configs["flat/recommended"],

  // 4. プロジェクト固有のカスタムルール ＆ スタック最適化設定
  {
    rules: {
      // 本番環境に不要な console.log が残るのを防ぐ（warn や error は許容）
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // 未使用の変数をエラーにする（引数で `_` から始まるものは除外）
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      
      // Reactの不要な閉じタグを自動でセルフクロージングにする（例: <div></div> -> <div />）
      "react/self-closing-comp": "error",

      // Tailwindのクラス名順序を自動修正（pnpm lint --fix で綺麗に並び替わります）
      "tailwindcss/classnames-order": "warn",
      
      // 存在しないTailwindクラス名（タイポ）を警告
      "tailwindcss/no-custom-classname": "warn",
    },
    settings: {
      tailwindcss: {
        // clsx, tailwind-merge, cva の中身もTailwindの解析対象にする設定
        callees: ["clsx", "cva", "twMerge", "cn"],
      },
    },
  },
];

export default eslintConfig;
