'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ConflictAlert } from '@/components/conflict-alert';
import { toast } from 'sonner';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchReport(params.id);
    }
  }, [params.id]);

  const fetchReport = async (reportId) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error('Report not found');
      
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info('Generating PDF...');

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: params.id })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      // Explicitly create a PDF blob with the correct MIME type
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `DDR_Report_${params.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Delay cleanup to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-electric-blue mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-bright-rose mx-auto mb-4" />
            <h2 className="text-xl font-bold font-heading mb-2">Report Not Found</h2>
            <p className="text-muted-foreground font-body mb-4">
              The requested report could not be found.
            </p>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { mergedData, propertyInfo, analytics } = report;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-minimal bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold font-heading text-foreground">Detailed Diagnosis Report</h1>
              <p className="text-sm text-muted-foreground font-body">Report ID: {params.id?.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
              <ThemeToggle />
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-electric-yellow hover:bg-electric-yellow/90 text-slate-950 font-medium"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="border-minimal"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Property Info */}
        <Card className="border-minimal">
          <CardHeader>
            <CardTitle className="font-heading">Property Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
              <div>
                <span className="text-muted-foreground">Property Type:</span>
                <span className="ml-2 font-medium">{propertyInfo?.type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Inspection Date:</span>
                <span className="ml-2 font-medium">
                  {propertyInfo?.inspectionDate ? new Date(propertyInfo.inspectionDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Inspector:</span>
                <span className="ml-2 font-medium">{propertyInfo?.inspector || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Areas:</span>
                <span className="ml-2 font-medium">{analytics?.totalAreas || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Issue Summary */}
        <Card className="border-minimal">
          <CardHeader>
            <CardTitle className="font-heading">Property Issue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground font-body leading-relaxed">
              {mergedData?.propertyIssueSummary || 'No summary available'}
            </p>
            
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold font-heading mb-2">Severity Assessment</h3>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1 rounded-full font-medium text-sm ${
                  mergedData?.severityAssessment?.overall === 'Severe' ? 'bg-bright-rose text-white' :
                  mergedData?.severityAssessment?.overall === 'Moderate' ? 'bg-vivid-amber text-white' :
                  'bg-neon-teal text-slate-950'
                }`}>
                  {mergedData?.severityAssessment?.overall || 'Moderate'}
                </span>
                <span className="text-sm text-muted-foreground font-body">
                  {mergedData?.severityAssessment?.reasoning || ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Conflicts */}
        {mergedData?.dataConflicts && mergedData.dataConflicts.length > 0 && (
          <ConflictAlert 
            title="Critical Data Conflicts Detected"
            conflicts={mergedData.dataConflicts}
          />
        )}

        {/* Area-wise Observations */}
        <Card className="border-minimal">
          <CardHeader>
            <CardTitle className="font-heading">Area-wise Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mergedData?.areaWiseObservations?.map((obs, index) => (
              <div key={index} className="border-minimal rounded-lg p-4 space-y-3">
                <div className="bg-electric-blue text-white px-4 py-2 rounded-md -mx-4 -mt-4 mb-3">
                  <h3 className="font-bold font-heading">{obs.area || 'Unknown Area'}</h3>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Visual Observation:</h4>
                  <p className="text-foreground font-body">{obs.visualObservation || 'Not Available'}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Thermal Analysis:</h4>
                  <p className="text-foreground font-body">
                    {typeof obs.thermalReading === 'object' && obs.thermalReading 
                      ? `Hotspot: ${obs.thermalReading.hotspot || 'N/A'}°C | Coldspot: ${obs.thermalReading.coldspot || 'N/A'}°C - ${obs.thermalReading.analysis || ''}`
                      : 'Not Available'}
                  </p>
                </div>
                
                {/* Image Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                    <div className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                      Visual Inspection Photo
                    </div>
                    <div className="p-2 aspect-video flex items-center justify-center relative bg-muted/10">
                      {report.sampleImages?.find(img => img.page === obs.visualImageRef) ? (
                        <div className="relative w-full h-full">
                          <img
                            src={report.sampleImages.find(img => img.page === obs.visualImageRef).path}
                            alt="Visual observation"
                            className="object-contain w-full h-full rounded shadow-sm border border-border/50"
                          />
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded p-6 w-full h-full">
                          <span className="font-medium mb-1">Image Not Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                    <div className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                      Thermal Imaging
                    </div>
                    <div className="p-2 aspect-video flex items-center justify-center relative bg-muted/10">
                      {report.thermalImages?.find(img => img.page === (obs.thermalImageRef || (index + 1))) ? (
                        <div className="relative w-full h-full">
                          <img
                            src={report.thermalImages.find(img => img.page === (obs.thermalImageRef || (index + 1))).path}
                            alt="Thermal reading"
                            className="object-contain w-full h-full rounded shadow-sm border border-border/50"
                          />
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded p-6 w-full h-full">
                          <span className="font-medium mb-1">Image Not Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-sm mt-4 pt-2 border-t border-border">
                  <span className="text-muted-foreground">Type: <span className="font-medium text-foreground">{obs.defectType || 'N/A'}</span></span>
                  <span className="text-muted-foreground">Severity: <span className="font-medium text-foreground">{obs.severity || 'N/A'}</span></span>
                </div>

                {obs.conflictDetected && (
                  <div className="bg-bright-rose/10 border border-bright-rose/30 rounded p-3 mt-2">
                    <p className="text-sm text-bright-rose font-medium">⚠️ {obs.conflictDescription}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-minimal">
          <CardHeader>
            <CardTitle className="font-heading">Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 font-body">
              {mergedData?.recommendedActions?.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-electric-yellow mt-1">●</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>

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
