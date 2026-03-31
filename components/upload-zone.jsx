'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Thermometer, Loader2, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function UploadZone({ onUploadSuccess, processedReportId }) {
  const router = useRouter();
  const [sampleReport, setSampleReport] = useState(null);
  const [thermalImages, setThermalImages] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [reportId, setReportId] = useState(null);

  const onDropSample = useCallback((acceptedFiles) => {
    if (acceptedFiles?.[0]) {
      setSampleReport(acceptedFiles[0]);
      toast.success('Sample Report uploaded');
    }
  }, []);

  const onDropThermal = useCallback((acceptedFiles) => {
    if (acceptedFiles?.[0]) {
      setThermalImages(acceptedFiles[0]);
      toast.success('Thermal Images uploaded');
    }
  }, []);

  const { getRootProps: getSampleRootProps, getInputProps: getSampleInputProps, isDragActive: isSampleDragActive } = useDropzone({
    onDrop: onDropSample,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const { getRootProps: getThermalRootProps, getInputProps: getThermalInputProps, isDragActive: isThermalDragActive } = useDropzone({
    onDrop: onDropThermal,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleProcess = async () => {
    if (!sampleReport || !thermalImages) {
      toast.error('Please upload both files');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Uploading files...');

    try {
      const formData = new FormData();
      formData.append('sampleReport', sampleReport);
      formData.append('thermalImages', thermalImages);

      setProgress(10);
      setProcessingStep('Extracting text from PDFs...');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      setProgress(40);
      setProcessingStep('AI is matching thermal data with visual observations...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      const data = await response.json();
      
      setProgress(80);
      setProcessingStep('Generating professional PDF...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setProcessingStep('Complete!');
      setReportId(data.reportId);
      
      toast.success('Report processed successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess(data.reportId);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process reports');
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep('');
    }
  };

  const handleReset = () => {
    setSampleReport(null);
    setThermalImages(null);
    setProgress(0);
    setReportId(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  if (reportId) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-2 border-electric-yellow/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="icon-glow-yellow h-16 w-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-electric-yellow" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">Report Generated Successfully!</CardTitle>
          <CardDescription className="font-body">Report ID: {reportId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => router.push(`/reports/${reportId}`)}
              className="bg-electric-yellow hover:bg-electric-yellow/90 text-slate-950 font-medium"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/analytics')}
              variant="outline"
              className="border-minimal"
            >
              View Analytics
            </Button>
            <Button onClick={handleReset} variant="ghost">
              Process Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sample Report Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <FileText className="h-5 w-5" />
              Sample Report
            </CardTitle>
            <CardDescription className="font-body">Visual inspection report (PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getSampleRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isSampleDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
              } ${sampleReport ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : ''}`}
            >
              <input {...getSampleInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {sampleReport ? (
                <p className="text-sm font-medium text-green-600 dark:text-green-400 font-body">
                  ✓ {sampleReport.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                  {isSampleDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thermal Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Thermometer className="h-5 w-5" />
              Thermal Images
            </CardTitle>
            <CardDescription className="font-body">Thermal imaging data (PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getThermalRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isThermalDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
              } ${thermalImages ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : ''}`}
            >
              <input {...getThermalInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {thermalImages ? (
                <p className="text-sm font-medium text-green-600 dark:text-green-400 font-body">
                  ✓ {thermalImages.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                  {isThermalDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Button */}
      <Card>
        <CardContent className="pt-6">
          {isProcessing && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-electric-yellow" />
                <span className="text-sm font-medium text-foreground font-body">{processingStep}</span>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground font-body">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={handleProcess}
            disabled={!sampleReport || !thermalImages || isProcessing}
            className="w-full bg-electric-yellow hover:bg-electric-yellow/90 text-slate-950 font-medium"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Generate DDR Report'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
