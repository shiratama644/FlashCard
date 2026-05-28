"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS, DEFAULT_TAGS } from "@/features/flashcard/constants/defaults";
import type { Project } from "@/types/flashcard";
import { loadFlashcardData, saveFlashcardData } from "@/lib/db/repositories";

export function useFlashcardApp() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | number | null>(DEFAULT_PROJECTS[0]?.id ?? null);

  useEffect(() => {
    void (async () => {
      const loaded = await loadFlashcardData();
      if (!loaded) return;
      setCategories(loaded.categories);
      setTags(loaded.tags);
      setProjects(loaded.projects);
      setActiveProjectId(loaded.projects[0]?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    void saveFlashcardData({ categories, tags, projects });
  }, [categories, tags, projects]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  return {
    categories,
    tags,
    projects,
    activeProjectId,
    activeProject,
    setCategories,
    setTags,
    setProjects,
    setActiveProjectId,
  };
}
