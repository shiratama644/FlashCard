"use client";

import { useState } from "react";
import { AccordionItem } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CategoryManager() {
  const [newCategoryName, setNewCategoryName] = useState("");

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="新しいカテゴリ名" />
        <Button disabled={!newCategoryName.trim()}>追加</Button>
      </div>

      <AccordionItem title="英語" defaultOpen>
        <div className="space-y-2 text-sm text-white/80">
          <p>名詞</p>
          <p>動詞</p>
          <p>形容詞</p>
        </div>
      </AccordionItem>
    </section>
  );
}
