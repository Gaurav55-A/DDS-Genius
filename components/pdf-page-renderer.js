'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renders a specific page from a PDF URL using pdfjs-dist.
 * Fetches PDF through our own API proxy to avoid CORS.
 * Uses a locally-hosted worker file for reliability.
 */
export default function PdfPageRenderer({ pdfUrl, pageNumber, alt = 'PDF page', className = '' }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const renderAttempted = useRef(false);

  useEffect(() => {
    if (!pdfUrl || !pageNumber) {
      setLoading(false);
      setError('No PDF URL or page number');
      return;
    }

    // Prevent double renders in React strict mode
    if (renderAttempted.current) return;
    renderAttempted.current = true;

    let cancelled = false;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);

        console.log(`[PdfRenderer] Loading page ${pageNumber} from:`, pdfUrl);

        // Step 1: Fetch the PDF through our proxy to avoid CORS
        const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText);
          throw new Error(`Proxy fetch failed (${response.status}): ${errText}`);
        }
        
        const pdfBytes = await response.arrayBuffer();
        console.log(`[PdfRenderer] Got ${pdfBytes.byteLength} bytes`);

        if (cancelled) return;

        // Step 2: Load pdfjs-dist with locally-hosted worker
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // Step 3: Load PDF from raw bytes (no external fetch by pdfjs)
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
        const pdf = await loadingTask.promise;

        console.log(`[PdfRenderer] PDF loaded, ${pdf.numPages} pages`);

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

        console.log(`[PdfRenderer] Page ${pageNumber} rendered successfully`);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error(`[PdfRenderer] Error rendering page ${pageNumber}:`, err);
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
      <div
        className={`flex flex-col items-center justify-center bg-muted/30 rounded text-muted-foreground text-xs p-4 ${className}`}
        style={{ minHeight: '150px' }}
        title={error}
      >
        <span className="text-yellow-500 mb-1">⚠</span>
        <span>Could not load image</span>
        <span className="mt-1 opacity-50 text-[10px] max-w-[200px] text-center break-all">{error}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="flex items-center justify-center bg-muted/30 rounded" style={{ minHeight: '200px' }}>
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-6 w-6 border-2 border-electric-blue border-t-transparent rounded-full" />
            <span className="text-xs text-muted-foreground">Loading page {pageNumber}...</span>
          </div>
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
