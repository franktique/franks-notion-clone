"use client";

import { Sidebar } from "@/components/sidebar";
import { MarkdownEditor } from "@/components/markdown-editor";

export default function Home() {

  return (
    <main className="flex h-screen">
      <Sidebar />
      <MarkdownEditor />
    </main>
  );
}
