import { CardAnimations } from '../animations/index.js';

export const projectMethods = {
  getTagsForCurrentProject() { return this.activeProject ? this.getTagsByCategory(this.activeProject.categoryId) : []; },
  openProject(id, reverse = false) {
    this.activeProjectId = id;
    this.activeProject = this.projects.find(p => p.id === id) || null;
    this.currentCards = this.activeProject ? this.activeProject.cards : [];
    this.calculateStats();
    this.isReverseMode = reverse;
    this.currentIndex = 0; this.isFlipped = false; this.isCompleted = false;
    this.currentSwipeX = 0; this.targetSwipeX = 0;
    this.sessionStats = { like: 0, nope: 0 }; this.donutPercentage = 0;

    this.$nextTick(() => {
      requestAnimationFrame(() => {
        this.currentView = 'study';
        this.$nextTick(() => {
          CardAnimations.resetCardState(this.$refs.cardElement);
          this.resetOverlay();
        });
      });
    });
  },
  goHome() {
    this.forceSave();
    this.currentView = 'home';
    setTimeout(() => {
      if (this.currentView === 'home') {
        this.activeProjectId = null; this.activeProject = null;
        this.currentCards = []; this.isCompleted = false;
      }
    }, 300);
  },
  addProject() {
    if (!this.newProjectTitle.trim() || !this.newProjectCategoryId) return;
    this.projects.unshift({ id: Date.now(), title: this.newProjectTitle, description: this.newProjectDesc, categoryId: this.newProjectCategoryId, cards: [] });
    this.newProjectTitle = ''; this.newProjectDesc = ''; this.newProjectCategoryId = '';
    this.showProjectModal = false; this.forceSave();
  },
  openEditProject(project) { this.editingProject = { ...project }; this.showEditProjectModal = true; },
  saveProjectEdit() {
    if (!this.editingProject.title.trim() || !this.editingProject.categoryId) return;
    const index = this.projects.findIndex(p => p.id === this.editingProject.id);
    if (index !== -1) {
      this.projects[index].title = this.editingProject.title.trim();
      this.projects[index].description = this.editingProject.description;
      this.projects[index].categoryId = this.editingProject.categoryId;
      this.forceSave();
    }
    this.showEditProjectModal = false;
  },
  deleteProject(id) {
    this.showConfirm('プロジェクトの削除', 'このプロジェクトと、中に含まれるすべてのカードを削除しますか？', () => {
      this.projects = this.projects.filter(p => p.id !== id);
      this.forceSave(); this.showEditProjectModal = false;
      this.addToast('プロジェクトを削除しました', 'success');
    });
  },
  shareProject(project) {
    try {
      const category = this.categoryMap[project.categoryId];
      const projectTags = [];
      const cleanCards = project.cards.map(card => {
        const cleanDetails = card.backDetails.map(detail => ({ tagId: detail.tagId, value: detail.value }));
        return { front: card.front, backDetails: cleanDetails, example: card.example };
      });
      const cleanProject = { title: project.title, description: project.description, categoryId: project.categoryId, cards: cleanCards };

      project.cards.forEach(card => {
        card.backDetails.forEach(detail => {
          if (detail.tagId) {
            const tag = this.tagMap[detail.tagId];
            if (tag && !projectTags.find(t => t.id === tag.id)) projectTags.push({ id: tag.id, name: tag.name, categoryId: tag.categoryId, colorClass: tag.colorClass });
          }
        });
      });

      const cleanCategory = category ? [{ id: category.id, name: category.name, colorClass: category.colorClass }] : [];
      const shareDataObj = { categories: cleanCategory, tags: projectTags, projects: [cleanProject] };
      const jsonText = JSON.stringify(shareDataObj);

      let cardText = '';
      project.cards.slice(0, 5).forEach(card => {
        const back = card.backDetails.map(d => d.value).join(', ');
        cardText += `・${card.front} : ${back}\n`;
      });
      if (project.cards.length > 5) cardText += `...他 ${project.cards.length - 5}枚\n`;

      const shareText = `フラッシュカード「${project.title}」\n${project.description || ''}\n\n${cardText}\n▼アプリにインポート用データ\n\`\`\`json\n${jsonText}\n\`\`\``;

      if (navigator.share) {
        navigator.share({ title: project.title, text: shareText }).then(() => this.addToast('共有しました', 'success')).catch(err => { if (err.name !== 'AbortError') this.addToast('共有に失敗しました', 'error'); });
      } else {
        this.fallbackCopyTextToClipboard(shareText);
        this.showAlert('共有', 'お使いのブラウザは共有機能に対応していないため、テキストをクリップボードにコピーしました。');
      }
    } catch (e) { this.addToast('共有データの作成に失敗しました', 'error'); }
  },
  openCardModal(index = null) {
    this.showCardModal = true; this.isBackDetailsExpanded = true; this.editingCardIndex = index;
    if (index !== null) {
      const card = this.activeProject.cards[index];
      this.newCardFront = card.front; this.newCardExample = card.example || '';
      this.newCardDetails = card.backDetails.map(d => ({ tagId: d.tagId || '', value: d.value, expanded: false }));
      if (this.newCardDetails.length > 0) this.newCardDetails[0].expanded = true;
    } else {
      this.newCardFront = ''; this.newCardDetails = [{ tagId: '', value: '', expanded: true }]; this.newCardExample = '';
    }
    this.$nextTick(() => { if (this.$refs.frontInput) this.$refs.frontInput.focus(); });
  },
  addDetail() {
    this.newCardDetails.forEach(d => d.expanded = false);
    this.newCardDetails.push({ tagId: '', value: '', expanded: true });
    this.$nextTick(() => {
      const inputs = document.querySelectorAll('.detail-value-input');
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  },
  removeDetail(index) {
    if (this.newCardDetails.length > 1) this.newCardDetails.splice(index, 1);
    else this.newCardDetails[0] = { tagId: '', value: '', expanded: true };
  },
  saveCard() {
    if (!this.newCardFront.trim()) return;
    const validDetails = this.newCardDetails.filter(d => d.value.trim() !== '');
    if (validDetails.length === 0) return;
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (project) {
      const newCardData = {
        front: this.newCardFront, backDetails: validDetails.map(d => ({ tagId: d.tagId, value: d.value.trim() })),
        example: this.newCardExample, stats: { likes: 0, nopes: 0, status: 'new' }
      };
      if (this.editingCardIndex !== null) {
        newCardData.stats = project.cards[this.editingCardIndex].stats || { likes: 0, nopes: 0, status: 'new' };
        project.cards[this.editingCardIndex] = newCardData;
      } else {
        project.cards.push(newCardData);
        if (this.isCompleted) { this.isCompleted = false; this.currentIndex = project.cards.length - 1; }
      }
    }
    this.calculateStats(); this.showCardModal = false; this.forceSave();
  },
  deleteCard(index) {
    this.showConfirm('カードの削除', 'このカードを削除しますか？', () => {
      const project = this.projects.find(p => p.id === this.activeProjectId);
      if (project) {
        project.cards.splice(index, 1);
        if (this.currentIndex >= project.cards.length) this.currentIndex = Math.max(0, project.cards.length - 1);
        if (project.cards.length === 0) this.isCompleted = false;
        this.calculateStats(); this.forceSave(); this.addToast('カードを削除しました', 'success');
      }
    });
  },
  openStats(id) {
    this.activeProjectId = id;
    this.activeProject = this.projects.find(p => p.id === id) || null;
    this.currentCards = this.activeProject ? this.activeProject.cards : [];
    this.calculateStats();
    this.$nextTick(() => { requestAnimationFrame(() => { this.currentView = 'stats'; }); });
  },
  shuffleCards() {
    if (!this.activeProject || this.activeProject.cards.length === 0 || this.isAnimating) return;
    this.isAnimating = true;
    const cardEl = this.$refs.cardElement;

    CardAnimations.shuffle(cardEl, () => {
      let array = this.activeProject.cards;
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      this.currentIndex = 0; this.isCompleted = false; this.sessionStats = { like: 0, nope: 0 };
      this.donutPercentage = 0; this.isFlipped = false; this.targetSwipeX = 0; this.currentSwipeX = 0;
      this.forceSave(); this.resetOverlay();

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          CardAnimations.shuffleEnter(cardEl, () => { this.isAnimating = false; });
        });
      });
    });
  }
};