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
    
    // Create directory if it doesn't exist
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
 * Parse thermal data from text
 */
export function parseThermalData(text) {
  const thermalReadings = [];
  const lines = text.split('\n');
  
  let currentReading = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for thermal image filenames (e.g., RB02380X.JPG)
    if (line.match(/RB\d+X\.JPG/i)) {
      if (Object.keys(currentReading).length > 0) {
        thermalReadings.push({ ...currentReading });
      }
      currentReading = { filename: line };
    }
    
    // Extract hotspot temperature
    if (line.includes('Hotspot') || line.includes('Hot spot')) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.hotspot = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract coldspot temperature
    if (line.includes('Coldspot') || line.includes('Cold spot')) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.coldspot = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract emissivity
    if (line.includes('Emissivity')) {
      const emissivityMatch = line.match(/([0-9.]+)/);
      if (emissivityMatch) {
        currentReading.emissivity = parseFloat(emissivityMatch[1]);
      }
    }
    
    // Extract reflected temperature
    if (line.includes('Reflected') && line.includes('temp')) {
      const tempMatch = line.match(/([0-9.]+)\s*°?C/i);
      if (tempMatch) {
        currentReading.reflectedTemp = parseFloat(tempMatch[1]);
      }
    }
    
    // Extract date
    if (line.match(/\d{2}\/\d{2}\/\d{2}/)) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{2})/);
      if (dateMatch) {
        currentReading.date = dateMatch[1];
      }
    }
  }
  
  // Push the last reading
  if (Object.keys(currentReading).length > 0) {
    thermalReadings.push(currentReading);
  }
  
  return thermalReadings;
}

/**
 * Parse visual observations from inspection report
 */
export function parseVisualObservations(text) {
  const observations = [];
  const lines = text.split('\n');
  
  // Look for impacted area sections
  const impactedAreaPattern = /(?:Point|Area)\s*(?:No\.?)?\s*(\d+\.?\d*)/i;
  const roomPattern = /(Hall|Bedroom|Kitchen|Bathroom|Parking|Master Bedroom|Common Bedroom|WC|External Wall|Terrace)/i;
  
  let currentObservation = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect point number
    const pointMatch = line.match(impactedAreaPattern);
    if (pointMatch) {
      if (currentObservation) {
        observations.push({ ...currentObservation });
      }
      currentObservation = {
        pointNo: pointMatch[1],
        description: line,
        rooms: []
      };
    }
    
    // Detect room/area
    const roomMatch = line.match(roomPattern);
    if (roomMatch && currentObservation) {
      const room = roomMatch[1];
      if (!currentObservation.rooms.includes(room)) {
        currentObservation.rooms.push(room);
      }
      currentObservation.area = room;
    }
    
    // Detect defect types
    if (currentObservation) {
      if (line.toLowerCase().includes('dampness')) {
        currentObservation.defectType = 'Dampness';
        if (!currentObservation.description.toLowerCase().includes('dampness')) {
          currentObservation.description += ' - Dampness observed';
        }
      }
      if (line.toLowerCase().includes('leakage')) {
        currentObservation.defectType = 'Leakage';
        if (!currentObservation.description.toLowerCase().includes('leakage')) {
          currentObservation.description += ' - Leakage detected';
        }
      }
      if (line.toLowerCase().includes('crack')) {
        currentObservation.defectType = 'Cracks';
        if (!currentObservation.description.toLowerCase().includes('crack')) {
          currentObservation.description += ' - Cracks found';
        }
      }
      if (line.toLowerCase().includes('hollow') || line.toLowerCase().includes('tile')) {
        currentObservation.defectType = 'Tile Issues';
        if (!currentObservation.description.toLowerCase().includes('tile')) {
          currentObservation.description += ' - Tile issues identified';
        }
      }
    }
  }
  
  if (currentObservation) {
    observations.push(currentObservation);
  }
  
  return observations;
}
