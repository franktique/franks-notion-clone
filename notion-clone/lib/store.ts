import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Annotation {
  id: string;
  type: 'highlight' | 'underline';
  color: string;
  text: string;
  startOffset: number;
  endOffset: number;
  tags: string[];
  page?: number; // Optional page number for PDF annotations
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  annotations: Annotation[];
  isPdf?: boolean;
  pages?: string[]; // Array of page contents for PDF notes
  originalFileName?: string;
  currentPage?: number; // Current page being viewed (for PDFs)
}

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  addNote: () => void;
  addPdfNote: (pdfData: { title: string; content: string; pages: string[]; originalFileName: string }) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setCurrentPage: (noteId: string, pageNumber: number) => void;
  addAnnotation: (noteId: string, annotation: Omit<Annotation, 'id'>) => void;
  updateAnnotation: (noteId: string, annotationId: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (noteId: string, annotationId: string) => void;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set) => ({
      notes: [],
      activeNoteId: null,
      
      addNote: () => {
        const newNote: Note = {
          id: uuidv4(),
          title: 'Untitled Note',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          annotations: [],
          isPdf: false,
        };
        
        set((state) => ({
          notes: [...state.notes, newNote],
          activeNoteId: newNote.id,
        }));
      },
      
      addPdfNote: (pdfData) => {
        const newNote: Note = {
          id: uuidv4(),
          title: pdfData.title,
          content: pdfData.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          annotations: [],
          isPdf: true,
          pages: pdfData.pages,
          originalFileName: pdfData.originalFileName,
          currentPage: 1, // Start at the first page
        };
        
        set((state) => ({
          notes: [...state.notes, newNote],
          activeNoteId: newNote.id,
        }));
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === id 
              ? { ...note, ...updates, updatedAt: new Date() } 
              : note
          ),
        }));
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },
      
      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },
      
      addAnnotation: (noteId, annotation) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === noteId 
              ? { 
                  ...note, 
                  annotations: [...note.annotations, { ...annotation, id: uuidv4() }],
                  updatedAt: new Date(),
                } 
              : note
          ),
        }));
      },
      
      updateAnnotation: (noteId, annotationId, updates) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === noteId 
              ? { 
                  ...note, 
                  annotations: note.annotations.map((ann) => 
                    ann.id === annotationId ? { ...ann, ...updates } : ann
                  ),
                  updatedAt: new Date(),
                } 
              : note
          ),
        }));
      },
      
      deleteAnnotation: (noteId, annotationId) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === noteId 
              ? { 
                  ...note, 
                  annotations: note.annotations.filter((ann) => ann.id !== annotationId),
                  updatedAt: new Date(),
                } 
              : note
          ),
        }));
      },
      
      setCurrentPage: (noteId, pageNumber) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === noteId 
              ? { 
                  ...note, 
                  currentPage: pageNumber,
                } 
              : note
          ),
        }));
      },
    }),
    {
      name: 'notion-clone-storage',
    }
  )
);
