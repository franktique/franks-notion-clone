"use client";

import { Note, useNoteStore } from "@/lib/store";
import { FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";

interface NoteItemProps {
  note: Note;
  isActive: boolean;
}

export function NoteItem({ note, isActive }: NoteItemProps) {
  const { deleteNote, setActiveNote } = useNoteStore();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Function to handle note deletion
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Show our custom confirmation dialog
    setShowDeleteConfirmation(true);
  };
  
  // Function to confirm deletion
  const confirmDelete = () => {
    // Call the store's deleteNote function directly
    deleteNote(note.id);
    console.log(`Deleting note: ${note.id}`);
    setShowDeleteConfirmation(false);
  };
  
  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  return (
    <>
      <div
        className={`group flex items-center justify-between p-2 rounded-md cursor-pointer ${
          isActive
            ? "bg-gray-200 dark:bg-gray-700"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex-1 flex items-center">
          <span className="truncate mr-2">{note.title || "Untitled Note"}</span>
          {note.isPdf && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              PDF
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
          aria-label="Delete note"
          title="Delete note"
        >
          <FiTrash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
      
      {/* Custom confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Note"
        message={`Are you sure you want to delete "${note.title || 'Untitled Note'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDestructive={true}
      />
    </>
  );
}
