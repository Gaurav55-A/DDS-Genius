'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renders a specific page from a PDF URL using pdfjs-dist (pure JS, works in browser).
 * Fetches the PDF as raw bytes first to avoid CORS issues with cross-origin URLs.
 */
export default function PdfPageRenderer({ pdfUrl, pageNumber, alt = 'PDF page', className = '' }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfUrl || !pageNumber) {
      setLoading(false);
      setError('No PDF URL or page number');
      return;
    }

    let cancelled = false;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Fetch the PDF as raw bytes ourselves (avoids CORS issues)
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        const pdfBytes = await response.arrayBuffer();

        if (cancelled) return;

        // Step 2: Load pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        
        // Use CDN worker to avoid webpack bundling issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        // Step 3: Load the PDF from our fetched bytes (no external fetch needed by pdfjs)
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          throw new Error(`Page ${pageNumber} out of range (1-${pdf.numPages})`);
        }

        const page = await pdf.getPage(pageNumber);

        if (cancelled) return;

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
          console.error('PDF render error for page', pageNumber, ':', err);
          setError(err.message || 'Failed to render');
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
      <div className={`flex items-center justify-center bg-muted/30 rounded text-muted-foreground text-xs p-4 ${className}`}
           title={error}>
        <span>⚠ Could not load page {pageNumber}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded" style={{ minHeight: '200px' }}>
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
