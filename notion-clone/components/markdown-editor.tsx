"use client";

import { useNoteStore, Annotation } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { FiEye, FiEdit3 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";
import { AnnotationPopup } from "./annotation-popup";

export function MarkdownEditor() {
  const { notes, activeNoteId, updateNote, addAnnotation, updateAnnotation, deleteAnnotation } = useNoteStore();
  const [isPreview, setIsPreview] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ top: 0, left: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  useEffect(() => {
    // Reset selection when switching between edit and preview modes
    setSelectedText("");
    setSelectionRange(null);
    setShowAnnotationPopup(false);
  }, [isPreview]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        No note selected or create a new one.
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(activeNote.id, { title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(activeNote.id, { content: e.target.value });
  };

  const handleEditorSelection = () => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start !== end) {
      const text = editorRef.current.value.substring(start, end);
      setSelectedText(text);
      setSelectionRange({ start, end });
      
      // Position the popup near the selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setAnnotationPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX
        });
        setShowAnnotationPopup(true);
      }
    } else {
      setSelectedText("");
      setSelectionRange(null);
      setShowAnnotationPopup(false);
    }
  };

  const handlePreviewSelection = () => {
    // Only process if we're not clicking on an existing annotation
    const target = window.getSelection()?.anchorNode?.parentElement;
    if (target && target.hasAttribute('data-annotation-id')) {
      return; // Don't process selection if we're clicking on an existing annotation
    }
    
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
        
        // Find the text in the original markdown content
        const content = activeNote?.content || "";
        const start = content.indexOf(selectedText);
        
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
        
        // Always show the popup when text is selected
        setShowAnnotationPopup(true);
        setSelectedAnnotation(null); // Ensure we're creating a new annotation, not editing
      }
    } else {
      // Don't hide popup immediately on empty selection, as this prevents clicking the buttons
      // The popup will be hidden after an annotation is applied or when clicking elsewhere
      if (!showAnnotationPopup) {
        setSelectedText("");
        setSelectionRange(null);
      }
    }
  };

  const applyAnnotation = (type: 'highlight' | 'underline', color: string) => {
    if (selectedText && activeNoteId) {
      // Find the position of the selected text in the content
      const content = activeNote?.content || '';
      const start = content.indexOf(selectedText);
      
      if (start >= 0) {
        const end = start + selectedText.length;
        
        addAnnotation(activeNoteId, {
          type,
          color,
          text: selectedText,
          startOffset: start,
          endOffset: end,
          tags: []
        });
      } else {
        // If we can't find the exact position, make a best guess
        // This is a fallback for when the exact position can't be determined
        addAnnotation(activeNoteId, {
          type,
          color,
          text: selectedText,
          startOffset: 0,
          endOffset: selectedText.length,
          tags: []
        });
      }
      
      setShowAnnotationPopup(false);
      setSelectedText("");
      setSelectionRange(null);
    }
  };

  // Prepare content with annotations for display
  const getAnnotatedContent = () => {
    if (!activeNote) return { __html: '' };
    
    // First convert markdown to HTML
    let html = marked.parse(activeNote.content) as string;
    
    // If no annotations, just return the HTML
    if (!activeNote.annotations || activeNote.annotations.length === 0) {
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
    for (const annotation of activeNote.annotations) {
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
    
    if (target.hasAttribute('data-annotation-id') && activeNote && activeNoteId) {
      const annotationId = target.getAttribute('data-annotation-id');
      const annotation = activeNote.annotations.find(a => a.id === annotationId);
      
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
        <input
          type="text"
          value={activeNote.title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-xl font-bold bg-transparent border-none outline-none"
        />
      </div>
      
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPreview(false)}
            className={`p-2 rounded-md ${
              !isPreview ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`p-2 rounded-md ${
              isPreview ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FiEye className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {isPreview ? (
          <div 
            ref={previewRef}
            className="prose prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal dark:prose-invert max-w-none" 
            onMouseUp={handlePreviewSelection}
            onClick={handleAnnotationClick}
          >
            <div dangerouslySetInnerHTML={getAnnotatedContent()} />
          </div>
        ) : (
          <textarea
            ref={editorRef}
            value={activeNote.content}
            onChange={handleContentChange}
            onMouseUp={handleEditorSelection}
            onKeyUp={handleEditorSelection}
            placeholder="Start writing..."
            className="w-full h-full resize-none bg-transparent border-none outline-none font-mono"
          />
        )}
      </div>
      
      {showAnnotationPopup && selectedAnnotation && (
        <AnnotationPopup
          noteId={activeNoteId!}
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
