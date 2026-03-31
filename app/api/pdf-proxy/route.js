import { NextResponse } from 'next/server';

/**
 * Proxy route for fetching PDFs from Supabase Storage.
 * This eliminates CORS issues by making the request server-side.
 * Usage: /api/pdf-proxy?url=ENCODED_SUPABASE_URL
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF: ' + error.message },
      { status: 500 }
    );
  }
}
