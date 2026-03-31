/**
 * AI Matcher - Merges visual observations with thermal data
 * Uses Claude API when available, falls back to intelligent rule-based matching
 */

let anthropic = null;

// Try to initialize Anthropic SDK (may fail if key is invalid)
async function getAnthropicClient() {
  if (anthropic !== null) return anthropic;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.EMERGENT_LLM_KEY;
    if (!apiKey || apiKey.startsWith('sk-emergent')) {
      console.log('⚠ Emergent key detected - using intelligent rule-based matching (not a valid Anthropic key)');
      anthropic = false; // Mark as unavailable
      return false;
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropic = new Anthropic({ apiKey });
    return anthropic;
  } catch (error) {
    console.warn('Anthropic SDK not available:', error.message);
    anthropic = false;
    return false;
  }
}

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
 * Intelligent rule-based matching when AI is unavailable.
 * Produces structured output matching the AI output schema exactly.
 */
function intelligentRuleBasedMerge(visualObservations, thermalReadings, sampleText, thermalText) {
  console.log('Running intelligent rule-based merge...');

  // Extract areas from text using keywords
  const areaKeywords = [
    'hall', 'bedroom', 'kitchen', 'bathroom', 'parking', 'master bedroom',
    'common bedroom', 'living room', 'dining', 'balcony', 'terrace',
    'corridor', 'hallway', 'entrance', 'toilet', 'washroom', 'store',
    'utility', 'external wall', 'lobby', 'passage', 'drawing room',
    'pooja room', 'staircase', 'ceiling', 'wall', 'floor', 'skirting'
  ];

  // Build area-wise observations from visual data + thermal data
  const areaObservations = [];
  const usedThermalIndices = new Set();

  // Strategy 1: Create observations from visual observations
  console.log('TYPEOF visualObservations:', typeof visualObservations, Array.isArray(visualObservations));
  if (!Array.isArray(visualObservations)) {
    console.log('VALUE:', visualObservations);
  }
  
  (Array.isArray(visualObservations) ? visualObservations : []).forEach((vis, idx) => {
    const area = vis.area || vis.rooms?.[0] || `Observation Point ${idx + 1}`;
    const description = vis.description || 'Visual inspection conducted';

    // Try to match thermal reading by area name
    let matchedThermalIdx = -1;
    const areaLower = area.toLowerCase();

    thermalReadings.forEach((thermal, tIdx) => {
      if (usedThermalIndices.has(tIdx)) return;
      const thermalObs = (thermal.visualObservation || '').toLowerCase();
      // Match by area keywords
      if (thermalObs.includes(areaLower) || areaLower.includes(thermalObs.split(' ')[0])) {
        matchedThermalIdx = tIdx;
      }
    });

    // If no keyword match, use sequential matching
    if (matchedThermalIdx === -1 && idx < thermalReadings.length && !usedThermalIndices.has(idx)) {
      matchedThermalIdx = idx;
    }

    const thermal = matchedThermalIdx >= 0 ? thermalReadings[matchedThermalIdx] : null;
    if (matchedThermalIdx >= 0) usedThermalIndices.add(matchedThermalIdx);

    // Determine defect type from description
    let defectType = vis.defectType || 'Other';
    const descLower = description.toLowerCase();
    if (descLower.includes('dampness') || descLower.includes('moisture') || descLower.includes('damp')) defectType = 'Dampness';
    else if (descLower.includes('leak') || descLower.includes('seep')) defectType = 'Leakage';
    else if (descLower.includes('crack')) defectType = 'Cracks';
    else if (descLower.includes('tile') || descLower.includes('hollow')) defectType = 'Tile Issues';
    else if (descLower.includes('paint') || descLower.includes('peel')) defectType = 'Paint Damage';

    // Determine severity
    let severity = 'Moderate';
    if (thermal) {
      const coldspot = parseFloat(thermal.coldspot);
      const hotspot = parseFloat(thermal.hotspot);
      if (!isNaN(coldspot) && coldspot < 18) severity = 'Severe';
      else if (!isNaN(coldspot) && coldspot < 22) severity = 'Moderate';
      else if (!isNaN(hotspot) && !isNaN(coldspot) && (hotspot - coldspot) > 7) severity = 'Severe';
      else severity = 'Minor';
    }

    // Build thermal analysis text
    let thermalAnalysis = 'Not Available';
    if (thermal) {
      const hotspot = parseFloat(thermal.hotspot);
      const coldspot = parseFloat(thermal.coldspot);
      const parts = [];
      if (!isNaN(hotspot)) parts.push(`Hotspot: ${hotspot}°C`);
      if (!isNaN(coldspot)) parts.push(`Coldspot: ${coldspot}°C`);
      if (!isNaN(hotspot) && !isNaN(coldspot)) {
        const delta = hotspot - coldspot;
        parts.push(`Delta: ${delta.toFixed(1)}°C`);
        if (coldspot < 22) parts.push('⚠ Cold spot below 22°C threshold - potential sub-surface moisture');
        if (delta > 5) parts.push('⚠ High temperature differential indicates moisture presence');
      }
      thermalAnalysis = parts.join('. ');
    }

    areaObservations.push({
      area: area.charAt(0).toUpperCase() + area.slice(1),
      visualObservation: description,
      thermalReading: thermal ? {
        hotspot: thermal.hotspot || 'Not Available',
        coldspot: thermal.coldspot || 'Not Available',
        analysis: thermalAnalysis,
        filename: thermal.filename || 'Not Available',
        thermalPageNo: thermal.thermalPageNo || (matchedThermalIdx >= 0 ? matchedThermalIdx + 1 : null)
      } : {
        hotspot: 'Not Available',
        coldspot: 'Not Available',
        analysis: 'Not Available'
      },
      visualImageRef: vis.visualImageRef || vis.imageRef || null,
      thermalImageRef: thermal ? (thermal.thermalPageNo || (matchedThermalIdx >= 0 ? matchedThermalIdx + 1 : null)) : null,
      defectType,
      severity,
      images: (vis.visualImageRef || vis.imageRef) ? [`visual_page${vis.visualImageRef || vis.imageRef}.png`] : ['Image Not Available'],
      conflictDetected: false,
      conflictDescription: ''
    });
  });

  // Note: remaining unmatched thermal readings are NOT added as separate observations
  // They are tracked as additional thermal data in the report
  const unmatchedCount = thermalReadings.length - usedThermalIndices.size;
  if (unmatchedCount > 0) {
    console.log(`  ${unmatchedCount} thermal readings without visual match (referenced in report notes)`);
  }

  // If no observations were generated, create one from the raw text
  if (areaObservations.length === 0) {
    // Extract areas from the raw sample text
    const textLines = sampleText.split('\n').filter(l => l.trim().length > 20);
    const meaningfulLines = textLines.slice(0, Math.min(textLines.length, 10));

    areaObservations.push({
      area: 'General Inspection',
      visualObservation: meaningfulLines.join('. ').substring(0, 500) || 'Visual inspection data extracted from report',
      thermalReading: thermalReadings.length > 0 ? {
        hotspot: thermalReadings[0].hotspot || 'Not Available',
        coldspot: thermalReadings[0].coldspot || 'Not Available',
        analysis: 'Thermal data available for review'
      } : { hotspot: 'Not Available', coldspot: 'Not Available', analysis: 'Not Available' },
      defectType: 'Other',
      severity: 'Moderate',
      images: ['Image Not Available'],
      conflictDetected: false,
      conflictDescription: ''
    });
  }

  // Generate summary
  const totalAreas = areaObservations.length;
  const defectTypes = [...new Set(areaObservations.map(o => o.defectType).filter(d => d !== 'Other'))];
  const severeCounts = areaObservations.filter(o => o.severity === 'Severe').length;

  let overallSeverity = 'Moderate';
  if (severeCounts > totalAreas / 2) overallSeverity = 'Severe';
  else if (severeCounts === 0) overallSeverity = 'Minor';

  const summary = `Property inspection reveals ${totalAreas} area(s) with identified issues. ` +
    (defectTypes.length > 0
      ? `Primary concerns include ${defectTypes.join(', ').toLowerCase()}. `
      : 'Issues identified through visual and thermal analysis. ') +
    `Thermal imaging analysis was conducted to identify sub-surface defects not visible during standard inspection.`;

  const rootCause = defectTypes.includes('Dampness') || defectTypes.includes('Leakage')
    ? 'Moisture ingress detected through multiple inspection points. Potential sources include external wall seepage, plumbing leaks, or inadequate waterproofing in wet areas. Prolonged moisture exposure may lead to structural deterioration if not addressed.'
    : 'Defects identified may be attributed to construction quality, material degradation, or environmental exposure. Further investigation recommended to determine exact root causes.';

  return {
    propertyIssueSummary: summary,
    areaWiseObservations: areaObservations,
    probableRootCause: rootCause,
    severityAssessment: {
      overall: overallSeverity,
      reasoning: `Based on ${totalAreas} inspection points with ${severeCounts} severe finding(s). ` +
        `Thermal analysis ${thermalReadings.length > 0 ? 'provided additional diagnostic data' : 'data limited'}.`
    },
    recommendedActions: [
      'Conduct detailed moisture mapping of affected areas using calibrated instruments',
      'Inspect external walls and waterproofing membrane integrity',
      'Check plumbing connections in areas showing thermal anomalies',
      'Apply appropriate waterproofing treatment to affected surfaces',
      'Monitor treated areas over 2-4 weeks for recurrence',
      'Consider engaging a structural engineer for severe cases'
    ],
    additionalNotes: `Report generated using rule-based analysis engine. ${thermalReadings.length} thermal reading(s) and ${visualObservations.length} visual observation(s) were processed. For AI-enhanced analysis, configure a valid Anthropic API key.`,
    missingOrUnclearInfo: [
      ...(thermalReadings.length === 0 ? ['No thermal readings could be extracted from the thermal PDF'] : []),
      ...(visualObservations.length === 0 ? ['No structured visual observations could be extracted from the sample report'] : []),
      'Exact room dimensions and floor plan not available',
      'Historical maintenance records not provided'
    ],
    dataConflicts: []
  };
}

/**
 * Enhanced AI-powered matching with visual observations from thermal PDF
 * Uses Claude 3.5 Sonnet for intelligent data merging when available
 * Falls back to intelligent rule-based matching when AI is unavailable
 */
export async function matchObservationsWithThermalEnhanced(visualObservations, thermalReadings, sampleReportText, thermalReportText) {
  // Try AI-powered matching first
  const client = await getAnthropicClient();

  if (client) {
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
        "analysis": "What the thermal data indicates",
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
    "reasoning": "Why this severity level"
  },
  "recommendedActions": [
    "Action 1 - Specific and actionable",
    "Action 2 - Priority-ordered"
  ],
  "additionalNotes": "Any other relevant information",
  "missingOrUnclearInfo": ["What data is missing or unclear"],
  "dataConflicts": [
    "CONFLICT: [Area name] - Visual: [what was reported] vs Thermal: [what was detected]"
  ]
}

Return ONLY the JSON object, no other text.`;

      console.log('Calling Claude 3.5 Sonnet...');

      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
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

      // Post-process
      if (!mergedData.areaWiseObservations) {
        mergedData.areaWiseObservations = [];
      }

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

      // Apply strict conflict detection rules
      const detectedConflicts = detectConflicts(mergedData.areaWiseObservations);
      const aiConflicts = mergedData.dataConflicts || [];
      mergedData.dataConflicts = [...new Set([...aiConflicts, ...detectedConflicts])];

      if (!mergedData.missingOrUnclearInfo) {
        mergedData.missingOrUnclearInfo = [];
      }

      console.log(`✓ AI matching complete. Detected ${mergedData.dataConflicts.length} conflicts.`);
      return mergedData;
    } catch (error) {
      console.error('AI matching failed, falling back to rule-based:', error.message);
    }
  }

  // Fallback: Intelligent rule-based matching
  const mergedData = intelligentRuleBasedMerge(visualObservations, thermalReadings, sampleReportText, thermalReportText);

  // Apply conflict detection
  const detectedConflicts = detectConflicts(mergedData.areaWiseObservations);
  mergedData.dataConflicts = [...mergedData.dataConflicts, ...detectedConflicts];

  console.log(`✓ Rule-based matching complete. ${mergedData.areaWiseObservations.length} observations, ${mergedData.dataConflicts.length} conflicts.`);
  return mergedData;
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

    if (obs.conflictDetected) {
      analytics.totalConflicts++;
    }

    const defectType = obs.defectType || 'Other';
    analytics.issueDistribution[defectType] = (analytics.issueDistribution[defectType] || 0) + 1;

    const severity = obs.severity || 'Moderate';
    if (analytics.severityDistribution[severity] !== undefined) {
      analytics.severityDistribution[severity]++;
    }

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

  if (tempReadingsCount > 0) {
    analytics.temperatureStats.avgHotspot = hotspotSum / tempReadingsCount;
    analytics.temperatureStats.avgColdspot = coldspotSum / tempReadingsCount;
  }

  analytics.totalConflicts = mergedData.dataConflicts?.length || 0;

  return analytics;
}
