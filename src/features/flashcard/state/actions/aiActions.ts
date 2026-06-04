import type { FlashcardStore } from "../FlashcardStore";
import type { BackDetail, Card, Category, Project, Tag } from "../../data/types";

interface AnyDetailCard {
  front?: string;
  example?: string;
  backDetails?: { tagId?: string; value?: string }[];
}

export interface AiActions {
  generatePrompt(): void;
  copyPrompt(): void;
  fallbackCopyTextToClipboard(text: string): void;
  importAiData(): void;
}

export const createAiActions = (store: FlashcardStore): AiActions => ({
  generatePrompt(): void {
    if (!store.aiTheme.trim()) return;
    store.generatedPrompt = `以下のテーマに基づいて、フラッシュカードアプリ用の学習データを作成してください。

テーマ: ${store.aiTheme}

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
    store.commit();
  },
  copyPrompt(): void {
    if (!store.generatedPrompt) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(store.generatedPrompt)
        .then(() => {
          store.copySuccess = true;
          store.commit();
          setTimeout(() => {
            store.copySuccess = false;
            store.commit();
          }, 2000);
          store.addToast("コピーしました", "success");
        })
        .catch((err) => {
          console.error(err);
          store.fallbackCopyTextToClipboard(store.generatedPrompt);
        });
    } else {
      store.fallbackCopyTextToClipboard(store.generatedPrompt);
    }
  },
  fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand("copy")) {
        store.copySuccess = true;
        store.commit();
        setTimeout(() => {
          store.copySuccess = false;
          store.commit();
        }, 2000);
        store.addToast("コピーしました", "success");
      } else {
        store.showAlert("エラー", "コピーに失敗しました。手動でコピーしてください。");
      }
    } catch {
      store.showAlert("エラー", "コピーに失敗しました。手動でコピーしてください。");
    }
    document.body.removeChild(textArea);
  },
  importAiData(): void {
    if (!store.importJsonText.trim()) return;
    try {
      let jsonStr = store.importJsonText.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");

      const data = JSON.parse(jsonStr);
      if (!data.projects || !Array.isArray(data.projects)) throw new Error("projects配列が見つかりません");

      const catIdMap: Record<string, string> = {};
      const tagIdMap: Record<string, string> = {};

      if (data.categories && Array.isArray(data.categories)) {
        const newCategories: Category[] = data.categories.map((cat: { id: string; name?: string; colorClass?: string }) => {
          const newId = "cat_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          catIdMap[cat.id] = newId;
          return { id: newId, name: cat.name || "AIカテゴリ", colorClass: cat.colorClass || store.getRandomColor(), expanded: false, newTagName: "" };
        });
        store.categories = [...store.categories, ...newCategories];
      }

      if (data.tags && Array.isArray(data.tags)) {
        const newTags: Tag[] = data.tags.map((tag: { id: string; name?: string; categoryId?: string; colorClass?: string }) => {
          const newId = "tag_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          tagIdMap[tag.id] = newId;
          return { id: newId, name: tag.name || "AIタグ", categoryId: (tag.categoryId && catIdMap[tag.categoryId]) || tag.categoryId || "", colorClass: tag.colorClass || store.getRandomColor() };
        });
        store.tags = [...store.tags, ...newTags];
      }

      const importedProjects: Project[] = data.projects.map((proj: { id?: string; title?: string; description?: string; categoryId?: string; cards?: AnyDetailCard[] }) => {
        const newProjId = "proj_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        const newCards: Card[] = (proj.cards || []).map((card) => {
          const newDetails: BackDetail[] = (card.backDetails || []).map((detail) => ({ tagId: (detail.tagId && tagIdMap[detail.tagId]) || detail.tagId || "", value: detail.value || "", expanded: false }));
          return { front: card.front || "", backDetails: newDetails, example: card.example || "", stats: { likes: 0, nopes: 0, status: "new" } };
        });
        return {
          id: newProjId,
          title: proj.title || "AI生成プロジェクト",
          description: proj.description || "",
          categoryId: (proj.categoryId && catIdMap[proj.categoryId]) || proj.categoryId || "",
          cards: newCards,
        };
      });
      // 元コードは順に unshift していたため、最終的な先頭順は反転される。その順序を再現する。
      store.projects = [...importedProjects.reverse(), ...store.projects];

      store.updateMaps();
      store.calculateStats();
      store.forceSave();
      store.importJsonText = "";
      store.currentView = "home";
      store.commit();
      store.addToast("データを取り込みました", "success");
    } catch (e) {
      store.showAlert("インポートエラー", "JSONの解析に失敗しました。\n" + (e instanceof Error ? e.message : String(e)));
    }
  },
});
