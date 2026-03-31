'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ConflictAlert } from '@/components/conflict-alert';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamically import PdfPageRenderer (client-only, uses canvas)
const PdfPageRenderer = dynamic(() => import('@/components/pdf-page-renderer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-muted/30 rounded p-8">
      <div className="animate-spin h-6 w-6 border-2 border-electric-blue border-t-transparent rounded-full" />
    </div>
  ),
});

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportContentRef = useRef(null);

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
      toast.info('Generating PDF... This may take a moment.');

      // Use html2pdf.js for client-side PDF generation (no server/Puppeteer needed)
      const html2pdf = (await import('html2pdf.js')).default;

      const element = reportContentRef.current;
      if (!element) {
        throw new Error('Report content not found');
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `DDR_Report_${params.id.substring(0, 8)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();

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

  // Determine image source: use PDF URLs for client-side rendering, or fallback to stored paths
  const hasVisualPdf = !!report.visualPdfUrl;
  const hasThermalPdf = !!report.thermalPdfUrl;

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

      {/* Report Content - wrapped in ref for html2pdf capture */}
      <main ref={reportContentRef} className="container mx-auto px-4 py-8 space-y-8">
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

        {/* Analytics Dashboard */}
        {analytics && (
          <Card className="border-minimal">
            <CardHeader>
              <CardTitle className="font-heading">Inspection Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-electric-blue">{analytics.totalAreas || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Areas</p>
                </div>
                <div className="bg-vivid-amber/10 border border-vivid-amber/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-vivid-amber">{analytics.totalDefects || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Defects</p>
                </div>
                <div className="bg-bright-rose/10 border border-bright-rose/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-bright-rose">{analytics.totalConflicts || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Data Conflicts</p>
                </div>
                <div className="bg-neon-teal/10 border border-neon-teal/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-neon-teal">
                    {mergedData?.severityAssessment?.overall || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Overall Severity</p>
                </div>
              </div>

              {/* Issue Distribution + Severity Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Issue Distribution */}
                {analytics.issueDistribution && Object.keys(analytics.issueDistribution).length > 0 && (
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h4 className="font-semibold text-sm font-heading mb-3">Issue Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.issueDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => {
                          const total = analytics.totalDefects || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={type}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-foreground font-medium">{type}</span>
                                <span className="text-muted-foreground">{count} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-electric-blue rounded-full h-2 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Severity Distribution */}
                {analytics.severityDistribution && (
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h4 className="font-semibold text-sm font-heading mb-3">Severity Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'Minor', color: 'bg-neon-teal', textColor: 'text-neon-teal' },
                        { key: 'Moderate', color: 'bg-vivid-amber', textColor: 'text-vivid-amber' },
                        { key: 'Severe', color: 'bg-bright-rose', textColor: 'text-bright-rose' },
                      ].map(({ key, color, textColor }) => {
                        const count = analytics.severityDistribution[key] || 0;
                        const total = analytics.totalDefects || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className={`font-medium ${textColor}`}>{key}</span>
                              <span className="text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`${color} rounded-full h-2 transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature Statistics */}
              {analytics.temperatureStats && analytics.temperatureStats.readings?.length > 0 && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="font-semibold text-sm font-heading mb-3">Temperature Analysis</h4>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-background/50 rounded p-3 text-center">
                      <p className="text-lg font-bold text-bright-rose">
                        {analytics.temperatureStats.maxHotspot?.toFixed(1) || '—'}°C
                      </p>
                      <p className="text-[10px] text-muted-foreground">Max Hotspot</p>
                    </div>
                    <div className="bg-background/50 rounded p-3 text-center">
                      <p className="text-lg font-bold text-electric-blue">
                        {analytics.temperatureStats.minColdspot < 100 ? analytics.temperatureStats.minColdspot?.toFixed(1) : '—'}°C
                      </p>
                      <p className="text-[10px] text-muted-foreground">Min Coldspot</p>
                    </div>
                    <div className="bg-background/50 rounded p-3 text-center">
                      <p className="text-lg font-bold text-vivid-amber">
                        {analytics.temperatureStats.avgHotspot?.toFixed(1) || '—'}°C
                      </p>
                      <p className="text-[10px] text-muted-foreground">Avg Hotspot</p>
                    </div>
                    <div className="bg-background/50 rounded p-3 text-center">
                      <p className="text-lg font-bold text-neon-teal">
                        {analytics.temperatureStats.avgColdspot?.toFixed(1) || '—'}°C
                      </p>
                      <p className="text-[10px] text-muted-foreground">Avg Coldspot</p>
                    </div>
                  </div>

                  {/* Per-Area Temperature Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-muted-foreground font-medium">Area</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium">Hotspot</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium">Coldspot</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium">Delta</th>
                          <th className="text-center py-2 px-2 text-muted-foreground font-medium">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.temperatureStats.readings.map((reading, idx) => {
                          const delta = reading.hotspot && reading.coldspot
                            ? (reading.hotspot - reading.coldspot).toFixed(1)
                            : null;
                          const isHighRisk = reading.coldspot && reading.coldspot < 22;
                          const isDeltaRisk = delta && parseFloat(delta) > 5;
                          return (
                            <tr key={idx} className="border-b border-border/50">
                              <td className="py-2 px-2 font-medium text-foreground">{reading.area}</td>
                              <td className="py-2 px-2 text-right text-bright-rose">
                                {reading.hotspot?.toFixed(1) || '—'}°C
                              </td>
                              <td className="py-2 px-2 text-right text-electric-blue">
                                {reading.coldspot?.toFixed(1) || '—'}°C
                              </td>
                              <td className={`py-2 px-2 text-right font-medium ${isDeltaRisk ? 'text-vivid-amber' : 'text-foreground'}`}>
                                {delta ? `${delta}°C` : '—'}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {isHighRisk || isDeltaRisk ? (
                                  <span className="inline-block w-2 h-2 rounded-full bg-bright-rose" title="High risk" />
                                ) : (
                                  <span className="inline-block w-2 h-2 rounded-full bg-neon-teal" title="Normal" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                  {/* Visual Inspection Photo */}
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                    <div className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                      Visual Inspection Photo
                    </div>
                    <div className="p-2 flex items-center justify-center relative bg-muted/10" style={{ minHeight: '200px' }}>
                      {hasVisualPdf && obs.visualImageRef ? (
                        <PdfPageRenderer
                          pdfUrl={report.visualPdfUrl}
                          pageNumber={obs.visualImageRef}
                          alt="Visual observation"
                          className="w-full"
                        />
                      ) : report.sampleImages?.find(img => img.page === obs.visualImageRef)?.path?.startsWith('data:') ? (
                        <img
                          src={report.sampleImages.find(img => img.page === obs.visualImageRef).path}
                          alt="Visual observation"
                          className="object-contain w-full h-full rounded shadow-sm border border-border/50"
                        />
                      ) : (
                        <div className="text-muted-foreground text-sm flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded p-6 w-full h-full">
                          <span className="font-medium mb-1">Image Not Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Thermal Imaging */}
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                    <div className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                      Thermal Imaging
                    </div>
                    <div className="p-2 flex items-center justify-center relative bg-muted/10" style={{ minHeight: '200px' }}>
                      {hasThermalPdf && (obs.thermalImageRef || (index + 1)) ? (
                        <PdfPageRenderer
                          pdfUrl={report.thermalPdfUrl}
                          pageNumber={obs.thermalImageRef || (index + 1)}
                          alt="Thermal reading"
                          className="w-full"
                        />
                      ) : report.thermalImages?.find(img => img.page === (obs.thermalImageRef || (index + 1)))?.path?.startsWith('data:') ? (
                        <img
                          src={report.thermalImages.find(img => img.page === (obs.thermalImageRef || (index + 1))).path}
                          alt="Thermal reading"
                          className="object-contain w-full h-full rounded shadow-sm border border-border/50"
                        />
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
