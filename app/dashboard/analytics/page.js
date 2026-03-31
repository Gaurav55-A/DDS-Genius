'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Activity, AlertTriangle, Thermometer, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { KPICard } from '@/components/kpi-card';
import { ConflictAlert } from '@/components/conflict-alert';
import { IssueDistributionChart, TemperatureAnalysisChart, SeverityChart } from '@/components/analytics-charts';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-electric-blue mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Sample conflicts for demonstration (in production, this would come from backend)
  const sampleConflicts = analytics?.totalReports > 0 ? [
    {
      area: 'Hallway Skirting',
      description: 'Visual inspection shows no visible dampness, but thermal imaging detects cold spot at 20.5°C',
      visualData: 'No visible moisture',
      thermalData: '20.5°C cold spot detected'
    }
  ] : [];

  const healthIndex = analytics?.totalReports > 0 
    ? Math.round(((analytics.totalAreas - analytics.totalDefects) / analytics.totalAreas) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-minimal bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground font-body">Comprehensive insights across all reports</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="border-minimal"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Analytics Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards - 4 Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Health Index"
            value={`${healthIndex}%`}
            description="Overall property condition"
            icon={Activity}
            progress={healthIndex}
            color="teal"
            trend={5}
          />
          <KPICard
            title="Total Defects"
            value={analytics?.totalDefects || 0}
            description="Issues identified"
            icon={AlertTriangle}
            color="rose"
            trend={-3}
          />
          <KPICard
            title="Avg Hotspot"
            value={`${(analytics?.temperatureStats?.avgHotspot || 0).toFixed(1)}°C`}
            description="Maximum temperature"
            icon={Thermometer}
            color="amber"
          />
          <KPICard
            title="Total Areas"
            value={analytics?.totalAreas || 0}
            description="Distinct areas analyzed"
            icon={TrendingUp}
            progress={analytics?.totalAreas > 0 ? 100 : 0}
            color="blue"
          />
        </div>

        {/* Conflict Alert */}
        {sampleConflicts.length > 0 && (
          <ConflictAlert 
            title="Critical Conflicts Detected"
            conflicts={sampleConflicts}
          />
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <IssueDistributionChart data={analytics?.issueDistribution} />
          <SeverityChart data={analytics?.severityDistribution} />
        </div>

        <div className="grid lg:grid-cols-1 gap-6">
          <TemperatureAnalysisChart data={analytics?.temperatureStats} />
        </div>

        {/* Additional Info */}
        {analytics?.totalReports > 0 ? (
          <div className="bg-card border-minimal rounded-lg p-6">
            <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Report Summary</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm font-body">
              <div>
                <p className="text-muted-foreground">Total Reports Processed</p>
                <p className="text-3xl font-bold font-heading text-foreground mt-1">{analytics.totalReports}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average Defects per Report</p>
                <p className="text-3xl font-bold font-heading text-foreground mt-1">
                  {(analytics.totalDefects / analytics.totalReports).toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Most Common Issue</p>
                <p className="text-3xl font-bold font-heading text-electric-blue mt-1">
                  {analytics.mostCommonIssue || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border-2 border-electric-yellow/20 rounded-lg p-12 text-center">
            <div className="icon-glow-yellow h-16 w-16 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-electric-yellow" />
            </div>
            <p className="text-muted-foreground text-lg font-body mb-4">No reports processed yet. Upload your first inspection to see analytics.</p>
            <Button onClick={() => router.push('/')} className="bg-electric-yellow hover:bg-electric-yellow/90 text-slate-950">
              Upload Reports
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
