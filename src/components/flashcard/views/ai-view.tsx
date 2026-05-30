"use client";

import { useCallback, useState } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";

export function AiView() {
  const { importAiData, addToast } = useFlashcard();

  const [aiTab, setAiTab] = useState<"prompt" | "import">("prompt");
  const [aiTheme, setAiTheme] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const generatePrompt = useCallback(() => {
    if (!aiTheme.trim()) return;

    const prompt = `以下のテーマに基づいて、フラッシュカードアプリ用の学習データを作成してください。

テーマ: ${aiTheme}

出力は以下のJSONフォーマットに厳密に従ってください。JSON以外のテキスト（解説や挨拶など）は一切含めず、そのままプログラムでパースできるようにしてください。

\`\`\`json
{
  "categories": [
    { "id": "cat_1", "name": "カテゴリ名", "colorClass": "bg-blue-500 text-white border-blue-400" }
  ],
  "tags": [
    { "id": "tag_1", "name": "名詞", "categoryId": "cat_1", "colorClass": "bg-blue-500 text-white border-blue-400" },
    { "id": "tag_2", "name": "動詞", "categoryId": "cat_1", "colorClass": "bg-red-500 text-white border-red-400" }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "プロジェクト名",
      "description": "プロジェクトの説明",
      "categoryId": "cat_1",
      "cards": [
        {
          "front": "カードの表面（問題や単語）",
          "backDetails": [
            { "tagId": "tag_1", "value": "1つ目の意味（例：光）" },
            { "tagId": "tag_2", "value": "2つ目の意味（例：火をつける）" }
          ],
          "example": "例文や補足（省略可）"
        }
      ]
    }
  ]
}
\`\`\`

【ルール】
1. idは一意の文字列にしてください。
2. tagIdは、tags配列で定義したidを指定してください。タグが不要な場合は空文字("")にしてください。
3. categoryIdは、categories配列で定義したidを指定してください。
4. 1つのカードに対して複数の意味や異なる品詞がある場合は、必ず \`backDetails\` 配列に複数のオブジェクトを追加して表現してください。
5. colorClassには以下のいずれかを指定してください:
- bg-red-500 text-white border-red-400
- bg-blue-500 text-white border-blue-400
- bg-green-500 text-white border-green-400
- bg-yellow-500 text-white border-yellow-400
- bg-purple-500 text-white border-purple-400
- bg-pink-500 text-white border-pink-400
- bg-cyan-500 text-white border-cyan-400
- bg-orange-500 text-white border-orange-400
- bg-teal-500 text-white border-teal-400
6. カード(cards)は最低でも5枚以上作成してください。`;

    setGeneratedPrompt(prompt);
  }, [aiTheme]);

  const copyPrompt = useCallback(async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      addToast("コピーしました", "success");
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
  );
}
