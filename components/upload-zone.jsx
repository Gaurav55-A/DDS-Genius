'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Thermometer, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function UploadZone({ onUploadComplete }) {
  const [sampleReport, setSampleReport] = useState(null);
  const [thermalImages, setThermalImages] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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

    setProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('sampleReport', sampleReport);
      formData.append('thermalImages', thermalImages);

      setProgress(20);
      toast.info('Uploading files...');

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      const data = await response.json();
      setProgress(100);
      setReportId(data.reportId);
      
      toast.success('Report processed successfully!');
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process reports');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setSampleReport(null);
    setThermalImages(null);
    setProgress(0);
    setReportId(null);
  };

  if (reportId) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Report Generated Successfully!</CardTitle>
          <CardDescription>Report ID: {reportId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.href = `/dashboard/analytics`}>
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sample Report
            </CardTitle>
            <CardDescription>Visual inspection report (PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getSampleRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isSampleDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
              } ${sampleReport ? 'bg-green-50 border-green-500' : ''}`}
            >
              <input {...getSampleInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {sampleReport ? (
                <p className="text-sm font-medium text-green-600">
                  ✓ {sampleReport.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {isSampleDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thermal Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Thermal Images
            </CardTitle>
            <CardDescription>Thermal imaging data (PDF)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getThermalRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isThermalDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
              } ${thermalImages ? 'bg-green-50 border-green-500' : ''}`}
            >
              <input {...getThermalInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {thermalImages ? (
                <p className="text-sm font-medium text-green-600">
                  ✓ {thermalImages.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
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
          {processing && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing reports...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          <Button
            onClick={handleProcess}
            disabled={!sampleReport || !thermalImages || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
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
