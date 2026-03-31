import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI-powered matching of visual observations with thermal readings
 * Uses Claude 3.5 Sonnet for intelligent data merging
 */
export async function matchObservationsWithThermal(visualObservations, thermalReadings, sampleReportText, thermalReportText) {
  try {
    const prompt = `You are an expert building inspector analyzing property inspection data. Your task is to merge visual observations with thermal imaging data to create a comprehensive Detailed Diagnostic Report (DDR).

## STRICT RULES:
1. If data is missing, write "Not Available"
2. If images are missing, write "Image Not Available"
3. If data conflicts, FLAG it clearly
4. Do NOT invent any facts
5. Avoid duplicate points

## INPUT DATA:

### Visual Observations:
${JSON.stringify(visualObservations, null, 2)}

### Thermal Readings:
${JSON.stringify(thermalReadings, null, 2)}

### Sample Report Excerpt:
${sampleReportText.substring(0, 3000)}

### Thermal Report Excerpt:
${thermalReportText.substring(0, 3000)}

## TASK:
Match visual observations with corresponding thermal readings based on room/area. Generate a merged JSON output with this structure:

{
  "propertyIssueSummary": "Brief overview of all issues found",
  "areaWiseObservations": [
    {
      "area": "Room name",
      "visualObservation": "Description of what was seen",
      "thermalReading": {
        "hotspot": number or "Not Available",
        "coldspot": number or "Not Available",
        "analysis": "What the thermal data indicates"
      },
      "defectType": "Dampness/Leakage/Cracks/etc",
      "severity": "Minor/Moderate/Severe",
      "images": ["filename1.jpg"] or ["Image Not Available"]
    }
  ],
  "probableRootCause": "Analysis of what's causing these issues",
  "severityAssessment": {
    "overall": "Minor/Moderate/Severe",
    "reasoning": "Why this severity level"
  },
  "recommendedActions": [
    "Action 1",
    "Action 2"
  ],
  "additionalNotes": "Any other relevant information",
  "missingOrUnclearInfo": [
    "What data is missing or unclear"
  ],
  "dataConflicts": [
    "Any conflicts found in the data"
  ]
}

Return ONLY the JSON object, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }
    
    const mergedData = JSON.parse(jsonText);
    
    return mergedData;
  } catch (error) {
    console.error('Error in AI matching:', error);
    throw new Error('Failed to process data with AI: ' + error.message);
  }
}

/**
 * Generate analytics data from merged observations
 */
export function generateAnalytics(mergedData) {
  const analytics = {
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

  if (!mergedData.areaWiseObservations) return analytics;

  analytics.totalAreas = mergedData.areaWiseObservations.length;
  
  mergedData.areaWiseObservations.forEach(obs => {
    analytics.totalDefects++;
    
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
        analytics.temperatureStats.avgHotspot += hotspot;
        analytics.temperatureStats.maxHotspot = Math.max(analytics.temperatureStats.maxHotspot, hotspot);
        analytics.temperatureStats.readings.push({ area: obs.area, hotspot, coldspot });
      }
      
      if (!isNaN(coldspot)) {
        analytics.temperatureStats.avgColdspot += coldspot;
        analytics.temperatureStats.minColdspot = Math.min(analytics.temperatureStats.minColdspot, coldspot);
      }
    }
  });
  
  // Calculate averages
  if (analytics.temperatureStats.readings.length > 0) {
    analytics.temperatureStats.avgHotspot /= analytics.temperatureStats.readings.length;
    analytics.temperatureStats.avgColdspot /= analytics.temperatureStats.readings.length;
  }
  
  return analytics;
}
