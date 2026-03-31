'use client';

import { useState } from 'react';
import { FileText, BarChart3, Sparkles, TrendingUp } from 'lucide-react';
import UploadZone from '@/components/upload-zone';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [processedReportId, setProcessedReportId] = useState(null);

  const handleUploadSuccess = (reportId) => {
    setProcessedReportId(reportId);
    console.log('Report processed successfully:', reportId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-minimal bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-glow-yellow p-2.5 rounded-lg">
                <FileText className="h-6 w-6 text-electric-yellow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground">DDR Genius</h1>
                <p className="text-xs text-muted-foreground font-body">AI-Powered Diagnostic Reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={() => router.push('/dashboard/analytics')}
                className="bg-electric-yellow hover:bg-electric-yellow/90 text-slate-950 font-medium"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold font-heading text-foreground mb-6">
            Transform Raw Inspection Data
            <br />
            <span className="bg-gradient-to-r from-electric-yellow via-electric-blue to-neon-teal bg-clip-text text-transparent">
              Into Professional Reports
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            Upload your property inspection PDFs and thermal images. Our AI automatically generates comprehensive Detailed Diagnosis Reports with intelligent conflict detection.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-5xl mx-auto">
          <UploadZone 
            onUploadSuccess={handleUploadSuccess}
            processedReportId={processedReportId}
          />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="bg-card border-minimal rounded-lg p-6 hover:shadow-lg transition-all duration-200">
            <div className="icon-glow-yellow h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-electric-yellow" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-2">Smart PDF Parsing</h3>
            <p className="text-muted-foreground text-sm font-body">
              Automatically extracts visual observations, thermal readings, and images from your inspection PDFs with high precision.
            </p>
          </div>

          <div className="bg-card border-minimal rounded-lg p-6 hover:shadow-lg transition-all duration-200">
            <div className="icon-glow-blue h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-electric-blue" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-2">AI Data Matching</h3>
            <p className="text-muted-foreground text-sm font-body">
              AI intelligently matches thermal readings with visual observations, detecting conflicts and sub-surface issues.
            </p>
          </div>

          <div className="bg-card border-minimal rounded-lg p-6 hover:shadow-lg transition-all duration-200">
            <div className="icon-glow-teal h-12 w-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-neon-teal" />
            </div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground text-sm font-body">
              Visualize defect patterns, temperature distributions, and health indexes across all reports with vibrant charts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-minimal mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground text-sm font-body">
            Made by Gaurav Agrawal
          </p>
        </div>
      </footer>
    </div>
  );
}
