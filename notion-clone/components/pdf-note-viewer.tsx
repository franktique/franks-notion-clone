"use client";

import { useState, useEffect, useRef } from 'react';
import { useNoteStore, Annotation } from '@/lib/store';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AnnotationPopup } from './annotation-popup';

// Import marked only on client side
let marked: any = null;
if (typeof window !== 'undefined') {
  import('marked').then((m) => {
    marked = m.marked;
  });
}

export function PdfNoteViewer({ noteId }: { noteId: string }) {
  const { notes, updateNote, setCurrentPage, addAnnotation, updateAnnotation, deleteAnnotation } = useNoteStore();
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ top: 0, left: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const note = notes.find((note) => note.id === noteId);
  
  if (!note || !note.isPdf) {
    return <div className="p-4 text-gray-500">This note is not a PDF document.</div>;
  }

  const totalPages = note.pages?.length || 0;
  const currentPage = note.currentPage || 1;
  const currentPageContent = note.pages?.[currentPage - 1] || '';

  // Get annotations for the current page
  const pageAnnotations = note.annotations.filter(
    (ann) => ann.page === currentPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(noteId, newPage);
      // Clear any selections or popups
      setSelectedText("");
      setSelectionRange(null);
      setShowAnnotationPopup(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);
      
      // Position the popup near the selection
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setAnnotationPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX
        });
        
        // Find the text in the current page content
        const start = currentPageContent.indexOf(selectedText);
        
        if (start >= 0) {
          const end = start + selectedText.length;
          setSelectionRange({ start, end });
        } else {
          // If exact match not found, still allow annotation
          setSelectionRange({ 
            start: 0, 
            end: selectedText.length 
          });
        }
        
        setShowAnnotationPopup(true);
        setSelectedAnnotation(null);
      }
    }
  };

  const applyAnnotation = (type: 'highlight' | 'underline', color: string) => {
    if (selectedText && noteId) {
      // Find the position of the selected text in the content
      const start = currentPageContent.indexOf(selectedText);
      
      if (start >= 0) {
        const end = start + selectedText.length;
        
        addAnnotation(noteId, {
          type,
          color,
          text: selectedText,
          startOffset: start,
          endOffset: end,
          tags: [],
          page: currentPage // Store the page number with the annotation
        });
      } else {
        // Fallback
        addAnnotation(noteId, {
          type,
          color,
          text: selectedText,
          startOffset: 0,
          endOffset: selectedText.length,
          tags: [],
          page: currentPage
        });
      }
      
      setShowAnnotationPopup(false);
      setSelectedText("");
      setSelectionRange(null);
    }
  };

  // Prepare content with annotations for display
  const getAnnotatedContent = () => {
    if (!currentPageContent) return { __html: '' };
    
    // First convert the page content to HTML
    let html = `<h2>Page ${currentPage} of ${totalPages}</h2><div class="pdf-page-content">${currentPageContent}</div>`;
    
    // If no annotations for this page or if marked is not loaded, just return the HTML
    if (!pageAnnotations || pageAnnotations.length === 0 || !marked) {
      return { __html: html };
    }
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get all text nodes in the HTML
    const textNodes: Node[] = [];
    const getTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        textNodes.push(node);
      } else {
        node.childNodes.forEach(child => getTextNodes(child));
      }
    };
    
    getTextNodes(tempDiv);
    
    // Apply annotations to the text nodes
    for (const annotation of pageAnnotations) {
      for (const textNode of textNodes) {
        const text = textNode.textContent || '';
        if (text.includes(annotation.text)) {
          const parent = textNode.parentNode;
          if (!parent) continue;
          
          const parts = text.split(annotation.text);
          const fragment = document.createDocumentFragment();
          
          // Add first part
          if (parts[0]) {
            fragment.appendChild(document.createTextNode(parts[0]));
          }
          
          // Add annotated part
          const span = document.createElement('span');
          span.className = annotation.type === 'highlight' ? 
            `highlight-${annotation.color}` : 
            `underline-${annotation.color}`;
          span.setAttribute('data-annotation-id', annotation.id);
          span.textContent = annotation.text;
          fragment.appendChild(span);
          
          // Add remaining parts
          if (parts.length > 1 && parts[1]) {
            fragment.appendChild(document.createTextNode(parts[1]));
          }
          
          // Replace the text node with our fragment
          parent.replaceChild(fragment, textNode);
          break; // Only replace the first occurrence to avoid issues
        }
      }
    }
    
    return { __html: tempDiv.innerHTML };
  };

  // Handle click on annotated text
  const handleAnnotationClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.hasAttribute('data-annotation-id') && note) {
      const annotationId = target.getAttribute('data-annotation-id');
      const annotation = note.annotations.find(a => a.id === annotationId);
      
      if (annotation) {
        setSelectedAnnotation(annotation);
        setShowAnnotationPopup(true);
        
        // Position the popup near the annotation
        const rect = target.getBoundingClientRect();
        setAnnotationPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX
        });
        
        e.stopPropagation();
      }
    } else {
      // Close popup when clicking outside
      setShowAnnotationPopup(false);
      setSelectedAnnotation(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold">{note.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {note.originalFileName ? `Original file: ${note.originalFileName}` : ''}
        </p>
      </div>
      
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto p-4 prose dark:prose-invert max-w-none"
        onMouseUp={handleTextSelection}
        onClick={handleAnnotationClick}
      >
        <div 
          dangerouslySetInnerHTML={getAnnotatedContent()} 
          className="user-select-text"
          style={{ 
            userSelect: 'text', 
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            cursor: 'text'
          }}
        />
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-2 rounded-md ${
              currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`p-2 rounded-md ${
              currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showAnnotationPopup && selectedAnnotation && (
        <AnnotationPopup
          noteId={noteId}
          annotation={selectedAnnotation}
          position={annotationPosition}
          onClose={() => {
            setShowAnnotationPopup(false);
            setSelectedAnnotation(null);
          }}
        />
      )}
      
      {/* Popup for creating new annotations */}
      {showAnnotationPopup && !selectedAnnotation && (
        <div 
          className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 z-10 border border-gray-200 dark:border-gray-700"
          style={{ top: annotationPosition.top, left: annotationPosition.left }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Add Annotation</h3>
            <button 
              onClick={() => {
                setShowAnnotationPopup(false);
                setSelectedAnnotation(null);
              }} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="text-sm font-medium">Highlight</div>
            <div className="flex space-x-2">
              <button 
                onClick={() => applyAnnotation('highlight', 'yellow')}
                className="w-6 h-6 rounded-full bg-yellow-200"
              />
              <button 
                onClick={() => applyAnnotation('highlight', 'green')}
                className="w-6 h-6 rounded-full bg-green-200"
              />
              <button 
                onClick={() => applyAnnotation('highlight', 'blue')}
                className="w-6 h-6 rounded-full bg-blue-200"
              />
              <button 
                onClick={() => applyAnnotation('highlight', 'pink')}
                className="w-6 h-6 rounded-full bg-pink-200"
              />
            </div>
            
            <div className="text-sm font-medium">Underline</div>
            <div className="flex space-x-2">
              <button 
                onClick={() => applyAnnotation('underline', 'red')}
                className="w-6 h-6 rounded-full bg-red-200"
              />
              <button 
                onClick={() => applyAnnotation('underline', 'blue')}
                className="w-6 h-6 rounded-full bg-blue-200"
              />
              <button 
                onClick={() => applyAnnotation('underline', 'green')}
                className="w-6 h-6 rounded-full bg-green-200"
              />
              <button 
                onClick={() => applyAnnotation('underline', 'orange')}
                className="w-6 h-6 rounded-full bg-orange-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
