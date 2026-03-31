/**
 * Test suite for AI Matcher conflict detection logic
 * Verifies the strict rules for data conflicts
 */

import { matchObservationsWithThermalEnhanced, generateAnalytics } from './ai-matcher.js';

// Test data with conflicts
const testVisualObservations = [
  {
    area: 'Living Room',
    description: 'Walls appear dry with no visible dampness',
    rooms: ['Living Room'],
    defectType: 'None reported'
  },
  {
    area: 'Bedroom',
    description: 'Dry conditions, no moisture detected visually',
    rooms: ['Bedroom'],
    defectType: 'None'
  }
];

const testThermalReadings = [
  {
    filename: 'RB02380X.JPG',
    hotspot: 24.5,
    coldspot: 19.8,  // < 22°C - should trigger conflict
    visualObservation: 'Living room wall section - appears dry'
  },
  {
    filename: 'RB02381X.JPG',
    hotspot: 26.3,
    coldspot: 20.1,  // < 22°C and delta = 6.2°C > 5°C - double conflict
    visualObservation: 'Bedroom corner - no visible issues'
  }
];

const sampleReportText = `
Property Inspection Report
Living Room: Walls appear dry with no visible dampness. No signs of water damage.
Bedroom: Dry conditions, no moisture detected visually. Paint in good condition.
`;

const thermalReportText = `
Thermal Imaging Report
Image: RB02380X.JPG - Living room wall section - appears dry
Hotspot: 24.5°C, Coldspot: 19.8°C
Image: RB02381X.JPG - Bedroom corner - no visible issues  
Hotspot: 26.3°C, Coldspot: 20.1°C
`;

// Expected conflicts:
// 1. Living Room: Visual "dry" vs Coldspot 19.8°C < 22°C
// 2. Bedroom: Visual "dry" vs Coldspot 20.1°C < 22°C
// 3. Bedroom: Delta 6.2°C > 5°C indicates moisture

async function testConflictDetection() {
  console.log('=== AI Matcher Conflict Detection Test ===\n');
  
  try {
    console.log('Testing with conflict scenarios:');
    console.log('1. Visual: "Dry" vs Thermal coldspot < 22°C');
    console.log('2. Visual: "No dampness" vs Delta > 5°C\n');
    
    const result = await matchObservationsWithThermalEnhanced(
      testVisualObservations,
      testThermalReadings,
      sampleReportText,
      thermalReportText
    );
    
    console.log('✓ AI matching completed\n');
    
    console.log('=== Data Conflicts Detected ===');
    if (result.dataConflicts && result.dataConflicts.length > 0) {
      result.dataConflicts.forEach((conflict, idx) => {
        console.log(`${idx + 1}. ${conflict}`);
      });
      console.log(`\n✓ Total conflicts: ${result.dataConflicts.length}`);
    } else {
      console.log('⚠️ No conflicts detected (check logic)');
    }
    
    console.log('\n=== Area-wise Observations ===');
    result.areaWiseObservations?.forEach(obs => {
      console.log(`\nArea: ${obs.area}`);
      console.log(`  Visual: ${obs.visualObservation}`);
      console.log(`  Thermal: Hotspot=${obs.thermalReading?.hotspot}°C, Coldspot=${obs.thermalReading?.coldspot}°C`);
      console.log(`  Conflict: ${obs.conflictDetected ? 'YES' : 'NO'}`);
      if (obs.conflictDetected) {
        console.log(`  Description: ${obs.conflictDescription}`);
      }
    });
    
    console.log('\n=== Analytics ===');
    const analytics = generateAnalytics(result);
    console.log(`Total Conflicts: ${analytics.totalConflicts}`);
    console.log(`Total Areas: ${analytics.totalAreas}`);
    
    console.log('\n✅ Test Complete!');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConflictDetection();
}

export { testConflictDetection };
