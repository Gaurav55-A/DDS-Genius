import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

/**
 * Safely import pdf-parse to avoid the require-time fs.readFileSync crash.
 */
async function getPdfParser() {
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    return pdfParse;
  } catch {
    const pdfParse = (await import('pdf-parse')).default;
    return pdfParse;
  }
}

/**
 * Extract text content from PDF buffer
 */
export async function extractTextFromPDF(buffer) {
  try {
    const pdfParse = await getPdfParser();
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

/**
 * Extract real images from PDF pages using pdf-to-img (pure JS, no native deps).
 * Falls back to SVG placeholders on failure.
 */
export async function extractImagesFromPDF(buffer, reportId, type = 'visual') {
  let uploadDir;
  if (process.env.VERCEL) {
    // Vercel filesystem is read-only; use /tmp for processing
    const os = require('os');
    uploadDir = path.join(os.tmpdir(), 'uploads', reportId);
  } else {
    uploadDir = path.join(process.cwd(), 'public', 'uploads', reportId);
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const images = [];

  // --- Primary: pdf-to-img standalone Node script ---
  try {
    console.log(`[${type}] Extracting via external script...`);
    const { execSync } = require('child_process');
    const tempFile = path.join(uploadDir, `${type}_temp.pdf`);
    fs.writeFileSync(tempFile, buffer);
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-images.js');
    const output = execSync(`node "${scriptPath}" "${tempFile}" "${uploadDir}" "${type}"`, { encoding: 'utf-8', stdio: 'pipe' });
    
    fs.unlinkSync(tempFile); // Cleanup

    // Script prints out JSON string of extracted images
    const lines = output.split('\n');
    const jsonStr = lines.find(l => l.startsWith('[') && l.endsWith(']'));
    if (jsonStr) {
      const stats = JSON.parse(jsonStr);
      for (const stat of stats) {
        const relativePath = process.env.VERCEL 
          ? path.join(uploadDir, stat.filename) // Absolute path for Vercel
          : `/uploads/${reportId}/${stat.filename}`; // Relative path for Local

        images.push({
          filename: stat.filename,
          path: relativePath,
          page: stat.page,
          type,
          format: 'png',
          size: stat.size
        });
      }
      if (images.length > 0) {
        console.log(`✓ Extracted ${images.length} pages from ${type} PDF. Uploading to Supabase...`);
        
        const uploadedImages = [];
        for (const img of images) {
          const filePath = process.env.VERCEL ? img.path : path.join(process.cwd(), 'public', img.path);
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `${reportId}/${img.filename}`;
            
            const { error: uploadError } = await supabase.storage
              .from('report-images')
              .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                upsert: true
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('report-images')
                .getPublicUrl(storagePath);
                
              uploadedImages.push({
                ...img,
                path: publicUrl // Store the public URL instead of local path
              });
            } else {
              console.error(`Supabase upload failed for ${img.filename}:`, uploadError.message);
              // Maintain local path as fallback if upload fails
              uploadedImages.push(img);
            }
          }
        }
        return uploadedImages;
      }
    }
  } catch (error) {
    console.warn(`[${type}] External extraction failed:`, error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }

  // --- Fallback: SVG placeholders ---
  console.log(`[${type}] Creating SVG placeholders...`);
  try {
    const pdfParse = await getPdfParser();
    const pdfData = await pdfParse(buffer);
    const pageCount = pdfData.numpages;

    for (let i = 1; i <= pageCount; i++) {
      const filename = `${type}_page${i}.svg`;
      const imagePath = `/uploads/${reportId}/${filename}`;
      const fullPath = path.join(uploadDir, filename);

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F1F5F9"/>
  <rect x="10" y="10" width="380" height="280" fill="white" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="5,5"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748B">
    ${type === 'visual' ? 'Visual Inspection' : 'Thermal Imaging'} - Page ${i}
  </text>
</svg>`;
      fs.writeFileSync(fullPath, svgContent);
      images.push({ filename, path: imagePath, page: i, type, format: 'svg' });
    }
    console.log(`✓ Created ${images.length} SVG placeholders for ${type}`);
  } catch (error) {
    console.error('Error creating placeholders:', error);
  }

  return images;
}

/**
 * Parse thermal readings from the Thermal Images PDF.
 * Each thermal entry follows this pattern:
 *   Hotspot : XX.X °C
 *   Coldspot : XX.X °C
 *   Emissivity : 0.94
 *   Reflected temperature : XX °C
 *   Thermal image : RB02380X.JPG
 *   (page number at end)
 */
export function parseThermalData(text) {
  const readings = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Hotspot
    const hotMatch = line.match(/Hotspot\s*:\s*([0-9.]+)\s*°?\s*C/i);
    if (hotMatch) {
      // If we already have a hotspot, save previous and start new
      if (current.hotspot !== undefined) {
        readings.push({ ...current });
        current = {};
      }
      current.hotspot = parseFloat(hotMatch[1]);
      continue;
    }

    // Coldspot
    const coldMatch = line.match(/Coldspot\s*:\s*([0-9.]+)\s*°?\s*C/i);
    if (coldMatch) {
      current.coldspot = parseFloat(coldMatch[1]);
      continue;
    }

    // Emissivity
    const emissMatch = line.match(/Emissivity\s*:\s*([0-9.]+)/i);
    if (emissMatch) {
      current.emissivity = parseFloat(emissMatch[1]);
      continue;
    }

    // Reflected temperature
    const reflMatch = line.match(/Reflected\s*temperature\s*:\s*([0-9.]+)\s*°?\s*C/i);
    if (reflMatch) {
      current.reflectedTemp = parseFloat(reflMatch[1]);
      continue;
    }

    // Thermal image filename
    const fileMatch = line.match(/Thermal\s*image\s*:\s*([A-Z0-9]+\.(JPG|PNG))/i);
    if (fileMatch) {
      current.filename = fileMatch[1];
      continue;
    }

    // Date pattern
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{2,4})$/);
    if (dateMatch) {
      current.date = dateMatch[1];
      continue;
    }

    // Page number (standalone number = thermal page index)
    const pageMatch = line.match(/^(\d{1,3})$/);
    if (pageMatch && current.hotspot !== undefined) {
      current.thermalPageNo = parseInt(pageMatch[1]);
    }
  }

  // Push last entry
  if (current.hotspot !== undefined) {
    readings.push(current);
  }

  return readings;
}

/**
 * Parse visual observations from the Main DDR PDF.
 * This parser is designed for UrbanRoof DDR format:
 *  - Section 3: VISUAL OBSERVATION AND READINGS
 *  - Areas: BATHROOMS, BALCONY, TERRACE, EXTERNAL WALL, etc.
 *  - Sub-sections: 3.2, 3.3, 3.4... for negative/positive side inputs
 *  - Section 4: ANALYSIS & SUGGESTIONS with sub-areas like 4.5.1, 4.5.2...
 */
export function parseVisualObservations(text) {
  const observations = [];
  const lines = text.split('\n');

  // --- Phase 1: Extract Section 3 Summary ---
  let inSection3 = false;
  let summaryAreas = {};
  let currentSummaryArea = null;
  let summaryBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect Section 3 start
    if (line.match(/SECTION\s*3\s+VISUAL\s+OBSERVATION/i)) {
      inSection3 = true;
      continue;
    }

    // Detect Section 4 start (end of Section 3)
    if (line.match(/SECTION\s*4\s+ANALYSIS/i)) {
      // Save last summary area
      if (currentSummaryArea && summaryBuffer.trim()) {
        summaryAreas[currentSummaryArea] = summaryBuffer.trim();
      }
      inSection3 = false;
      continue;
    }

    if (!inSection3) continue;

    // Detect area headers in the summary section
    const areaMatch = line.match(/^(BATHROOMS?|BALCON(?:Y|IES)|TERRACE|EXTERNAL\s*WALLS?|MASTER\s*BEDROOM|COMMON\s*BATHROOM|HALL|KITCHEN|PARKING|LIVING\s*ROOM|STAIRCASE|CORRIDOR)\s*:?\s*$/i);
    if (areaMatch) {
      // Save previous area
      if (currentSummaryArea && summaryBuffer.trim()) {
        summaryAreas[currentSummaryArea] = summaryBuffer.trim();
      }
      currentSummaryArea = areaMatch[1].trim();
      summaryBuffer = '';
      continue;
    }

    // Accumulate summary text
    if (currentSummaryArea && line.length > 10) {
      summaryBuffer += line + ' ';
    }
  }

  // --- Phase 2: Extract Section 4 Analysis sub-areas ---
  let inSection4 = false;
  let pastTOC = false; // Flag to skip TOC entries
  let analysisAreas = [];
  let currentAnalysis = null;
  let analysisBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/SECTION\s*4\s+ANALYSIS/i)) {
      inSection4 = true;
      continue;
    }
    if (line.match(/SECTION\s*5/i)) {
      if (currentAnalysis) {
        currentAnalysis.description = analysisBuffer.trim();
        analysisAreas.push({ ...currentAnalysis });
      }
      inSection4 = false;
      break;
    }

    if (!inSection4) continue;

    // Sub-section headers: "4.5.1 MASTER BEDROOM BATHROOM" or "4.4.2 CEILING"
    const subMatch = line.match(/^4\.(\d+)\.?\d*\s+(.+)/i);
    if (subMatch) {
      const sectionNum = parseInt(subMatch[1]);
      const rawAreaName = subMatch[2];
      
      let pageNo = null;
      // Match explicit page number at the end of TOC layout dots or padded spaces
      const pageMatch = rawAreaName.match(/(?:\.{2,}|\s{2,})\s*(\d+)$|\s+(\d+)$/);
      if (pageMatch) {
        pageNo = parseInt(pageMatch[1] || pageMatch[2]);
      }

      let areaName = rawAreaName
        .replace(/\.{2,}.*?\d*$/g, '')    // Remove TOC dots and numbers at end
        .replace(/\s+\d+\s*$/g, '')       // Remove trailing page numbers
        .replace(/\s*\(\d+\s*$/g, '')     // Remove trailing "(1" from "BEDROOM -2(1"
        .replace(/\s*\(.*?\)\s*$/g, '')   // Remove trailing parenthetical descriptions
        .trim();

      // Skip generic headers and non-area sections
      if (areaName.match(/^(ACTION|POSSIBILIT|SUMMARY|REFERENCE|THERMAL|FURTHER|TABLE|VISUAL REF|NEGATIVE|POSITIVE|STRUCTURAL|CONDITION|SUBSTRATE|ADHESION)/i)) continue;
      // Skip treatment descriptions (4.1.x = therapies)
      if (sectionNum <= 3 && areaName.match(/TREATMENT|GROUTING|PLUMBING|PLASTER|RCC|SCOPE|INPUT/i)) continue;
      // Skip very short names (likely artifacts)
      if (areaName.length < 4) continue;

      if (currentAnalysis) {
        currentAnalysis.description = analysisBuffer.trim();
        analysisAreas.push({ ...currentAnalysis });
      }
      currentAnalysis = { area: areaName, description: '', sectionNum, pageNo };
      analysisBuffer = '';
      continue;
    }

    // IMAGE references like "IMAGE 7: GAPS IN TILE JOINTS"
    const imageMatch = line.match(/^IMAGE\s+(\d+)\s*:\s*(.+)/i);
    if (imageMatch && currentAnalysis) {
      currentAnalysis.imageRef = parseInt(imageMatch[1]);
      currentAnalysis.imageDescription = imageMatch[2].trim();
      analysisBuffer += imageMatch[2].trim() + '. ';
      continue;
    }

    // Accumulate analysis text
    if (currentAnalysis && line.length > 10 && !line.match(/^www\.|UrbanRoof|Page\d|IR-,|^\d+$/i)) {
      analysisBuffer += line + ' ';
    }
  }

  // Push the final item
  if (currentAnalysis) {
    currentAnalysis.description = analysisBuffer.trim();
    analysisAreas.push({ ...currentAnalysis });
  }

  // Deduplicate and aggregate analysis areas to merge TOC entries (has pageNo) with Body entries (has description & imageRef)
  const mergedAnalysisAreas = [];
  const areaMap = new Map();

  for (const analysis of analysisAreas) {
    if (!areaMap.has(analysis.area)) {
      areaMap.set(analysis.area, { ...analysis });
    } else {
      const existing = areaMap.get(analysis.area);
      if (analysis.pageNo) existing.pageNo = analysis.pageNo;
      if (analysis.imageRef) existing.imageRef = analysis.imageRef;
      if (analysis.description && analysis.description.length > existing.description.length) {
        existing.description += ' ' + analysis.description;
      }
    }
  }
  mergedAnalysisAreas.push(...areaMap.values());

  // --- Phase 3: Build structured observations ---
  // Merge Section 3 summaries with Section 4 detailed analysis

  // Standard area order matching a typical DDR
  const areaOrder = [
    'Bathroom',
    'Master Bedroom Bathroom',
    'Common Bathroom',
    'Balcony',
    'Open Balcony',
    'Terrace',
    'External Wall',
    'Master Bedroom',
    'Hall',
    'Staircase',
    'Kitchen',
    'Parking'
  ];

  // Create observations from analysis areas first (more specific)
  const usedAreas = new Set();

  mergedAnalysisAreas.forEach(analysis => {
    const areaName = analysis.area;
    let description = analysis.description || '';

    // Try to enrich with Section 3 summary
    for (const [summaryKey, summaryText] of Object.entries(summaryAreas)) {
      if (areaName.toLowerCase().includes(summaryKey.toLowerCase().replace(/s$/, '')) ||
          summaryKey.toLowerCase().includes(areaName.toLowerCase().split(' ')[0])) {
        description = summaryText + '\n\n' + description;
        usedAreas.add(summaryKey);
        break;
      }
    }

    // Detect defect type
    let defectType = 'Other';
    const descLower = description.toLowerCase();
    if (descLower.includes('dampness') || descLower.includes('moisture') || descLower.includes('capillary')) defectType = 'Dampness';
    else if (descLower.includes('leak') || descLower.includes('seep') || descLower.includes('ingress')) defectType = 'Leakage';
    else if (descLower.includes('crack')) defectType = 'Cracks';
    else if (descLower.includes('tile') || descLower.includes('hollow') || descLower.includes('grout')) defectType = 'Tile Issues';
    else if (descLower.includes('paint') || descLower.includes('peel') || descLower.includes('spalling')) defectType = 'Paint Damage';
    else if (descLower.includes('vegetation') || descLower.includes('algae') || descLower.includes('moss')) defectType = 'Biological Growth';
    else if (descLower.includes('plumb') || descLower.includes('pipe')) defectType = 'Plumbing';
    else if (descLower.includes('rcc') || descLower.includes('structural') || descLower.includes('concrete')) defectType = 'Structural';

    observations.push({
      area: areaName,
      description: description.substring(0, 500),
      defectType: defectType,
      defectTypes: [defectType],
      rooms: [areaName.toLowerCase()],
      visualImageRef: analysis.pageNo || analysis.imageRef || null,
      imageDescription: analysis.imageDescription || null
    });
  });

  // Add any Section 3 areas not covered by Section 4
  for (const [areaKey, summary] of Object.entries(summaryAreas)) {
    if (usedAreas.has(areaKey)) continue;

    let defectType = 'Other';
    const descLower = summary.toLowerCase();
    if (descLower.includes('dampness') || descLower.includes('moisture')) defectType = 'Dampness';
    else if (descLower.includes('leak') || descLower.includes('seep') || descLower.includes('ingress')) defectType = 'Leakage';
    else if (descLower.includes('crack')) defectType = 'Cracks';
    else if (descLower.includes('tile') || descLower.includes('hollow') || descLower.includes('grout')) defectType = 'Tile Issues';

    observations.push({
      area: areaKey.charAt(0).toUpperCase() + areaKey.slice(1).toLowerCase(),
      description: summary.substring(0, 500),
      defectType,
      defectTypes: [defectType],
      rooms: [areaKey.toLowerCase()]
    });
  }

  // If nothing was parsed, extract from raw text
  if (observations.length === 0) {
    const meaningfulLines = lines.filter(l => l.trim().length > 30 && !l.match(/^www\.|UrbanRoof|Page\d|IR-|SECTION/i));
    observations.push({
      area: 'General Inspection',
      description: meaningfulLines.slice(0, 10).join('. ').substring(0, 500),
      defectType: 'Other',
      defectTypes: ['Other'],
      rooms: ['general']
    });
  }

  console.log(`Parsed ${observations.length} visual observations: ${observations.map(o => o.area).join(', ')}`);
  return observations;
}

/**
 * Parse property info from Main DDR text
 */
export function parsePropertyInfo(text) {
  const info = {};

  // Customer name
  const nameMatch = text.match(/Customer\s*Name\s*:\s*(.+)/i);
  if (nameMatch) info.customerName = nameMatch[1].trim();

  // Address
  const addrMatch = text.match(/Customer\s*Full\s*Address\s*:\s*(.+)/i);
  if (addrMatch) info.address = addrMatch[1].trim();

  // Site address (multi-line, take first line)
  const siteMatch = text.match(/Site\s*Address\s*:\s*(.+)/i);
  if (siteMatch) info.siteAddress = siteMatch[1].trim();

  // Type of structure
  const typeMatch = text.match(/Type\s*of\s*structure\s*:\s*(.+)/i);
  if (typeMatch) info.type = typeMatch[1].trim();

  // Year of construction
  const yearMatch = text.match(/Year\s*of\s*Construction\s*:\s*(\d{4})/i);
  if (yearMatch) info.yearBuilt = yearMatch[1];

  // Age
  const ageMatch = text.match(/Age\s*(?:of\s*)?Building\s*\(?\s*years?\s*\)?\s*:\s*(\d+)/i);
  if (ageMatch) info.buildingAge = ageMatch[1] + ' years';

  // Inspection date
  const inspDateMatch = text.match(/Date\s*of\s*Inspection\s*:\s*(.+)/i);
  if (inspDateMatch) info.inspectionDate = inspDateMatch[1].trim();

  // Inspector
  const inspectorMatch = text.match(/Inspected\s*By\s*:\s*(.+)/i);
  if (inspectorMatch) info.inspector = inspectorMatch[1].trim();

  // Case/Report ID
  const caseMatch = text.match(/(?:Case|Report)\s*(?:No|ID)\s*[-:]?\s*(.+)/i);
  if (caseMatch) info.caseNo = caseMatch[1].trim();

  return info;
}

// Backward-compatible aliases
export const parseThermalDataEnhanced = parseThermalData;
export const parseVisualObservationsEnhanced = parseVisualObservations;
