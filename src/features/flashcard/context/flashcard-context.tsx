"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Card, Project, Tag } from "@/types/flashcard";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PROJECTS,
  DEFAULT_TAGS,
  generateId,
  getRandomColor,
} from "@/features/flashcard/constants/defaults";
import { loadFlashcardData, saveFlashcardData } from "@/lib/db/repositories";
import { useToast } from "@/features/flashcard/hooks/use-toast";
import { useDialog } from "@/features/flashcard/hooks/use-dialog";
import type { Toast, ToastType } from "@/features/flashcard/hooks/use-toast";

type FlashcardContextValue = {
  categories: Category[];
  tags: Tag[];
  projects: Project[];
  activeProjectId: string | number | null;
  activeProject: Project | null;
  categoryMap: Record<string | number, Category>;
  tagMap: Record<string | number, Tag>;
  isLoaded: boolean;

  setActiveProjectId: (id: string | number | null) => void;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;

  addCategory: (name: string) => void;
  deleteCategory: (id: string | number) => void;
  saveCategoryEdit: (cat: { id: string | number; name: string; colorClass: string }) => void;
  getTagsByCategory: (categoryId: string | number) => Tag[];
  addTagToCategory: (categoryId: string | number, tagName: string) => void;
  deleteTag: (id: string | number) => void;
  saveTagEdit: (tag: { id: string | number; name: string; colorClass: string }) => void;

  addProject: (title: string, description: string, categoryId: string | number) => void;
  deleteProject: (id: string | number) => void;
  saveProjectEdit: (proj: { id: string | number; title: string; description: string; categoryId: string | number }) => void;
  saveCard: (projectId: string | number, card: Card, editIndex: number | null) => void;
  deleteCard: (projectId: string | number, cardIndex: number) => void;

  importAiData: (jsonStr: string) => void;
  resetAllData: () => void;
  forceSave: () => Promise<void>;

  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  dialog: ReturnType<typeof useDialog>["dialog"];
  showConfirm: ReturnType<typeof useDialog>["showConfirm"];
  showAlert: ReturnType<typeof useDialog>["showAlert"];
  confirmDialog: ReturnType<typeof useDialog>["confirmDialog"];
  cancelDialog: ReturnType<typeof useDialog>["cancelDialog"];
};

const FlashcardContext = createContext<FlashcardContextValue | null>(null);

export function FlashcardProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  );
  const [tags, setTags] = useState<Tag[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_TAGS)),
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_PROJECTS)),
  );
  const [activeProjectId, setActiveProjectId] = useState<string | number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { toasts, addToast } = useToast();
  const { dialog, showConfirm, showAlert, confirmDialog, cancelDialog } = useDialog();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const saveQueueRef = useRef(false);
  const dataRef = useRef({ categories, tags, projects });

  useEffect(() => {
    dataRef.current = { categories, tags, projects };
  }, [categories, tags, projects]);

  const doSave = useCallback(async () => {
    if (isSavingRef.current) {
      saveQueueRef.current = true;
      return;
    }
    isSavingRef.current = true;
    saveQueueRef.current = false;
    try {
      await saveFlashcardData(dataRef.current);
    } catch (error) {
      console.error("Failed to save data to IndexedDB", error);
    } finally {
      isSavingRef.current = false;
      if (saveQueueRef.current) {
        doSave();
      }
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      doSave();
    }, 1500);
  }, [doSave]);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await doSave();
  }, [doSave]);

  // Load data from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadFlashcardData();
        if (loaded) {
          // Ensure all cards have stats
          loaded.projects.forEach((p) => {
            p.cards.forEach((c) => {
              if (!c.stats) c.stats = { likes: 0, nopes: 0, status: "new" };
            });
          });
          setCategories(loaded.categories);
          setTags(loaded.tags);
          setProjects(loaded.projects);
        } else {
          // First time — save defaults
          await saveFlashcardData({
            categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
            tags: JSON.parse(JSON.stringify(DEFAULT_TAGS)),
            projects: JSON.parse(JSON.stringify(DEFAULT_PROJECTS)),
          });
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
        addToast("データの読み込みに失敗し、初期データをロードしました", "error");
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on beforeunload
  useEffect(() => {
    const handler = () => {
      forceSave();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [forceSave]);

  const categoryMap = useMemo(
    () => categories.reduce<Record<string | number, Category>>((acc, cat) => { acc[cat.id] = cat; return acc; }, {}),
    [categories],
  );

  const tagMap = useMemo(
    () => tags.reduce<Record<string | number, Tag>>((acc, tag) => { acc[tag.id] = tag; return acc; }, {}),
    [tags],
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  // --- Category & Tag CRUD ---
  const addCategory = useCallback((name: string) => {
    if (!name.trim()) return;
    setCategories((prev) => [
      ...prev,
      { id: `cat_${generateId()}`, name: name.trim(), colorClass: getRandomColor(), expanded: true, newTagName: "" },
    ]);
    scheduleSave();
  }, [scheduleSave]);

  const deleteCategory = useCallback((id: string | number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTags((prev) => prev.filter((t) => t.categoryId !== id));
    scheduleSave();
  }, [scheduleSave]);

  const saveCategoryEdit = useCallback((cat: { id: string | number; name: string; colorClass: string }) => {
    if (!cat.name.trim()) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, name: cat.name.trim(), colorClass: cat.colorClass } : c)),
    );
    scheduleSave();
  }, [scheduleSave]);

  const getTagsByCategory = useCallback(
    (categoryId: string | number) => tags.filter((t) => String(t.categoryId) === String(categoryId)),
    [tags],
  );

  const addTagToCategory = useCallback((categoryId: string | number, tagName: string) => {
    if (!tagName.trim()) return;
    setTags((prev) => [
      ...prev,
      { id: `tag_${generateId()}`, name: tagName.trim(), categoryId, colorClass: getRandomColor() },
    ]);
    scheduleSave();
  }, [scheduleSave]);

  const deleteTag = useCallback((id: string | number) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    scheduleSave();
  }, [scheduleSave]);

  const saveTagEdit = useCallback((tag: { id: string | number; name: string; colorClass: string }) => {
    if (!tag.name.trim()) return;
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, name: tag.name.trim(), colorClass: tag.colorClass } : t)),
    );
    scheduleSave();
  }, [scheduleSave]);

  // --- Project & Card CRUD ---
  const addProject = useCallback((title: string, description: string, categoryId: string | number) => {
    if (!title.trim() || !categoryId) return;
    setProjects((prev) => [
      { id: `proj_${generateId()}`, title, description, categoryId, cards: [] },
      ...prev,
    ]);
    scheduleSave();
  }, [scheduleSave]);

  const deleteProject = useCallback((id: string | number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    scheduleSave();
  }, [scheduleSave]);

  const saveProjectEdit = useCallback(
    (proj: { id: string | number; title: string; description: string; categoryId: string | number }) => {
      if (!proj.title.trim() || !proj.categoryId) return;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === proj.id
            ? { ...p, title: proj.title.trim(), description: proj.description, categoryId: proj.categoryId }
            : p,
        ),
      );
      scheduleSave();
    },
    [scheduleSave],
  );

  const saveCard = useCallback(
    (projectId: string | number, card: Card, editIndex: number | null) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const newCards = [...p.cards];
          if (editIndex !== null) {
            const oldStats = newCards[editIndex]?.stats ?? { likes: 0, nopes: 0, status: "new" as const };
            newCards[editIndex] = { ...card, stats: oldStats };
          } else {
            newCards.push({ ...card, stats: { likes: 0, nopes: 0, status: "new" } });
          }
          return { ...p, cards: newCards };
        }),
      );
      scheduleSave();
    },
    [scheduleSave],
  );

  const deleteCard = useCallback(
    (projectId: string | number, cardIndex: number) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const newCards = p.cards.filter((_, i) => i !== cardIndex);
          return { ...p, cards: newCards };
        }),
      );
      scheduleSave();
    },
    [scheduleSave],
  );

  // --- AI Import ---
  const importAiData = useCallback(
    (rawJson: string) => {
      try {
        let jsonStr = rawJson.trim();
        if (jsonStr.startsWith("```json")) jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        else if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");

        const data = JSON.parse(jsonStr) as {
          categories?: { id: string; name: string; colorClass?: string }[];
          tags?: { id: string; name: string; categoryId: string; colorClass?: string }[];
          projects?: { id?: string; title: string; description?: string; categoryId: string; cards?: Card[] }[];
        };

        if (!data.projects || !Array.isArray(data.projects)) throw new Error("projects配列が見つかりません");

        const catIdMap: Record<string, string> = {};
        const tagIdMap: Record<string, string> = {};

        if (data.categories && Array.isArray(data.categories)) {
          const newCats: Category[] = data.categories.map((cat) => {
            const newId = `cat_ai_${generateId()}`;
            catIdMap[cat.id] = newId;
            return { id: newId, name: cat.name || "AIカテゴリ", colorClass: cat.colorClass || getRandomColor(), expanded: false, newTagName: "" };
          });
          setCategories((prev) => [...prev, ...newCats]);
        }

        if (data.tags && Array.isArray(data.tags)) {
          const newTags: Tag[] = data.tags.map((tag) => {
            const newId = `tag_ai_${generateId()}`;
            tagIdMap[tag.id] = newId;
            return { id: newId, name: tag.name || "AIタグ", categoryId: catIdMap[tag.categoryId] || tag.categoryId, colorClass: tag.colorClass || getRandomColor() };
          });
          setTags((prev) => [...prev, ...newTags]);
        }

        const newProjects: Project[] = data.projects.map((proj) => {
          const newProjId = `proj_ai_${generateId()}`;
          const newCards: Card[] = (proj.cards || []).map((card) => {
            const newDetails = (card.backDetails || []).map((detail) => ({
              tagId: (detail.tagId && tagIdMap[String(detail.tagId)]) || detail.tagId || "",
              value: detail.value || "",
            }));
            return { front: card.front || "", backDetails: newDetails, example: card.example || "", stats: { likes: 0, nopes: 0, status: "new" as const } };
          });
          return {
            id: newProjId,
            title: proj.title || "AI生成プロジェクト",
            description: proj.description || "",
            categoryId: catIdMap[proj.categoryId] || proj.categoryId || "",
            cards: newCards,
          };
        });

        setProjects((prev) => [...newProjects, ...prev]);
        forceSave();
        showAlert("インポート完了", "AIデータのインポートが完了しました！");
      } catch (e) {
        showAlert("エラー", `JSONのパースに失敗しました。フォーマットを確認してください。\n\n${(e as Error).message}`);
      }
    },
    [forceSave, showAlert],
  );

  const resetAllData = useCallback(() => {
    setCategories(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)));
    setTags(JSON.parse(JSON.stringify(DEFAULT_TAGS)));
    setProjects(JSON.parse(JSON.stringify(DEFAULT_PROJECTS)));
    setActiveProjectId(null);
    forceSave();
    addToast("データを初期化しました", "success");
  }, [forceSave, addToast]);

  const value = useMemo<FlashcardContextValue>(
    () => ({
      categories, tags, projects, activeProjectId, activeProject, categoryMap, tagMap, isLoaded,
      setActiveProjectId, setCategories, setTags, setProjects,
      addCategory, deleteCategory, saveCategoryEdit,
      getTagsByCategory, addTagToCategory, deleteTag, saveTagEdit,
      addProject, deleteProject, saveProjectEdit, saveCard, deleteCard,
      importAiData, resetAllData, forceSave,
      toasts, addToast,
      dialog, showConfirm, showAlert, confirmDialog, cancelDialog,
    }),
    [
      categories, tags, projects, activeProjectId, activeProject, categoryMap, tagMap, isLoaded,
      addCategory, deleteCategory, saveCategoryEdit,
      getTagsByCategory, addTagToCategory, deleteTag, saveTagEdit,
      addProject, deleteProject, saveProjectEdit, saveCard, deleteCard,
      importAiData, resetAllData, forceSave,
      toasts, addToast,
      dialog, showConfirm, showAlert, confirmDialog, cancelDialog,
    ],
  );

  return <FlashcardContext.Provider value={value}>{children}</FlashcardContext.Provider>;
}

export function useFlashcard(): FlashcardContextValue {
  const ctx = useContext(FlashcardContext);
  if (!ctx) throw new Error("useFlashcard must be used within FlashcardProvider");
  return ctx;
}
