import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["old-site/**", "out/**", ".next/**", "node_modules/**"],
  },
  {
    // old-site（Alpine.js）の「可変ストアを直接書き換えて再描画」モデルを忠実移植している。
    // React Compiler 向けの以下の新ルールは本アーキテクチャと根本的に競合するため無効化する。
    // （ストアは useRef で 1 度だけ生成する不変参照であり、refs への代入は DOM 参照の保持に過ぎない）
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
