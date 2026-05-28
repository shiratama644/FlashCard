"use client";

import { useCallback, useState } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { SubViewHeader } from "@/components/layout/sub-view-header";

export default function AIViewPage() {
  const { importAiData, categories, tags, addToast } = useFlashcard();

  const [aiTab, setAiTab] = useState<"prompt" | "import">("prompt");
  const [aiTheme, setAiTheme] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const generatePrompt = useCallback(() => {
    if (!aiTheme.trim()) return;

    const existingCategories = categories.map((c) => c.name).join(", ");
    const existingTags = tags.map((t) => t.name).join(", ");

    const prompt = `以下のテーマに基づいて、フラッシュカードアプリ用のデータをJSON形式で生成してください。

テーマ: ${aiTheme.trim()}

## 出力フォーマット
\`\`\`json
{
  "categories": [
    { "id": "cat_1", "name": "カテゴリ名", "colorClass": "bg-blue-500 text-white border-blue-400" }
  ],
  "tags": [
    { "id": "tag_1", "name": "タグ名", "categoryId": "cat_1", "colorClass": "bg-blue-500 text-white border-blue-400" }
  ],
  "projects": [
    {
      "title": "プロジェクトタイトル",
      "description": "説明",
      "categoryId": "cat_1",
      "cards": [
        {
          "front": "表面（単語・用語）",
          "backDetails": [
            { "tagId": "tag_1", "value": "意味・説明" }
          ],
          "example": "例文（任意）"
        }
      ]
    }
  ]
}
\`\`\`

## ルール
- カードは最低10枚以上作成してください
- backDetailsには複数のタグ付き意味を含めてください
- 既存のカテゴリ: ${existingCategories || "なし"}
- 既存のタグ: ${existingTags || "なし"}
- colorClassの選択肢: bg-red-500, bg-blue-500, bg-green-500, bg-yellow-500, bg-purple-500, bg-pink-500, bg-cyan-500, bg-orange-500, bg-teal-500
- colorClassの形式: "bg-{色}-500 text-white border-{色}-400"`;

    setGeneratedPrompt(prompt);
  }, [aiTheme, categories, tags]);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      addToast("コピーに失敗しました", "error");
    }
  }, [generatedPrompt, addToast]);

  const handleImport = useCallback(() => {
    if (!importJsonText.trim()) return;
    importAiData(importJsonText);
    setImportJsonText("");
  }, [importJsonText, importAiData]);

  return (
    <div className="view-container bg-blur" style={{ position: "relative" }}>
      <SubViewHeader
        title="AI アシスタント"
        backHref="/home"
        icon="fa-wand-magic-sparkles"
        iconStyle={{ color: "#c084fc" }}
      />

      <main className="view-main flex flex-col items-center">
        <div className="w-full" style={{ maxWidth: "42rem" }}>
          <div className="ai-tabs">
            <button
              onClick={() => setAiTab("prompt")}
              className={`ai-tab-btn ${aiTab === "prompt" ? "active" : "inactive"}`}
            >
              プロンプト生成
            </button>
            <button
              onClick={() => setAiTab("import")}
              className={`ai-tab-btn ${aiTab === "import" ? "active" : "inactive"}`}
            >
              JSONインポート
            </button>
          </div>

          {aiTab === "prompt" && (
            <div>
              <div className="ai-card">
                <h2 className="ai-step-title">1. 作ってほしい内容を入力</h2>
                <p className="ai-step-desc">
                  例: 「TOEIC頻出の英単語50選」「高校日本史の重要年号」など
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generatePrompt()}
                    placeholder="テーマを入力..."
                    className="input-field"
                  />
                  <button onClick={generatePrompt} className="btn-primary btn-primary-purple shrink-0">
                    生成
                  </button>
                </div>
              </div>

              {generatedPrompt && (
                <div className="ai-card">
                  <div className="flex justify-between items-start sm:items-center gap-3 mb-3 flex-col sm:flex-row">
                    <h2 className="ai-step-title mb-0">2. AI (ChatGPT等) にペースト</h2>
                    <button
                      onClick={copyPrompt}
                      className={`ai-copy-btn ${copySuccess ? "success" : "normal"}`}
                    >
                      <i className={`fa-solid ${copySuccess ? "fa-check" : "fa-copy"}`} />
                      <span>{copySuccess ? "コピーしました！" : "コピー"}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    className="textarea-field"
                    style={{ height: "16rem", backgroundColor: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.8)" }}
                  />
                  <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                    コピーしたテキストをAIに送信し、返ってきたJSONコードを「JSONインポート」タブに貼り付けてください。
                  </p>
                </div>
              )}
            </div>
          )}

          {aiTab === "import" && (
            <div>
              <div className="ai-card">
                <h2 className="ai-step-title">AIが生成したJSONを貼り付け</h2>
                <p className="ai-step-desc">
                  AIから出力された <code>{"`"}```json ... ```{"`"}</code> の中身をここに貼り付けてください。
                </p>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"categories": [...], "tags": [...], "projects": [...]}'
                  className="textarea-field mb-4"
                  style={{ height: "16rem" }}
                />
                <button
                  onClick={handleImport}
                  className={`btn-primary w-full flex items-center justify-center gap-2 ${!importJsonText.trim() ? "disabled" : ""}`}
                >
                  <i className="fa-solid fa-download" /> アプリに取り込む
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
