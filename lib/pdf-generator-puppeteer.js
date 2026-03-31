import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

/**
 * Detect the Chromium/Chrome executable path based on the OS
 */
function getChromePath() {
  const platform = process.platform;

  if (platform === 'win32') {
    // Common Chrome locations on Windows
    const candidates = [
      path.join(process.env['PROGRAMFILES'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES'] || '', 'Chromium', 'Application', 'chrome.exe'),
    ];
    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) return candidate;
    }
    // Let Puppeteer use its bundled browser
    return undefined;
  }

  if (platform === 'darwin') {
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    return fs.existsSync(macPath) ? macPath : undefined;
  }

  // Linux
  const linuxCandidates = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
  for (const candidate of linuxCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Generate professional DDR PDF matching Main DDR.pdf structure
 * Uses Puppeteer for high-fidelity HTML-to-PDF conversion with images
 */
export async function generateDDRPDFWithPuppeteer(reportData, baseUrl) {
  let browser;
  let tempHtmlFile;

  try {
    const executablePath = getChromePath();
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--allow-file-access-from-files'
      ]
    };

    // Only set executablePath if we found one; otherwise Puppeteer uses its bundled browser
    if (executablePath) {
      launchOptions.executablePath = executablePath;
      console.log(`Using Chrome at: ${executablePath}`);
    } else {
      console.log('Using Puppeteer bundled browser');
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    const htmlContent = generateReportHTML(reportData);

    // Write to a temporary file to avoid sending massive Base64 strings over Puppeteer's debugging websocket,
    // which commonly causes Navigation Timeouts
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    tempHtmlFile = path.join(os.tmpdir(), `report-${reportData.reportId}-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlFile, htmlContent);

    // Navigate to the local temp file
    await page.goto('file:///' + tempHtmlFile.replace(/\\/g, '/'), {
      waitUntil: 'networkidle0',
      timeout: 60000 // Increased timeout for hefty PDF generation
    });

    // Wait for Chart.js to finish rendering
    await page.waitForFunction('window.chartsReady === true', { timeout: 10000 }).catch(() => {
      console.log('Charts rendering timeout - continuing anyway');
    });

    // Small delay to ensure charts are fully painted
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '12mm',
        bottom: '15mm',
        left: '12mm'
      },
      displayHeaderFooter: false
    });

    return pdf;

  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    throw new Error('Failed to generate PDF with Puppeteer: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (tempHtmlFile) {
      try {
        const fs = require('fs');
        if (fs.existsSync(tempHtmlFile)) fs.unlinkSync(tempHtmlFile);
      } catch (e) {
        console.error('Failed to cleanup temp HTML file:', e);
      }
    }
  }
}

/**
 * Generate Main DDR.pdf style HTML with side-by-side images
 */
function generateReportHTML(reportData) {
  const { propertyInfo, mergedData, analytics, reportId, sampleImages, thermalImages } = reportData;

  // Get status badge based on severity
  const getStatusBadge = (severity) => {
    const badges = {
      'Minor': { text: 'Good', color: '#2DD4BF', bg: '#CCFBF1' },
      'Moderate': { text: 'Moderate', color: '#F59E0B', bg: '#FEF3C7' },
      'Severe': { text: 'Poor', color: '#FB7185', bg: '#FFE4E6' }
    };
    return badges[severity] || badges['Moderate'];
  };

  // Helper: resolve image path to a base64 data URI to prevent Puppeteer local file restrictions
  const resolveImageSrc = (img) => {
    if (!img || !img.path) return null;
    // Build native OS path for existence check
    const nativePath = path.join(process.cwd(), 'public', img.path);
    if (!fs.existsSync(nativePath)) {
      console.log(`  Image not found: ${nativePath}`);
      return null;
    }
    // Check file is non-empty
    const stat = fs.statSync(nativePath);
    if (stat.size === 0) {
      console.log(`  Image is empty (0 bytes): ${nativePath}`);
      return null;
    }
    // Convert to base64 data URI to guarantee it displays securely
    const ext = path.extname(nativePath).toLowerCase().replace('.', '') || 'png';
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const fileData = fs.readFileSync(nativePath);
    const base64Str = fileData.toString('base64');
    return `data:${mimeType};base64,${base64Str}`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DDR Report - ${reportId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #0F172A;
      background: white;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      color: #0F172A;
    }

    /* Header */
    .report-header {
      background: #0F172A;
      color: white;
      padding: 20px 25px;
      margin-bottom: 20px;
    }

    .report-header h1 {
      color: white;
      font-size: 20pt;
      margin-bottom: 5px;
    }

    .report-meta {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #94A3B8;
    }

    /* Property Info */
    .property-section {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .property-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 12px;
    }

    .property-item {
      display: flex;
      gap: 8px;
    }

    .property-label {
      font-weight: 600;
      color: #475569;
      min-width: 120px;
    }

    .property-value {
      color: #0F172A;
    }

    /* Section Titles */
    .section-title {
      font-size: 16pt;
      font-weight: 700;
      color: #0F172A;
      border-bottom: 3px solid #FACC15;
      padding-bottom: 8px;
      margin: 25px 0 15px 0;
    }

    /* Severity Assessment */
    .severity-section {
      background: #F8FAFC;
      border-left: 4px solid #FACC15;
      padding: 15px;
      margin: 15px 0;
    }

    .severity-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 10pt;
      margin: 8px 0;
    }

    /* Area Observations */
    .observation-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 0;
      margin-bottom: 25px;
      page-break-inside: avoid;
      overflow: hidden;
    }

    .observation-header {
      background: #3B82F6;
      color: white;
      padding: 12px 20px;
      font-weight: 700;
      font-size: 12pt;
    }

    .observation-content {
      padding: 20px;
    }

    /* Side-by-Side Images */
    .image-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }

    .image-container {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      overflow: hidden;
      background: #F8FAFC;
    }

    .image-label {
      background: #F1F5F9;
      padding: 8px 12px;
      font-weight: 600;
      font-size: 9pt;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }

    .image-wrapper img {
      max-width: 100%;
      max-height: 250px;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: #94A3B8;
      font-size: 9pt;
      text-align: center;
      padding: 20px;
    }

    /* Thermal Data Table */
    .thermal-table {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .thermal-table td {
      padding: 6px 10px;
      border: 1px solid #E2E8F0;
    }

    .thermal-table td:first-child {
      background: #F8FAFC;
      font-weight: 600;
      width: 35%;
    }

    /* Conflict Alert */
    .conflict-alert {
      background: #FFF1F2;
      border: 2px solid #FB7185;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }

    .conflict-title {
      color: #FB7185;
      font-weight: 700;
      font-size: 11pt;
      margin-bottom: 8px;
    }

    .conflict-content {
      color: #0F172A;
      font-size: 9pt;
      line-height: 1.6;
    }

    /* Recommendations */
    .recommendation-list {
      list-style: none;
      padding: 0;
    }

    .recommendation-list li {
      padding-left: 20px;
      position: relative;
      margin: 8px 0;
    }

    .recommendation-list li:before {
      content: "●";
      color: #FACC15;
      font-weight: bold;
      position: absolute;
      left: 0;
    }

    /* Footer */
    .report-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      color: #64748B;
      font-size: 9pt;
    }

    /* Status Badge */
    .status-badge-container {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9pt;
    }

    .text-section {
      margin: 12px 0;
    }

    .text-label {
      font-weight: 600;
      color: #475569;
      font-size: 9pt;
      margin-bottom: 4px;
    }

    .text-content {
      color: #0F172A;
      line-height: 1.6;
    }

    /* Analytics Charts */
    .analytics-section {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 15px;
    }

    .chart-container {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 15px;
    }

    .chart-title {
      font-weight: 600;
      font-size: 10pt;
      color: #0F172A;
      margin-bottom: 10px;
      text-align: center;
    }

    .chart-canvas {
      max-height: 200px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="report-header">
    <h1>DETAILED DIAGNOSIS REPORT</h1>
    <div class="report-meta">
      <span>Report ID: ${reportId?.substring(0, 8).toUpperCase() || 'N/A'}</span>
      <span>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  </div>

  <!-- Property Information -->
  <div class="property-section">
    <h2 style="font-size: 14pt; margin-bottom: 10px;">Property Information</h2>
    <div class="property-grid">
      <div class="property-item">
        <span class="property-label">Property Type:</span>
        <span class="property-value">${propertyInfo?.type || 'Residential'}</span>
      </div>
      <div class="property-item">
        <span class="property-label">Inspection Date:</span>
        <span class="property-value">${new Date(propertyInfo?.inspectionDate || Date.now()).toLocaleDateString()}</span>
      </div>
      <div class="property-item">
        <span class="property-label">Inspector:</span>
        <span class="property-value">${propertyInfo?.inspector || 'DDR Genius AI'}</span>
      </div>
      <div class="property-item">
        <span class="property-label">Total Areas:</span>
        <span class="property-value">${analytics?.totalAreas || 0}</span>
      </div>
    </div>
  </div>

  <!-- Inspection Analytics Summary -->
  <div class="analytics-section">
    <h2 style="font-size: 14pt; margin-bottom: 10px;">Inspection Analytics Summary</h2>
    <div class="charts-grid">
      <!-- Defect Distribution Chart -->
      <div class="chart-container">
        <div class="chart-title">Defect Distribution</div>
        <canvas id="defectChart" class="chart-canvas"></canvas>
      </div>

      <!-- Temperature Analysis Chart -->
      <div class="chart-container">
        <div class="chart-title">Temperature Analysis</div>
        <canvas id="tempChart" class="chart-canvas"></canvas>
      </div>
    </div>
  </div>

  <!-- Property Issue Summary -->
  <h2 class="section-title">Property Issue Summary</h2>
  <p class="text-content" style="margin-bottom: 15px;">
    ${mergedData?.propertyIssueSummary || 'Comprehensive inspection completed with thermal imaging analysis.'}
  </p>

  <div class="severity-section">
    <h3 style="font-size: 11pt; margin-bottom: 8px;">Severity Assessment</h3>
    <div class="status-badge-container">
      ${(() => {
        const badge = getStatusBadge(mergedData?.severityAssessment?.overall || 'Moderate');
        return `<span class="status-badge" style="background: ${badge.bg}; color: ${badge.color};">${badge.text}</span>`;
      })()}
      <span style="color: #64748B; font-size: 9pt;">${mergedData?.severityAssessment?.reasoning || ''}</span>
    </div>
  </div>

  <!-- Data Conflicts -->
  ${mergedData?.dataConflicts && mergedData.dataConflicts.length > 0 ? `
    <div class="conflict-alert">
      <div class="conflict-title">⚠️ Critical Data Conflicts Detected</div>
      <div class="conflict-content">
        ${mergedData.dataConflicts.map(conflict => `<p style="margin: 5px 0;">• ${conflict}</p>`).join('')}
        <p style="margin-top: 10px; font-style: italic; color: #64748B;">
          These discrepancies may indicate sub-surface issues not visible to the naked eye. Manual verification recommended.
        </p>
      </div>
    </div>
  ` : ''}

  <!-- Area-wise Observations -->
  <h2 class="section-title">Area-wise Observations</h2>

  ${(mergedData?.areaWiseObservations || []).map((obs, index) => {
    const badge = getStatusBadge(obs.severity || 'Moderate');

    // Find matching images
    const visualPage = obs.visualImageRef; // No fallback to arbitrary pages!
    const thermalPage = obs.thermalImageRef || (index + 1);
    
    const visualImg = visualPage ? (sampleImages?.find(img => img.page === visualPage) || null) : null;
    const thermalImg = thermalImages?.find(img => img.page === thermalPage) || null;

    // Resolve to file:// URLs
    const visualSrc = resolveImageSrc(visualImg);
    const thermalSrc = resolveImageSrc(thermalImg);

    return `
      <div class="observation-card">
        <div class="observation-header">${obs.area || 'Unknown Area'}</div>
        <div class="observation-content">

          <!-- Visual Observation Text -->
          <div class="text-section">
            <div class="text-label">Visual Observation:</div>
            <div class="text-content">${obs.visualObservation || 'Not Available'}</div>
          </div>

          <!-- Side-by-Side Images -->
          <div class="image-comparison">
            <!-- Visual Image -->
            <div class="image-container">
              <div class="image-label">Visual Inspection Photo</div>
              <div class="image-wrapper">
                ${visualSrc ? `<img src="${visualSrc}" alt="Visual observation" />` :
                  `<div class="image-placeholder">
                    <div style="background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 30px;">
                      <p style="color: #64748B; font-weight: 600;">Image Not Available</p>
                    </div>
                  </div>`}
              </div>
            </div>

            <!-- Thermal Image -->
            <div class="image-container">
              <div class="image-label">Thermal Imaging</div>
              <div class="image-wrapper">
                ${thermalSrc ? `<img src="${thermalSrc}" alt="Thermal reading" />` :
                  `<div class="image-placeholder">
                    <div style="background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 30px;">
                      <p style="color: #64748B; font-weight: 600;">Image Not Available</p>
                    </div>
                  </div>`}
              </div>
              ${typeof obs.thermalReading === 'object' && obs.thermalReading ? `
                <table class="thermal-table">
                  <tr>
                    <td>Hotspot:</td>
                    <td>${obs.thermalReading.hotspot || 'N/A'}°C</td>
                  </tr>
                  <tr>
                    <td>Coldspot:</td>
                    <td>${obs.thermalReading.coldspot || 'N/A'}°C</td>
                  </tr>
                </table>
              ` : ''}
            </div>
          </div>

          <!-- Thermal Analysis -->
          <div class="text-section">
            <div class="text-label">Thermal Analysis:</div>
            <div class="text-content">
              ${typeof obs.thermalReading === 'object' && obs.thermalReading?.analysis
                ? obs.thermalReading.analysis
                : 'Not Available'}
            </div>
          </div>

          <!-- Status Badge -->
          <div class="status-badge-container" style="margin-top: 12px;">
            <span class="status-badge" style="background: ${badge.bg}; color: ${badge.color};">
              ${badge.text}
            </span>
            <span style="color: #64748B; font-size: 9pt;">
              Type: ${obs.defectType || 'N/A'}
            </span>
          </div>

          <!-- Individual Conflict -->
          ${obs.conflictDetected ? `
            <div class="conflict-alert" style="margin-top: 12px;">
              <div class="conflict-title">⚠️ Conflict Detected</div>
              <div class="conflict-content">${obs.conflictDescription || 'Visual and thermal data mismatch'}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('')}

  <!-- Recommended Actions -->
  <h2 class="section-title">Recommended Actions</h2>
  <ul class="recommendation-list">
    ${(mergedData?.recommendedActions || ['Conduct detailed inspection', 'Monitor affected areas']).map(action =>
      `<li>${action}</li>`
    ).join('')}
  </ul>

  <!-- Footer -->
  <div class="report-footer">
    <p><strong>DDR Genius</strong> - AI-Powered Diagnostic Reports</p>
    <p style="margin-top: 5px;">Made by Gaurav Agrawal</p>
  </div>

  <!-- Chart.js Rendering Script -->
  <script>
    // Prepare analytics data
    const analyticsData = ${JSON.stringify(analytics || {})};
    const mergedData = ${JSON.stringify(mergedData || {})};

    // Chart theme colors
    const chartColors = {
      yellow: '#FACC15',
      blue: '#3B82F6',
      rose: '#FB7185',
      teal: '#2DD4BF',
      amber: '#F59E0B',
      slate: '#64748B'
    };

    // Wait for Chart.js to load
    window.addEventListener('load', function() {
      // 1. Defect Distribution Pie Chart
      const defectCtx = document.getElementById('defectChart');
      if (defectCtx && analyticsData.issueDistribution) {
        const defectData = analyticsData.issueDistribution;
        const labels = Object.keys(defectData);
        const values = Object.values(defectData);

        new Chart(defectCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: [
                chartColors.yellow,
                chartColors.blue,
                chartColors.rose,
                chartColors.teal,
                chartColors.amber
              ],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 9, family: 'Inter' },
                  padding: 8
                }
              },
              title: {
                display: false
              }
            },
            animation: {
              duration: 800
            }
          }
        });
      }

      // 2. Temperature Analysis Bar Chart
      const tempCtx = document.getElementById('tempChart');
      if (tempCtx && mergedData.areaWiseObservations) {
        const observations = mergedData.areaWiseObservations || [];
        const areas = observations.map(obs => obs.area?.substring(0, 15) || 'Area');
        const hotspots = observations.map(obs => {
          const thermal = obs.thermalReading;
          return thermal && typeof thermal.hotspot === 'number' ? thermal.hotspot : null;
        });
        const coldspots = observations.map(obs => {
          const thermal = obs.thermalReading;
          return thermal && typeof thermal.coldspot === 'number' ? thermal.coldspot : null;
        });

        new Chart(tempCtx, {
          type: 'bar',
          data: {
            labels: areas,
            datasets: [
              {
                label: 'Hotspot (°C)',
                data: hotspots,
                backgroundColor: chartColors.rose,
                borderColor: chartColors.rose,
                borderWidth: 1
              },
              {
                label: 'Coldspot (°C)',
                data: coldspots,
                backgroundColor: chartColors.blue,
                borderColor: chartColors.blue,
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Temperature (°C)',
                  font: { size: 9 }
                },
                ticks: {
                  font: { size: 8 }
                }
              },
              x: {
                ticks: {
                  font: { size: 8 },
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 9, family: 'Inter' },
                  padding: 8
                }
              },
              title: {
                display: false
              }
            },
            animation: {
              duration: 800
            }
          }
        });
      }

      // Signal that charts are rendered
      window.chartsReady = true;
    });
  </script>
</body>
</html>
  `;
}
