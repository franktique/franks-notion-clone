"use client";

import { useNoteStore, Annotation } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { FiX, FiTag, FiPlus, FiCheck } from "react-icons/fi";

interface AnnotationPopupProps {
  noteId: string;
  annotation: Annotation;
  position: { top: number; left: number };
  onClose: () => void;
}

export function AnnotationPopup({ noteId, annotation, position, onClose }: AnnotationPopupProps) {
  const { notes, updateAnnotation, deleteAnnotation } = useNoteStore();
  const [newTag, setNewTag] = useState("");
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debug the component props
  console.log('AnnotationPopup props:', { noteId, annotation, position });
  
  // Get all existing tags from all notes
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    
    notes.forEach(note => {
      note.annotations.forEach(ann => {
        ann.tags.forEach(tag => allTags.add(tag));
      });
    });
    
    return Array.from(allTags);
  };
  
  // Filter tags based on input
  useEffect(() => {
    console.log('Tag input changed:', newTag);
    
    if (newTag.trim()) {
      const allTags = getAllTags();
      console.log('All available tags:', allTags);
      
      // Filter tags that match the input and aren't already added
      const filtered = allTags.filter(tag => 
        tag.toLowerCase().includes(newTag.toLowerCase()) && 
        !annotation.tags.includes(tag)
      );
      
      console.log('Filtered tags:', filtered);
      console.log('Show suggestions state:', showSuggestions);
      
      setFilteredTags(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredTags([]);
      setShowSuggestions(false);
    }
  }, [newTag]);
  
  // Force update filtered tags when notes or annotation tags change
  useEffect(() => {
    if (newTag.trim()) {
      const allTags = getAllTags();
      const filtered = allTags.filter(tag => 
        tag.toLowerCase().includes(newTag.toLowerCase()) && 
        !annotation.tags.includes(tag)
      );
      setFilteredTags(filtered);
    }
  }, [notes, annotation.tags]);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (color: string) => {
    updateAnnotation(noteId, annotation.id, { color });
  };

  const handleAddTag = (tagToAdd = newTag) => {
    if (tagToAdd.trim() && !annotation.tags.includes(tagToAdd.trim())) {
      const updatedTags = [...annotation.tags, tagToAdd.trim()];
      updateAnnotation(noteId, annotation.id, { tags: updatedTags });
      setNewTag("");
      setShowSuggestions(false);
    }
  };
  
  const handleSelectTag = (tag: string) => {
    handleAddTag(tag);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = annotation.tags.filter(t => t !== tag);
    updateAnnotation(noteId, annotation.id, { tags: updatedTags });
  };

  const handleDelete = () => {
    deleteAnnotation(noteId, annotation.id);
    onClose();
  };

  return (
    <div 
      className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 z-10 border border-gray-200 dark:border-gray-700 w-64"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">
          {annotation.type === 'highlight' ? 'Highlight' : 'Underline'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <FiX className="h-4 w-4" />
        </button>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Color</div>
        <div className="flex space-x-2">
          {annotation.type === 'highlight' ? (
            <>
              <button 
                onClick={() => handleColorChange('yellow')}
                className={`w-6 h-6 rounded-full bg-yellow-200 ${annotation.color === 'yellow' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('green')}
                className={`w-6 h-6 rounded-full bg-green-200 ${annotation.color === 'green' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('blue')}
                className={`w-6 h-6 rounded-full bg-blue-200 ${annotation.color === 'blue' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('pink')}
                className={`w-6 h-6 rounded-full bg-pink-200 ${annotation.color === 'pink' ? 'ring-2 ring-blue-500' : ''}`}
              />
            </>
          ) : (
            <>
              <button 
                onClick={() => handleColorChange('red')}
                className={`w-6 h-6 rounded-full bg-red-200 ${annotation.color === 'red' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('blue')}
                className={`w-6 h-6 rounded-full bg-blue-200 ${annotation.color === 'blue' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('green')}
                className={`w-6 h-6 rounded-full bg-green-200 ${annotation.color === 'green' ? 'ring-2 ring-blue-500' : ''}`}
              />
              <button 
                onClick={() => handleColorChange('orange')}
                className={`w-6 h-6 rounded-full bg-orange-200 ${annotation.color === 'orange' ? 'ring-2 ring-blue-500' : ''}`}
              />
            </>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {annotation.tags.map(tag => (
            <div key={tag} className="flex items-center bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">
              <FiTag className="h-3 w-3 mr-1" />
              <span>{tag}</span>
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="flex-1 text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-l-md border-none outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                } else if (e.key === 'ArrowDown' && filteredTags.length > 0) {
                  // Focus on the first suggestion
                  const suggestionElement = document.getElementById('tag-suggestion-0');
                  if (suggestionElement) suggestionElement.focus();
                }
              }}
              onFocus={() => {
                // Always show suggestions when focused if there's text
                if (newTag.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onClick={() => {
                // Show suggestions on click if there's text
                if (newTag.trim()) {
                  setShowSuggestions(true);
                }
              }}
            />
            <button
              onClick={() => handleAddTag()}
              className="bg-gray-200 dark:bg-gray-600 px-2 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              <FiPlus className="h-4 w-4" />
            </button>
          </div>
          
          {/* Tag suggestions dropdown */}
          {showSuggestions && filteredTags.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto"
              style={{ 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '2px solid #3b82f6' // Blue border to make it more visible
              }}
            >
              <div className="py-1 text-xs text-gray-500 dark:text-gray-400 px-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                Matching tags
              </div>
              {filteredTags.map((tag, index) => (
                <button
                  key={tag}
                  id={`tag-suggestion-${index}`}
                  className="flex items-center w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSelectTag(tag)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSelectTag(tag);
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    } else if (e.key === 'ArrowDown') {
                      const nextElement = document.getElementById(`tag-suggestion-${index + 1}`);
                      if (nextElement) nextElement.focus();
                    } else if (e.key === 'ArrowUp') {
                      if (index === 0) {
                        inputRef.current?.focus();
                      } else {
                        const prevElement = document.getElementById(`tag-suggestion-${index - 1}`);
                        if (prevElement) prevElement.focus();
                      }
                    }
                  }}
                >
                  <FiTag className="h-3 w-3 mr-2" />
                  <span>{tag}</span>
                  <FiCheck className="h-3 w-3 ml-auto" />
                </button>
              ))}
            </div>
          )}
          
          {/* Show "Create new tag" option if no matches and input is not empty */}
          {showSuggestions && filteredTags.length === 0 && newTag.trim() !== '' && (
            <div 
              className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
              style={{ 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '2px solid #3b82f6' // Blue border to make it more visible
              }}
            >
              <div className="py-1 text-xs text-gray-500 dark:text-gray-400 px-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                No matching tags
              </div>
              <button
                className="flex items-center w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleAddTag()}
              >
                <FiPlus className="h-3 w-3 mr-2" />
                <span>Create tag "{newTag.trim()}"</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={handleDelete}
        className="w-full text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 text-center"
      >
        Delete {annotation.type}
      </button>
    </div>
  );
}
