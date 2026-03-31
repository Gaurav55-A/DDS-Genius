'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueDistributionChart, TemperatureAnalysisChart, SummaryStats, SeverityChart } from '@/components/analytics-charts';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-sm text-slate-400">Comprehensive insights across all reports</p>
            </div>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Analytics Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Stats */}
        <SummaryStats analytics={analytics} />

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <IssueDistributionChart data={analytics?.issueDistribution} />
          <SeverityChart data={analytics?.severityDistribution} />
        </div>

        <div className="grid lg:grid-cols-1 gap-6">
          <TemperatureAnalysisChart data={analytics?.temperatureStats} />
        </div>

        {/* Additional Info */}
        {analytics?.totalReports > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Report Summary</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Total Reports Processed</p>
                <p className="text-2xl font-bold text-white mt-1">{analytics.totalReports}</p>
              </div>
              <div>
                <p className="text-slate-400">Average Defects per Report</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(analytics.totalDefects / analytics.totalReports).toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Most Common Issue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analytics.mostCommonIssue || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {analytics?.totalReports === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No reports processed yet. Upload your first inspection to see analytics.</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Upload Reports
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
