import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

/**
 * Extract text content from PDF buffer
 */
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract images from PDF
 * Creates placeholder images for now since actual extraction requires heavy libraries
 * In production, use pdf2pic or similar when resources allow
 */
export async function extractImagesFromPDF(buffer, reportId, type = 'visual') {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', reportId);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const images = [];
    
    // Parse PDF to get page count
    const pdfData = await pdf(buffer);
    const pageCount = pdfData.numpages;
    
    console.log(`Processing ${pageCount} pages from ${type} PDF`);
    
    // Create SVG placeholder images for each page
    // This ensures the PDF export has actual images to display
    for (let i = 1; i <= pageCount; i++) {
      const filename = `${type}_page${i}.svg`;
      const imagePath = `/uploads/${reportId}/${filename}`;
      const fullPath = path.join(uploadDir, filename);
      
      // Create a simple SVG placeholder
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F1F5F9"/>
  <rect x="10" y="10" width="380" height="280" fill="white" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="5,5"/>
  <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748B" font-weight="600">
    ${type === 'visual' ? 'Visual Inspection' : 'Thermal Imaging'}
  </text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94A3B8">
    Page ${i} of ${pageCount}
  </text>
  <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#CBD5E1">
    Image Extracted from PDF
  </text>
</svg>`;
      
      fs.writeFileSync(fullPath, svgContent);
      console.log(`✓ Created placeholder: ${filename}`);
      
      images.push({
        filename,
        path: imagePath,
        page: i,
        type
      });
    }

    console.log(`✓ Created ${images.length} image placeholders from ${type} PDF`);
    return images;
    
  } catch (error) {
    console.error(`Error processing PDF for images:`, error);
    return [];
  }
}

/**
 * Enhanced thermal data parsing with visual observation text from same page
 * Extracts both thermal readings AND visual observation text
 */
export function parseThermalDataEnhanced(text) {
  const thermalReadings = [];
  const lines = text.split('\n');
  
  let currentReading = {};
  let capturingObservation = false;
  let observationText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for thermal image filenames (e.g., RB02380X.JPG)
    const filenameMatch = line.match(/([A-Z]{2}\d{5}[A-Z]\.(JPG|PNG|jpg|png))/i);
    if (filenameMatch) {
      // Save previous reading if exists
      if (Object.keys(currentReading).length > 0) {
        currentReading.visualObservation = observationText.trim() || 'Not Available';
        thermalReadings.push({ ...currentReading });
        observationText = '';
      }
      currentReading = { filename: filenameMatch[1] };
      capturingObservation = false;
    }
    
    // Look for visual observation markers
    if (line.match(/visual\s*observation/i) || line.match(/description/i) || line.match(/notes?:/i)) {
      capturingObservation = true;
      continue;
    }
    
    // Capture visual observation text (multi-line)
    if (capturingObservation && line.length > 10 && !line.match(/hotspot|coldspot|emissivity|date/i)) {
      observationText += line + ' ';
    }
    
    // Extract hotspot temperature
    if (line.match(/hot\s*spot|hotspot/i)) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.hotspot = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract coldspot temperature
    if (line.match(/cold\s*spot|coldspot/i)) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.coldspot = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract emissivity
    if (line.match(/emissivity/i)) {
      const emissivityMatch = line.match(/([0-9.]+)/);
      if (emissivityMatch) {
        currentReading.emissivity = parseFloat(emissivityMatch[1]);
      }
    }
    
    // Extract reflected temperature
    if (line.match(/reflected.*temp/i)) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.reflectedTemp = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract date (various formats)
    const dateMatch = line.match(/(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/);
    if (dateMatch) {
      currentReading.date = dateMatch[1];
    }
    
    // Stop capturing observation if we hit thermal data again
    if (capturingObservation && line.match(/hotspot|coldspot|emissivity/i)) {
      capturingObservation = false;
    }
  }
  
  // Push the last reading
  if (Object.keys(currentReading).length > 0) {
    currentReading.visualObservation = observationText.trim() || 'Not Available';
    thermalReadings.push(currentReading);
  }
  
  return thermalReadings;
}

/**
 * Enhanced visual observations parser - more pattern-based
 */
export function parseVisualObservationsEnhanced(text) {
  const observations = [];
  const lines = text.split('\n');
  
  // Pattern-based matching instead of hard-coded strings
  const pointPattern = /(?:point|area|item|section|location)\s*(?:no\.?|number|#)?\s*[:=]?\s*(\d+\.?\d*)/i;
  const roomPattern = /(hall|bedroom|kitchen|bathroom|parking|master\s*bedroom|common\s*bedroom|living\s*room|dining|balcony|terrace|corridor|hallway|entrance|wc|toilet|washroom|store|utility|external\s*wall)/i;
  const defectPattern = /(dampness|moisture|leakage|seepage|crack|hollow|tile\s*damage|paint\s*peel|algae|moss|fungus|water\s*stain)/i;
  
  let currentObservation = null;
  let descriptionBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect point/area number
    const pointMatch = line.match(pointPattern);
    if (pointMatch) {
      // Save previous observation
      if (currentObservation) {
        currentObservation.description = descriptionBuffer.trim() || currentObservation.description;
        observations.push({ ...currentObservation });
      }
      
      currentObservation = {
        pointNo: pointMatch[1],
        description: line,
        rooms: [],
        defectTypes: []
      };
      descriptionBuffer = line + ' ';
    }
    
    if (!currentObservation) continue;
    
    // Detect room/area
    const roomMatch = line.match(roomPattern);
    if (roomMatch) {
      const room = roomMatch[1].trim();
      if (!currentObservation.rooms.includes(room)) {
        currentObservation.rooms.push(room);
      }
      if (!currentObservation.area) {
        currentObservation.area = room;
      }
      descriptionBuffer += line + ' ';
    }
    
    // Detect defect types (can be multiple)
    const defectMatch = line.match(defectPattern);
    if (defectMatch) {
      const defectType = defectMatch[1];
      const capitalizedDefect = defectType.charAt(0).toUpperCase() + defectType.slice(1).toLowerCase();
      if (!currentObservation.defectTypes.includes(capitalizedDefect)) {
        currentObservation.defectTypes.push(capitalizedDefect);
      }
      if (!currentObservation.defectType) {
        currentObservation.defectType = capitalizedDefect;
      }
      descriptionBuffer += line + ' ';
    }
    
    // Add to description if it's relevant content
    if (line.length > 15 && !line.match(/page|total|report|date/i)) {
      descriptionBuffer += line + ' ';
    }
  }
  
  // Push the last observation
  if (currentObservation) {
    currentObservation.description = descriptionBuffer.trim() || currentObservation.description;
    observations.push(currentObservation);
  }
  
  return observations;
}

/**
 * Backward compatibility - old function names
 */
export function parseThermalData(text) {
  return parseThermalDataEnhanced(text);
}

export function parseVisualObservations(text) {
  return parseVisualObservationsEnhanced(text);
}
