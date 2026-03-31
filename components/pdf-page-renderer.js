'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renders a specific page from a PDF URL using pdfjs-dist (pure JS, works in browser).
 * No native dependencies required - this runs entirely client-side.
 */
export default function PdfPageRenderer({ pdfUrl, pageNumber, alt = 'PDF page', className = '' }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfUrl || !pageNumber) {
      setLoading(false);
      setError('No PDF URL or page number provided');
      return;
    }

    let cancelled = false;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import pdfjs-dist (client-side only)
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source to CDN (avoids bundling issues)
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        // Check page number is valid
        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          setError(`Page ${pageNumber} not found (PDF has ${pdf.numPages} pages)`);
          setLoading(false);
          return;
        }

        // Get the specific page
        const page = await pdf.getPage(pageNumber);

        if (cancelled) return;

        // Render to canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF render error:', err);
          setError(err.message || 'Failed to render PDF page');
          setLoading(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pageNumber]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded text-muted-foreground text-sm p-4 ${className}`}>
        <span>{alt} - Page {pageNumber}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded">
          <div className="animate-spin h-6 w-6 border-2 border-electric-blue border-t-transparent rounded-full" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded shadow-sm border border-border/50"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}
