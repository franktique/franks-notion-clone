"use client";

import { useNoteStore } from "@/lib/store";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const { notes, activeNoteId, addNote, deleteNote, setActiveNote } = useNoteStore();

  return (
    <div className="w-64 h-screen border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">Notion Clone</h1>
        <ThemeToggle />
      </div>
      
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">NOTES</h2>
        <button
          onClick={addNote}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Add new note"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notes yet. Create one!
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {notes.map((note) => (
              <li key={note.id}>
                <div
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    activeNoteId === note.id
                      ? "bg-gray-200 dark:bg-gray-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setActiveNote(note.id)}
                >
                  <span className="truncate">{note.title || "Untitled Note"}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
