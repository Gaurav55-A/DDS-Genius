import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractTextFromPDF, extractImagesFromPDF, parseThermalData, parseVisualObservations } from '@/lib/pdf-parser';
import { matchObservationsWithThermal, generateAnalytics } from '@/lib/ai-matcher';
import { generateDDRPDF } from '@/lib/pdf-generator';
import { generateDDRPDFWithPuppeteer } from '@/lib/pdf-generator-puppeteer';

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "DDR Genius API",
        version: "1.0.0",
        endpoints: ['/process', '/reports', '/analytics'],
        database: "Supabase"
      }));
    }

    // POST /api/process - Process uploaded PDFs
    if (route === '/process' && method === 'POST') {
      try {
        const formData = await request.formData();
        const sampleReport = formData.get('sampleReport');
        const thermalImages = formData.get('thermalImages');

        if (!sampleReport || !thermalImages) {
          return handleCORS(NextResponse.json(
            { error: 'Both sampleReport and thermalImages are required' },
            { status: 400 }
          ));
        }

        // Generate unique report ID
        const reportId = uuidv4();

        // Convert files to buffers
        const sampleBuffer = Buffer.from(await sampleReport.arrayBuffer());
        const thermalBuffer = Buffer.from(await thermalImages.arrayBuffer());

        // Extract text from PDFs
        console.log('Extracting text from PDFs...');
        const sampleText = await extractTextFromPDF(sampleBuffer);
        const thermalText = await extractTextFromPDF(thermalBuffer);

        // Extract images
        console.log('Extracting images from PDFs...');
        const sampleImages = await extractImagesFromPDF(sampleBuffer, reportId, 'visual');
        const thermalImagesExtracted = await extractImagesFromPDF(thermalBuffer, reportId, 'thermal');

        // Parse data
        console.log('Parsing data...');
        const thermalReadings = parseThermalData(thermalText);
        const visualObservations = parseVisualObservations(sampleText);

        console.log('Visual observations:', visualObservations.length);
        console.log('Thermal readings:', thermalReadings.length);

        // Use AI to match observations with thermal data
        console.log('Running AI matching...');
        let mergedData;
        try {
          mergedData = await matchObservationsWithThermal(
            visualObservations,
            thermalReadings,
            sampleText,
            thermalText
          );
        } catch (aiError) {
          console.error('AI matching error:', aiError);
          // Fallback to basic merging if AI fails
          mergedData = {
            propertyIssueSummary: 'Data extracted from inspection reports',
            areaWiseObservations: visualObservations.map((obs, idx) => ({
              area: obs.area || obs.rooms?.[0] || 'Unknown',
              visualObservation: obs.description,
              thermalReading: thermalReadings[idx] || { hotspot: 'Not Available', coldspot: 'Not Available' },
              defectType: obs.defectType || 'Other',
              severity: 'Moderate',
              images: sampleImages.slice(0, 2).map(img => img.filename)
            })),
            probableRootCause: 'Not Available',
            severityAssessment: { overall: 'Moderate', reasoning: 'Based on visual inspection' },
            recommendedActions: ['Further investigation required'],
            additionalNotes: 'AI processing encountered issues',
            missingOrUnclearInfo: ['AI matching failed - manual review recommended'],
            dataConflicts: []
          };
        }

        // Generate analytics
        const analytics = generateAnalytics(mergedData);

        // Extract property info from sample text
        const propertyInfo = {
          type: 'Flat',
          floors: 11,
          inspectionDate: new Date().toISOString(),
          inspector: 'DDR Genius AI'
        };

        // Save to database
        const reportDoc = {
          reportId,
          propertyInfo,
          visualObservations,
          thermalReadings,
          sampleImages,
          thermalImages: thermalImagesExtracted,
          mergedData,
          analytics,
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Save to Supabase
        const { data, error } = await supabase
          .from('reports')
          .insert([reportDoc])
          .select();

        if (error) {
          throw new Error('Failed to save report to Supabase: ' + error.message);
        }

        console.log('Report saved successfully to Supabase:', reportId);

        return handleCORS(NextResponse.json({
          reportId,
          message: 'Report processed successfully',
          analytics,
          mergedData
        }));

      } catch (error) {
        console.error('Processing error:', error);
        return handleCORS(NextResponse.json(
          { error: 'Failed to process reports: ' + error.message },
          { status: 500 }
        ));
      }
    }

    // GET /api/reports - Get all reports
    if (route === '/reports' && method === 'GET') {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) {
        return handleCORS(NextResponse.json(
          { error: 'Failed to fetch reports: ' + error.message },
          { status: 500 }
        ));
      }

      return handleCORS(NextResponse.json(reports || []));
    }

    // GET /api/reports/:id - Get specific report
    if (route.startsWith('/reports/') && method === 'GET') {
      const reportId = path[1];
      
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reportId', reportId)
        .single();

      if (error || !report) {
        return handleCORS(NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        ));
      }

      return handleCORS(NextResponse.json(report));
    }

    // GET /api/analytics - Get aggregated analytics
    if (route === '/analytics' && method === 'GET') {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'completed');

      if (error) {
        return handleCORS(NextResponse.json(
          { error: 'Failed to fetch analytics: ' + error.message },
          { status: 500 }
        ));
      }

      if (!reports || reports.length === 0) {
        return handleCORS(NextResponse.json({
          totalReports: 0,
          totalAreas: 0,
          totalDefects: 0,
          issueDistribution: {},
          severityDistribution: { Minor: 0, Moderate: 0, Severe: 0 },
          temperatureStats: {
            avgHotspot: 0,
            avgColdspot: 0,
            maxHotspot: 0,
            minColdspot: 0,
            readings: []
          }
        }));
      }

      // Aggregate analytics from all reports
      const aggregatedAnalytics = {
        totalReports: reports.length,
        totalAreas: 0,
        totalDefects: 0,
        issueDistribution: {},
        severityDistribution: { Minor: 0, Moderate: 0, Severe: 0 },
        temperatureStats: {
          avgHotspot: 0,
          avgColdspot: 0,
          maxHotspot: 0,
          minColdspot: 100,
          readings: []
        }
      };

      reports.forEach(report => {
        const analytics = report.analytics;
        if (!analytics) return;

        aggregatedAnalytics.totalAreas += analytics.totalAreas || 0;
        aggregatedAnalytics.totalDefects += analytics.totalDefects || 0;

        // Merge issue distribution
        Object.entries(analytics.issueDistribution || {}).forEach(([key, value]) => {
          aggregatedAnalytics.issueDistribution[key] = 
            (aggregatedAnalytics.issueDistribution[key] || 0) + value;
        });

        // Merge severity distribution
        Object.entries(analytics.severityDistribution || {}).forEach(([key, value]) => {
          if (aggregatedAnalytics.severityDistribution[key] !== undefined) {
            aggregatedAnalytics.severityDistribution[key] += value;
          }
        });

        // Merge temperature stats
        if (analytics.temperatureStats?.readings) {
          aggregatedAnalytics.temperatureStats.readings.push(
            ...analytics.temperatureStats.readings
          );
        }
      });

      // Calculate temperature averages
      if (aggregatedAnalytics.temperatureStats.readings.length > 0) {
        let hotspotSum = 0;
        let coldspotSum = 0;
        let validReadings = 0;

        aggregatedAnalytics.temperatureStats.readings.forEach(reading => {
          if (reading.hotspot && !isNaN(reading.hotspot)) {
            hotspotSum += reading.hotspot;
            aggregatedAnalytics.temperatureStats.maxHotspot = Math.max(
              aggregatedAnalytics.temperatureStats.maxHotspot,
              reading.hotspot
            );
          }
          if (reading.coldspot && !isNaN(reading.coldspot)) {
            coldspotSum += reading.coldspot;
            aggregatedAnalytics.temperatureStats.minColdspot = Math.min(
              aggregatedAnalytics.temperatureStats.minColdspot,
              reading.coldspot
            );
          }
          if (reading.hotspot && reading.coldspot) {
            validReadings++;
          }
        });

        if (validReadings > 0) {
          aggregatedAnalytics.temperatureStats.avgHotspot = hotspotSum / validReadings;
          aggregatedAnalytics.temperatureStats.avgColdspot = coldspotSum / validReadings;
        }
      }

      // Find most common issue
      if (Object.keys(aggregatedAnalytics.issueDistribution).length > 0) {
        aggregatedAnalytics.mostCommonIssue = Object.entries(aggregatedAnalytics.issueDistribution)
          .sort(([, a], [, b]) => b - a)[0][0];
      }

      return handleCORS(NextResponse.json(aggregatedAnalytics));
    }

    // POST /api/export-pdf - Generate and download DDR PDF
    if (route === '/export-pdf' && method === 'POST') {
      try {
        const body = await request.json();
        const { reportId, usePuppeteer = true } = body;

        if (!reportId) {
          return handleCORS(NextResponse.json(
            { error: 'reportId is required' },
            { status: 400 }
          ));
        }

        const { data: report, error } = await supabase
          .from('reports')
          .select('*')
          .eq('reportId', reportId)
          .single();

        if (error || !report) {
          return handleCORS(NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          ));
        }

        // Generate PDF using Puppeteer (high-fidelity) or pdfkit (legacy)
        let pdfBuffer;
        if (usePuppeteer) {
          console.log('Generating PDF with Puppeteer...');
          pdfBuffer = await generateDDRPDFWithPuppeteer(report, process.env.NEXT_PUBLIC_BASE_URL);
        } else {
          console.log('Generating PDF with pdfkit...');
          pdfBuffer = await generateDDRPDF(report);
        }

        // Return PDF as downloadable file
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="DDR_Report_${reportId}.pdf"`,
            'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*'
          }
        });

      } catch (error) {
        console.error('PDF export error:', error);
        return handleCORS(NextResponse.json(
          { error: 'Failed to generate PDF: ' + error.message },
          { status: 500 }
        ));
      }
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    ));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
