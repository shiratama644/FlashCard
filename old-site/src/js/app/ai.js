export const aiMethods = {
  generatePrompt() {
    if (!this.aiTheme.trim()) return;
    this.generatedPrompt = `以下のテーマに基づいて、フラッシュカードアプリ用の学習データを作成してください。

テーマ: ${this.aiTheme}

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
  },
  copyPrompt() {
    if (!this.generatedPrompt) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(this.generatedPrompt).then(() => {
        this.copySuccess = true; setTimeout(() => this.copySuccess = false, 2000);
        this.addToast('コピーしました', 'success');
      }).catch(err => {
        console.error(err);
        this.fallbackCopyTextToClipboard(this.generatedPrompt);
      });
    } else {
      this.fallbackCopyTextToClipboard(this.generatedPrompt);
    }
  },
  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try {
      if (document.execCommand('copy')) {
        this.copySuccess = true; setTimeout(() => this.copySuccess = false, 2000);
        this.addToast('コピーしました', 'success');
      } else {
        this.showAlert('エラー', 'コピーに失敗しました。手動でコピーしてください。');
      }
    } catch (err) {
      this.showAlert('エラー', 'コピーに失敗しました。手動でコピーしてください。');
    }
    document.body.removeChild(textArea);
  },
  importAiData() {
    if (!this.importJsonText.trim()) return;
    try {
      let jsonStr = this.importJsonText.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const data = JSON.parse(jsonStr);
      if (!data.projects || !Array.isArray(data.projects)) throw new Error("projects配列が見つかりません");

      const catIdMap = {}; const tagIdMap = {};

      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach(cat => {
          const newId = 'cat_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          catIdMap[cat.id] = newId;
          this.categories.push({ id: newId, name: cat.name || 'AIカテゴリ', colorClass: cat.colorClass || this.getRandomColor(), expanded: false, newTagName: '' });
        });
      }

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach(tag => {
          const newId = 'tag_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          tagIdMap[tag.id] = newId;
          this.tags.push({ id: newId, name: tag.name || 'AIタグ', categoryId: catIdMap[tag.categoryId] || tag.categoryId, colorClass: tag.colorClass || this.getRandomColor() });
        });
      }

      data.projects.forEach(proj => {
        const newProjId = 'proj_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newCards = (proj.cards || []).map(card => {
          const newDetails = (card.backDetails || []).map(detail => ({ tagId: tagIdMap[detail.tagId] || detail.tagId || '', value: detail.value || '', expanded: false }));
          return { front: card.front || '', backDetails: newDetails, example: card.example || '', stats: { likes: 0, nopes: 0, status: 'new' } };
        });
        this.projects.unshift({
          id: newProjId, title: proj.title || 'AI生成プロジェクト', description: proj.description || '',
          categoryId: catIdMap[proj.categoryId] || proj.categoryId || (this.categories[0] ? this.categories[0].id : ''),
          cards: newCards
        });
      });

      this.updateMaps(); this.forceSave();
      this.importJsonText = ''; this.generatedPrompt = ''; this.aiTheme = '';
      this.showAlert('インポート完了', 'AIデータのインポートが完了しました！');
      this.currentView = 'home';
    } catch (e) {
      this.showAlert('エラー', 'JSONのパースに失敗しました。フォーマットを確認してください。\n\n' + e.message);
    }
  }
};