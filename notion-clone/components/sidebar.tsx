"use client";

import { useNoteStore } from "@/lib/store";
import { FiPlus, FiRefreshCw, FiUpload } from "react-icons/fi";
import { ThemeToggle } from "./theme-toggle";
import { resetAppState } from "@/lib/storage-utils";
import { useState } from "react";
import { NoteItem } from "./note-item";
import { ConfirmationDialog } from "./confirmation-dialog";
import { PdfUploader } from "./pdf-uploader";

export function Sidebar() {
  const { notes, activeNoteId, addNote, deleteNote, setActiveNote } = useNoteStore();
  const [showResetButton, setShowResetButton] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showPdfUploader, setShowPdfUploader] = useState(false);

  // Separate regular notes and PDF books
  const regularNotes = notes.filter(note => !note.isPdf);
  const books = notes.filter(note => note.isPdf);

  // Function to show reset confirmation dialog
  const handleResetApp = () => {
    setShowResetConfirmation(true);
  };
  
  // Function to confirm reset
  const confirmReset = () => {
    resetAppState();
    setShowResetConfirmation(false);
    setShowResetButton(false);
  };
  
  // Function to cancel reset
  const cancelReset = () => {
    setShowResetConfirmation(false);
  };

  return (
    <>
      <div className="w-64 h-screen border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Notion Clone</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowResetButton(!showResetButton)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Show reset options"
              title="Show reset options"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      
        {showResetButton && (
          <div className="p-2 bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-700">
            <button
              onClick={handleResetApp}
              className="w-full p-2 text-sm text-red-600 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
            >
              Reset All Data
            </button>
          </div>
        )}
        
        {/* Notes Section */}
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
        
        <div className="overflow-y-auto">
          {regularNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No notes yet. Create one!
            </div>
          ) : (
            <ul className="space-y-1 p-2">
              {regularNotes.map((note) => (
                <li key={note.id}>
                  <NoteItem note={note} isActive={activeNoteId === note.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Books Section */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">BOOKS</h2>
          <button
            onClick={() => setShowPdfUploader(!showPdfUploader)}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Upload PDF book"
            title="Upload PDF book"
          >
            <FiUpload className="h-4 w-4" />
          </button>
        </div>
        
        {showPdfUploader && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <PdfUploader />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {books.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No books yet. Upload a PDF!
            </div>
          ) : (
            <ul className="space-y-1 p-2">
              {books.map((book) => (
                <li key={book.id}>
                  <NoteItem note={book} isActive={activeNoteId === book.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Custom confirmation dialog for reset */}
      <ConfirmationDialog
        isOpen={showResetConfirmation}
        title="Reset All Data"
        message="Are you sure you want to reset all application data? This will delete all notes and cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={confirmReset}
        onCancel={cancelReset}
        isDestructive={true}
      />
    </>
  );
}
