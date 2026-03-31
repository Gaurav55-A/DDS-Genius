import pdf from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
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
 * Extract images from PDF and save them
 */
export async function extractImagesFromPDF(buffer, reportId, type = 'visual') {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const images = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', reportId);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pages = pdfDoc.getPages();
    let imageIndex = 0;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const pageImages = page.node.Resources?.XObject;

      if (!pageImages) continue;

      const xObjectKeys = Object.keys(pageImages);
      for (const key of xObjectKeys) {
        try {
          const xObject = pageImages[key];
          if (xObject && xObject.dict && xObject.dict.get('Subtype')?.toString() === '/Image') {
            imageIndex++;
            const filename = `${type}_page${pageIndex + 1}_img${imageIndex}.jpg`;
            const imagePath = `/uploads/${reportId}/${filename}`;
            
            images.push({
              filename,
              path: imagePath,
              page: pageIndex + 1,
              type
            });
          }
        } catch (err) {
          console.log(`Could not extract image ${key} from page ${pageIndex + 1}`);
        }
      }
    }

    return images;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
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
