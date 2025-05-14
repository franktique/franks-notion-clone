"use client";

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNoteStore } from '@/lib/store';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function PdfUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const { addPdfNote } = useNoteStore();

  // Reset the success state when starting a new upload
  useEffect(() => {
    if (isUploading) {
      setUploadSuccess(false);
    }
  }, [isUploading]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      // Use FileReader with ArrayBuffer for PDF.js
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          setProgress(20);
          
          // Get file content as ArrayBuffer
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Use PDF.js to load the PDF document
          const loadingTask = pdfjsLib.getDocument(arrayBuffer);
          const pdf = await loadingTask.promise;
          
          setProgress(30);
          
          // Extract text from each page
          const numPages = pdf.numPages;
          const pagesContent: string[] = [];
          
          // Process each page
          for (let i = 1; i <= numPages; i++) {
            // Update progress based on page processing
            setProgress(30 + Math.floor((i / numPages) * 50));
            
            // Get the page
            const page = await pdf.getPage(i);
            
            // Extract text content
            const textContent = await page.getTextContent();
            
            // Combine text items into a single string
            let pageText = '';
            let lastY = -1;
            
            for (const item of textContent.items) {
              // Check if this is a text item
              if ('str' in item) {
                // Add newline if Y position changes significantly
                if (lastY !== -1 && Math.abs((item as any).transform[5] - lastY) > 5) {
                  pageText += '\n';
                }
                
                // Add the text
                pageText += (item as any).str + ' ';
                
                // Update lastY
                lastY = (item as any).transform[5];
              }
            }
            
            // Clean up the text
            pageText = pageText
              .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
              .replace(/\n\s+/g, '\n') // Remove spaces after newlines
              .trim();
            
            // Add paragraphs for better readability
            pageText = pageText
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n\n');
            
            // Add the page to our collection
            pagesContent.push(pageText);
          }
          
          setProgress(80);
          
          // Create markdown content
          let markdownContent = '';
          pagesContent.forEach((pageText, index) => {
            markdownContent += `## Page ${index + 1}\n\n${pageText}\n\n`;
          });
          
          // Create a new note with the PDF content
          addPdfNote({
            title: file.name.replace('.pdf', ''),
            content: markdownContent,
            pages: pagesContent,
            originalFileName: file.name
          });
          
          setProgress(100);
          
          // Show success message
          setUploadedFileName(file.name);
          setUploadSuccess(true);
          
          // Keep the progress visible for a moment
          setTimeout(() => {
            setIsUploading(false);
          }, 1000);
        } catch (processError) {
          console.error('Error processing PDF content:', processError);
          alert('Error processing PDF content. Please try another file.');
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
        setIsUploading(false);
      };
      
      // Read the file as ArrayBuffer for PDF.js
      reader.readAsArrayBuffer(file);
      setProgress(10);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF. Please try again.');
      setIsUploading(false);
    }
  }, [addPdfNote]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isUploading
  });

  // Reset the success state when starting a new upload
  useEffect(() => {
    if (isUploading) {
      setUploadSuccess(false);
    }
  }, [isUploading]);

  return (
    <div className="w-full">
      {uploadSuccess ? (
        <div className="border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-green-100 dark:bg-green-800 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">PDF Uploaded Successfully!</h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{uploadedFileName}</span> has been processed and is now available as a note.
            </p>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <p>Your PDF has been converted to a paginated note with the same structure as the original document.</p>
              <p className="mt-1">You can now navigate through the pages and add annotations to the content.</p>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button 
                onClick={() => setUploadSuccess(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Upload Another PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}
            ${isUploading ? 'opacity-90 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            {!isUploading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            
            {isUploading ? (
              <div className="w-full max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Processing PDF...</div>
                  <div className="text-sm font-medium text-blue-600">{progress}%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {progress < 20 && "Reading PDF file..."}
                  {progress >= 20 && progress < 90 && `Extracting text from pages...`}
                  {progress >= 90 && "Creating note with PDF content..."}
                </div>
              </div>
            ) : (
              <>
                <p className="text-base font-medium">
                  {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here, or click to select'}
                </p>
                <div className="flex flex-col space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <p>PDF will be converted to markdown with pagination preserved</p>
                  <p>You'll be able to add annotations to the content</p>
                </div>
                <div className="mt-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Tip:</span> After uploading, you can navigate between pages and add annotations to the PDF content
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
