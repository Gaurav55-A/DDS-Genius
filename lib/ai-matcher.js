import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic with Emergent Universal Key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.EMERGENT_LLM_KEY,
  // Emergent Universal Key works with Anthropic SDK
  baseURL: 'https://api.anthropic.com/v1'
});

/**
 * Enhanced conflict detection logic
 * STRICT RULES:
 * 1. Visual "Dry" vs Thermal < 22°C = CONFLICT
 * 2. Delta (hotspot - coldspot) > 5°C = CONFLICT (moisture indication)
 * 3. Visual "No dampness" vs Cold spot = CONFLICT
 */
function detectConflicts(observations) {
  const conflicts = [];
  
  observations.forEach(obs => {
    const visualText = (obs.visualObservation || '').toLowerCase();
    const thermal = obs.thermalReading;
    
    // Skip if no thermal data
    if (!thermal || typeof thermal !== 'object') return;
    
    const hotspot = parseFloat(thermal.hotspot);
    const coldspot = parseFloat(thermal.coldspot);
    
    // CONFLICT 1: Visual says "Dry" but thermal shows cold spot < 22°C
    if ((visualText.includes('dry') || visualText.includes('no visible dampness') || 
         visualText.includes('no dampness') || visualText.includes('no issues')) &&
        !isNaN(coldspot) && coldspot < 22) {
      
      conflicts.push(
        `CONFLICT: ${obs.area} - Visual: ${obs.visualObservation} vs Thermal: Cold spot at ${coldspot}°C indicates potential sub-surface moisture (threshold: 22°C)`
      );
      obs.conflictDetected = true;
      obs.conflictDescription = `Visual indicates dry condition but thermal shows cold spot at ${coldspot}°C (< 22°C threshold), suggesting hidden moisture`;
    }
    
    // CONFLICT 2: Temperature delta > 5°C indicates moisture
    if (!isNaN(hotspot) && !isNaN(coldspot)) {
      const delta = hotspot - coldspot;
      
      if (delta > 5 && (visualText.includes('no dampness') || visualText.includes('dry'))) {
        conflicts.push(
          `CONFLICT: ${obs.area} - Visual: No dampness reported vs Thermal: High temperature delta ${delta.toFixed(1)}°C (${hotspot}°C - ${coldspot}°C > 5°C threshold) indicates moisture presence`
        );
        obs.conflictDetected = true;
        obs.conflictDescription = obs.conflictDescription || 
          `High temperature delta of ${delta.toFixed(1)}°C indicates moisture, contradicting visual assessment`;
      }
    }
  });
  
  return conflicts;
}

/**
 * Enhanced AI-powered matching with visual observations from thermal PDF
 * Uses Claude 3.5 Sonnet via Emergent Universal Key for intelligent data merging
 */
export async function matchObservationsWithThermalEnhanced(visualObservations, thermalReadings, sampleReportText, thermalReportText) {
  try {
    const prompt = `You are an expert building inspector analyzing property inspection data. Your task is to merge visual observations with thermal imaging data to create a comprehensive Detailed Diagnostic Report (DDR).

## STRICT RULES (MANDATORY):
1. If data is missing → write "Not Available"
2. If images are missing → write "Image Not Available"
3. If data conflicts → FLAG it clearly in dataConflicts array
4. Do NOT invent any facts
5. Avoid duplicate points
6. Match observations using:
   - Room/area names
   - Visual observation text from thermal PDF
   - Defect descriptions
   - Temperature readings

## CONFLICT DETECTION (CRITICAL):
A DATA CONFLICT exists when:
- Visual report says area is "Dry" or "No issues" BUT thermal shows significant coldspot (< 22°C)
- Visual report says "No dampness" BUT thermal shows high moisture delta (hotspot - coldspot > 5°C)
- Visual description contradicts thermal analysis
- Temperature readings are abnormal for the reported condition

ALWAYS flag conflicts in the dataConflicts array with specific details.

## INPUT DATA:

### Visual Observations from Sample Report:
${JSON.stringify(visualObservations, null, 2)}

### Thermal Readings (with visual observations from thermal PDF):
${JSON.stringify(thermalReadings, null, 2)}

### Sample Report Text Excerpt:
${sampleReportText.substring(0, 3000)}

### Thermal Report Text Excerpt:
${thermalReportText.substring(0, 3000)}

## MATCHING STRATEGY:
1. First, match by room/area names
2. Then, match visual observation text from thermal PDF to descriptions in sample report
3. Look for common keywords (dampness, moisture, cracks, etc.)
4. If thermal reading has visualObservation field, use it to find corresponding area in sample report
5. Detect temperature anomalies that contradict visual findings

## OUTPUT STRUCTURE:
Return a JSON object with this exact structure:

{
  "propertyIssueSummary": "Brief overview of all issues found (2-3 sentences)",
  "areaWiseObservations": [
    {
      "area": "Room name (e.g., Hall, Bedroom)",
      "visualObservation": "Description from sample report",
      "thermalReading": {
        "hotspot": number or "Not Available",
        "coldspot": number or "Not Available",
        "analysis": "What the thermal data indicates (include conflict warning if applicable)",
        "filename": "thermal image filename or Not Available"
      },
      "defectType": "Dampness/Leakage/Cracks/Tile Issues/Other",
      "severity": "Minor/Moderate/Severe",
      "images": ["image1.jpg", "image2.jpg"] or ["Image Not Available"],
      "conflictDetected": boolean,
      "conflictDescription": "Description of conflict if detected"
    }
  ],
  "probableRootCause": "Analysis of what's causing these issues",
  "severityAssessment": {
    "overall": "Minor/Moderate/Severe",
    "reasoning": "Why this severity level (consider both visual and thermal data)"
  },
  "recommendedActions": [
    "Action 1 - Specific and actionable",
    "Action 2 - Priority-ordered"
  ],
  "additionalNotes": "Any other relevant information or patterns observed",
  "missingOrUnclearInfo": [
    "What data is missing or unclear (be specific)"
  ],
  "dataConflicts": [
    "CONFLICT: [Area name] - Visual: [what was reported] vs Thermal: [what was detected] - Temperature: [values]"
  ]
}

## EXAMPLE CONFLICT:
If visual says "Hallway Skirting - No visible dampness" but thermal shows coldspot of 20.5°C (significantly lower than ambient), output:
"CONFLICT: Hallway Skirting - Visual: No visible dampness detected vs Thermal: Cold spot at 20.5°C indicates potential sub-surface moisture"

Return ONLY the JSON object, no other text.`;

    console.log('Calling Claude 3.5 Sonnet via Emergent Universal Key...');
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.2, // Lower for more consistent outputs
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    
    // Extract JSON from response
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }
    
    const mergedData = JSON.parse(jsonText);
    
    // Post-process to ensure data quality
    if (!mergedData.areaWiseObservations) {
      mergedData.areaWiseObservations = [];
    }
    
    // Ensure every observation has required fields
    mergedData.areaWiseObservations = mergedData.areaWiseObservations.map(obs => ({
      area: obs.area || 'Not Available',
      visualObservation: obs.visualObservation || 'Not Available',
      thermalReading: obs.thermalReading || { 
        hotspot: 'Not Available', 
        coldspot: 'Not Available',
        analysis: 'Not Available'
      },
      defectType: obs.defectType || 'Other',
      severity: obs.severity || 'Moderate',
      images: obs.images && obs.images.length > 0 ? obs.images : ['Image Not Available'],
      conflictDetected: obs.conflictDetected || false,
      conflictDescription: obs.conflictDescription || ''
    }));
    
    // CRITICAL: Apply strict conflict detection rules
    const detectedConflicts = detectConflicts(mergedData.areaWiseObservations);
    
    // Merge AI-detected conflicts with rule-based conflicts
    const aiConflicts = mergedData.dataConflicts || [];
    const allConflicts = [...new Set([...aiConflicts, ...detectedConflicts])]; // Remove duplicates
    
    mergedData.dataConflicts = allConflicts;
    
    // Ensure missingOrUnclearInfo exists
    if (!mergedData.missingOrUnclearInfo) {
      mergedData.missingOrUnclearInfo = [];
    }
    
    console.log(`✓ AI matching complete. Detected ${allConflicts.length} conflicts.`);
    
    return mergedData;
  } catch (error) {
    console.error('Error in AI matching:', error);
    throw new Error('Failed to process data with AI: ' + error.message);
  }
}

/**
 * Backward compatibility
 */
export async function matchObservationsWithThermal(...args) {
  return matchObservationsWithThermalEnhanced(...args);
}

/**
 * Generate analytics data from merged observations
 */
export function generateAnalytics(mergedData) {
  const analytics = {
    totalAreas: 0,
    totalDefects: 0,
    totalConflicts: 0,
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

  if (!mergedData.areaWiseObservations) return analytics;

  analytics.totalAreas = mergedData.areaWiseObservations.length;
  
  let hotspotSum = 0;
  let coldspotSum = 0;
  let tempReadingsCount = 0;
  
  mergedData.areaWiseObservations.forEach(obs => {
    analytics.totalDefects++;
    
    // Count conflicts
    if (obs.conflictDetected) {
      analytics.totalConflicts++;
    }
    
    // Count issue types
    const defectType = obs.defectType || 'Other';
    analytics.issueDistribution[defectType] = (analytics.issueDistribution[defectType] || 0) + 1;
    
    // Count severity
    const severity = obs.severity || 'Moderate';
    if (analytics.severityDistribution[severity] !== undefined) {
      analytics.severityDistribution[severity]++;
    }
    
    // Process thermal data
    if (obs.thermalReading && typeof obs.thermalReading === 'object') {
      const hotspot = parseFloat(obs.thermalReading.hotspot);
      const coldspot = parseFloat(obs.thermalReading.coldspot);
      
      if (!isNaN(hotspot)) {
        hotspotSum += hotspot;
        analytics.temperatureStats.maxHotspot = Math.max(analytics.temperatureStats.maxHotspot, hotspot);
        tempReadingsCount++;
      }
      
      if (!isNaN(coldspot)) {
        coldspotSum += coldspot;
        analytics.temperatureStats.minColdspot = Math.min(analytics.temperatureStats.minColdspot, coldspot);
      }
      
      if (!isNaN(hotspot) || !isNaN(coldspot)) {
        analytics.temperatureStats.readings.push({ 
          area: obs.area, 
          hotspot: !isNaN(hotspot) ? hotspot : null, 
          coldspot: !isNaN(coldspot) ? coldspot : null 
        });
      }
    }
  });
  
  // Calculate averages
  if (tempReadingsCount > 0) {
    analytics.temperatureStats.avgHotspot = hotspotSum / tempReadingsCount;
    analytics.temperatureStats.avgColdspot = coldspotSum / tempReadingsCount;
  }
  
  // Add data conflicts count
  analytics.totalConflicts = mergedData.dataConflicts?.length || 0;
  
  return analytics;
}
