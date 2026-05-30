import { TAG_COLORS } from '../constants.js';

export function initialState() {
  return {
    isLoaded: false,
    currentView: 'streak',
    tagColors: TAG_COLORS,
    categories: [],
    tags: [],
    projects: [],
    activeProjectId: null,

    categoryMap: {},
    tagMap: {},
    activeProject: null,
    currentCards: [],
    projectStats: { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 },

    currentIndex: 0,
    isFlipped: false,
    isCompleted: false,
    isAnimating: false,
    isReverseMode: false,

    isDragging: false,
    hasDragged: false,
    isSwipeMode: null,
    startX: 0, startY: 0,
    targetSwipeX: 0, currentSwipeX: 0, swipeY: 0,

    sessionStats: { like: 0, nope: 0 },
    donutPercentage: 0,

    streakData: { currentStreak: 0, lastStudyDate: null, studyHistory: [] },
    weekDays: [],
    displayStreak: 0,

    isSaving: false,
    saveQueue: false,
    saveTimeout: null,

    newCategoryName: '',
    showProjectModal: false, newProjectTitle: '', newProjectDesc: '', newProjectCategoryId: '',
    showCardModal: false, editingCardIndex: null, newCardFront: '', isBackDetailsExpanded: true,
    newCardDetails: [{ tagId: '', value: '', expanded: true }], newCardExample: '',
    showEditCategoryModal: false, editingCategory: { id: null, name: '', colorClass: '' },
    showEditTagModal: false, editingTag: { id: null, name: '', colorClass: '' },
    showEditProjectModal: false, editingProject: { id: null, title: '', description: '', categoryId: '' },

    aiTab: 'prompt', aiTheme: '', generatedPrompt: '', copySuccess: false, importJsonText: '',

    toasts: [],
    dialog: { show: false, type: 'alert', title: '', message: '', confirmText: 'OK', cancelText: 'キャンセル', onConfirm: null },
  };
}