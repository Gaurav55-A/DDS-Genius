import puppeteer from 'puppeteer';

/**
 * Generate professional DDR PDF using Puppeteer for high-fidelity HTML-to-PDF conversion
 * This preserves all CSS styling, fonts, and layout
 */
export async function generateDDRPDFWithPuppeteer(reportData, baseUrl) {
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    
    // Generate HTML content
    const htmlContent = generateReportHTML(reportData);
    
    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF with high quality settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; text-align: center; color: #64748B; margin-top: 10px;">
          <span>Made by Gaurav Agrawal | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    return pdf;
    
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    throw new Error('Failed to generate PDF with Puppeteer: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate complete HTML for the DDR report with inline CSS
 */
function generateReportHTML(reportData) {
  const { propertyInfo, mergedData, analytics, reportId } = reportData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DDR Report - ${reportId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #0F172A;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
    }
    
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }
    
    .header {
      background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%);
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32pt;
      color: #0F172A;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 14pt;
      color: #334155;
    }
    
    .property-info {
      padding: 40px;
      flex-grow: 1;
    }
    
    .property-info h2 {
      font-size: 20pt;
      margin-bottom: 20px;
      color: #0F172A;
    }
    
    .info-table {
      width: 100%;
      margin-top: 20px;
    }
    
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .info-label {
      width: 200px;
      font-weight: 500;
      color: #64748B;
    }
    
    .info-value {
      flex-grow: 1;
      font-weight: 600;
      color: #0F172A;
    }
    
    .section {
      padding: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18pt;
      margin-bottom: 16px;
      color: #0F172A;
      border-bottom: 2px solid #FACC15;
      padding-bottom: 8px;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12pt;
      margin: 16px 0;
    }
    
    .severity-minor { background: #2DD4BF; color: #0F172A; }
    .severity-moderate { background: #F59E0B; color: white; }
    .severity-severe { background: #FB7185; color: white; }
    
    .area-observation {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .area-header {
      background: #3B82F6;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13pt;
      margin-bottom: 12px;
    }
    
    .observation-content {
      padding: 0 20px;
    }
    
    .observation-section {
      margin: 12px 0;
    }
    
    .observation-label {
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    
    .observation-text {
      color: #334155;
      line-height: 1.8;
    }
    
    .conflict-alert {
      background: #FEF2F2;
      border: 2px solid #FB7185;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .conflict-title {
      font-weight: 700;
      color: #FB7185;
      margin-bottom: 8px;
      font-size: 12pt;
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
    }
    
    .bullet-list li {
      padding-left: 24px;
      position: relative;
      margin: 8px 0;
    }
    
    .bullet-list li:before {
      content: "●";
      color: #FACC15;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    .limitations {
      background: #F1F5F9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .footer-box {
      background: #F1F5F9;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 40px;
    }
    
    .text-muted {
      color: #64748B;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #E2E8F0;
    }
    
    th {
      background: #F8FAFC;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="header">
      <h1>DETAILED DIAGNOSIS REPORT</h1>
      <div class="subtitle">Property Inspection & Thermal Analysis</div>
    </div>
    
    <div class="property-info">
      <h2>Property Information</h2>
      <div class="info-table">
        <div class="info-row">
          <div class="info-label">Property Type:</div>
          <div class="info-value">${propertyInfo?.type || 'Residential'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Inspection Date:</div>
          <div class="info-value">${new Date(propertyInfo?.inspectionDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Inspector:</div>
          <div class="info-value">${propertyInfo?.inspector || 'DDR Genius AI'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Report ID:</div>
          <div class="info-value">${reportId?.substring(0, 8).toUpperCase() || 'N/A'}</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Property Issue Summary -->
  <div class="section">
    <h2 class="section-title">Property Issue Summary</h2>
    <p class="observation-text">
      ${mergedData?.propertyIssueSummary || 'Comprehensive inspection completed with thermal imaging analysis.'}
    </p>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14pt;">Severity Assessment</h3>
    <div class="severity-badge severity-${(mergedData?.severityAssessment?.overall || 'Moderate').toLowerCase()}">
      ${mergedData?.severityAssessment?.overall || 'Moderate'}
    </div>
    <p class="observation-text">
      ${mergedData?.severityAssessment?.reasoning || 'Based on visual and thermal inspection'}
    </p>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14pt;">Probable Root Cause</h3>
    <p class="observation-text">
      ${mergedData?.probableRootCause || 'Further investigation required'}
    </p>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14pt;">Recommended Actions</h3>
    <ul class="bullet-list">
      ${(mergedData?.recommendedActions || ['Conduct detailed inspection', 'Monitor affected areas']).map(action => `<li>${action}</li>`).join('')}
    </ul>
  </div>
  
  <!-- Area-wise Observations -->
  <div class="section" style="page-break-before: always;">
    <h2 class="section-title">Area-wise Observations</h2>
    
    ${(mergedData?.areaWiseObservations || []).map((obs, index) => `
      <div class="area-observation">
        <div class="area-header">${obs.area || 'Unknown Area'}</div>
        <div class="observation-content">
          <div class="observation-section">
            <div class="observation-label">Visual Observation:</div>
            <div class="observation-text">${obs.visualObservation || 'Not Available'}</div>
          </div>
          
          <div class="observation-section">
            <div class="observation-label">Thermal Analysis:</div>
            <div class="observation-text">
              ${typeof obs.thermalReading === 'object' && obs.thermalReading 
                ? `Hotspot: ${obs.thermalReading.hotspot || 'N/A'}°C | Coldspot: ${obs.thermalReading.coldspot || 'N/A'}°C<br>${obs.thermalReading.analysis || ''}`
                : 'Not Available'}
            </div>
          </div>
          
          <div class="observation-section">
            <div class="text-muted" style="font-size: 10pt;">
              Type: ${obs.defectType || 'N/A'} | Severity: ${obs.severity || 'N/A'}
            </div>
          </div>
          
          ${obs.conflictDetected ? `
            <div class="conflict-alert">
              <div class="conflict-title">⚠️ Data Conflict Detected</div>
              <div>${obs.conflictDescription || 'Visual and thermal data mismatch'}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  
  <!-- Analysis & Additional Notes -->
  <div class="section" style="page-break-before: always;">
    <h2 class="section-title">Analysis & Additional Notes</h2>
    <p class="observation-text">
      ${mergedData?.additionalNotes || 'All findings documented above.'}
    </p>
    
    ${mergedData?.missingOrUnclearInfo && mergedData.missingOrUnclearInfo.length > 0 ? `
      <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14pt;">Missing or Unclear Information</h3>
      <ul class="bullet-list">
        ${mergedData.missingOrUnclearInfo.map(item => `<li>${item}</li>`).join('')}
      </ul>
    ` : ''}
    
    ${mergedData?.dataConflicts && mergedData.dataConflicts.length > 0 ? `
      <div class="conflict-alert" style="margin-top: 24px;">
        <div class="conflict-title">Critical Data Conflicts</div>
        <ul class="bullet-list" style="margin-top: 12px;">
          ${mergedData.dataConflicts.map(conflict => `<li style="color: #0F172A;">${conflict}</li>`).join('')}
        </ul>
        <div style="margin-top: 12px; font-size: 10pt; font-style: italic; color: #64748B;">
          ⚠️ These discrepancies may indicate sub-surface issues not visible to the naked eye. Manual verification recommended.
        </div>
      </div>
    ` : ''}
  </div>
  
  <!-- Limitations -->
  <div class="section" style="page-break-before: always;">
    <h2 class="section-title">Limitations & Disclaimer</h2>
    <ul class="bullet-list">
      <li>This report is based on visual inspection and thermal imaging analysis.</li>
      <li>Findings are limited to accessible areas at the time of inspection.</li>
      <li>Some defects may not be visible or detectable through thermal imaging.</li>
      <li>This report does not constitute a structural engineering assessment.</li>
      <li>Further investigation may be required for areas marked with conflicts.</li>
      <li>Recommendations should be implemented by qualified professionals.</li>
    </ul>
    
    <div class="footer-box">
      <div style="font-weight: 700; margin-bottom: 8px;">Report Generated By</div>
      <div class="text-muted" style="font-size: 10pt;">DDR Genius - AI-Powered Diagnostic Reports</div>
      <div class="text-muted" style="font-size: 10pt; margin-top: 4px;">Made by Gaurav Agrawal</div>
    </div>
  </div>
</body>
</html>
  `;
}

export { generateDDRPDFWithPuppeteer };
