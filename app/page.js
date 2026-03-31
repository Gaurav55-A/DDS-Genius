'use client';

import { useState } from 'react';
import { FileText, BarChart3, Sparkles } from 'lucide-react';
import UploadZone from '@/components/upload-zone';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleUploadComplete = (data) => {
    setUploadComplete(true);
    console.log('Upload complete:', data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">DDR Genius</h1>
                <p className="text-sm text-slate-400">AI-Powered Diagnostic Reports</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard/analytics')}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300">Powered by Claude 3.5 Sonnet AI</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Transform Raw Inspection Data
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Into Professional Reports
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Upload your property inspection PDFs and thermal images. Our AI automatically generates comprehensive Detailed Diagnosis Reports with intelligent data matching.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-5xl mx-auto">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart PDF Parsing</h3>
            <p className="text-slate-400 text-sm">
              Automatically extracts visual observations, thermal readings, and images from your inspection PDFs.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="bg-cyan-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Data Matching</h3>
            <p className="text-slate-400 text-sm">
              Claude AI intelligently matches thermal readings with visual observations by room/area with conflict detection.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-slate-400 text-sm">
              Visualize defect patterns, temperature distributions, and severity trends across all reports.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-slate-400 text-sm">
            DDR Genius © 2024 | Built with Next.js, MongoDB & Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
