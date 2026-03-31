'use client';

import { useState } from 'react';
import { FileText, BarChart3, Zap, Sparkles, TrendingUp, Shield } from 'lucide-react';
import UploadZone from '@/components/upload-zone';
import { ThemeToggle } from '@/components/theme-toggle';
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
                <p className="text-xs text-muted-foreground font-body">Vibrant Industrial Edition</p>
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
          <div className="inline-flex items-center gap-2 bg-electric-blue/10 border border-electric-blue/20 rounded-full px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue font-body">Powered by Claude 3.5 Sonnet AI</span>
          </div>
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
          <UploadZone onUploadComplete={handleUploadComplete} />
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
              Claude AI intelligently matches thermal readings with visual observations, detecting conflicts and sub-surface issues.
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

        {/* Design Highlights */}
        <div className="mt-20 bg-card border-2 border-electric-yellow/20 rounded-lg p-8 max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="icon-glow-yellow h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-electric-yellow" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-2">Vibrant Industrial Design System</h3>
              <p className="text-muted-foreground font-body mb-4">
                Experience the new design architecture built for visibility and precision:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
                <div className="flex items-start gap-2">
                  <span className="text-electric-yellow font-bold mt-0.5">●</span>
                  <span><strong className="text-electric-yellow">Electric Yellow</strong> - Primary brand color representing UrbanRoof energy and visibility</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-electric-blue font-bold mt-0.5">●</span>
                  <span><strong className="text-electric-blue">Electric Blue</strong> - Technical data and AI engine indicators</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-teal font-bold mt-0.5">●</span>
                  <span><strong className="text-neon-teal">Neon Teal</strong> - Health index and positive status</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-bright-rose font-bold mt-0.5">●</span>
                  <span><strong className="text-bright-rose">Bright Rose</strong> - Critical conflicts requiring attention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-minimal mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground text-sm font-body">
            DDR Genius © 2024 | Vibrant Industrial Design | Built with Next.js, MongoDB & Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
