const fs = require('fs');
const path = require('path');

// Missile specifications database
const missileSpecs = {
  // Iran missiles
  'shahab-1': { range: 300, apogee: 80, type: 'SRBM' },
  'shahab-2': { range: 500, apogee: 100, type: 'SRBM' },
  'shahab-3': { range: 1300, apogee: 250, type: 'MRBM' },
  'shahab-3-variant': { range: 1400, apogee: 280, type: 'MRBM' },
  'scud-variant': { range: 350, apogee: 85, type: 'SRBM' },
  'fateh-110': { range: 300, apogee: 75, type: 'SRBM' },
  'fateh-110-variant': { range: 320, apogee: 80, type: 'SRBM' },
  'fateh-110-anti-ship-version': { range: 300, apogee: 75, type: 'SRBM' },
  'fateh-mobin': { range: 310, apogee: 78, type: 'SRBM' },
  'fateh-313': { range: 500, apogee: 100, type: 'SRBM' },
  'ghadr': { range: 1600, apogee: 300, type: 'MRBM' },
  'ghadr-f': { range: 1850, apogee: 350, type: 'MRBM' },
  'ghadr-h': { range: 1700, apogee: 320, type: 'MRBM' },
  'safir': { range: 500, apogee: 200, type: 'SLV' },
  'simorgh': { range: 500, apogee: 250, type: 'SLV' },
  'qased': { range: 500, apogee: 220, type: 'SLV' },
  'zoljanah': { range: 500, apogee: 230, type: 'SLV' },
  'musudan-bm-25': { range: 2500, apogee: 500, type: 'IRBM' },
  'sejjil': { range: 2000, apogee: 400, type: 'MRBM' },
  'qiam': { range: 800, apogee: 150, type: 'SRBM' },
  'khalij-fars': { range: 300, apogee: 50, type: 'ASBM' },
  'kavoshgar': { range: 200, apogee: 150, type: 'SOUNDING' },
  'soumar': { range: 2500, apogee: 100, type: 'CRUISE' },
  'emad': { range: 1700, apogee: 320, type: 'MRBM' },
  'khorramshahr': { range: 2000, apogee: 400, type: 'MRBM' },
  'khorramshahr-2': { range: 2000, apogee: 400, type: 'MRBM' },
  'khorramshahr-4-kheybar': { range: 2000, apogee: 400, type: 'MRBM' },
  'zolfaghar': { range: 700, apogee: 120, type: 'SRBM' },
  'hormuz-2': { range: 300, apogee: 50, type: 'ASBM' },
  'hormuz-1': { range: 300, apogee: 50, type: 'ASBM' },
  'hormuz': { range: 300, apogee: 50, type: 'ASBM' },
  'dezful': { range: 1000, apogee: 180, type: 'SRBM' },
  'hoveizeh': { range: 1350, apogee: 100, type: 'CRUISE' },
  'kheybar-shekan': { range: 1400, apogee: 280, type: 'MRBM' },
  'fattah': { range: 1400, apogee: 300, type: 'HYPERSONIC' },
  'fattah-1': { range: 1400, apogee: 300, type: 'HYPERSONIC' },
  'abu-mahdi': { range: 1000, apogee: 80, type: 'CRUISE' },
  'zelzal': { range: 200, apogee: 50, type: 'ARTILLERY' },
  'ghaem-100': { range: 500, apogee: 200, type: 'SLV' },
  'ghasem-basir': { range: 1200, apogee: 200, type: 'SRBM' },
  'salman': { range: 300, apogee: 100, type: 'SOUNDING' },
  'shahid-haj-ghasem-soleimani': { range: 1400, apogee: 280, type: 'MRBM' },
  'unknown': { range: 500, apogee: 100, type: 'UNKNOWN' },

  // India missiles
  'slv-3': { range: 500, apogee: 200, type: 'SLV' },
  'aslv': { range: 500, apogee: 200, type: 'SLV' },
  'prithvi': { range: 150, apogee: 50, type: 'SRBM' },
  'prithvi-2': { range: 250, apogee: 80, type: 'SRBM' },
  'prithvi-3': { range: 350, apogee: 100, type: 'SRBM' },
  'agni-td': { range: 800, apogee: 200, type: 'MRBM' },
  'agni-1': { range: 700, apogee: 180, type: 'MRBM' },
  'agni-2': { range: 2000, apogee: 350, type: 'MRBM' },
  'agni-3': { range: 3500, apogee: 500, type: 'IRBM' },
  'agni-4': { range: 4000, apogee: 600, type: 'IRBM' },
  'agni-5': { range: 5500, apogee: 800, type: 'ICBM' },
  'pslv': { range: 500, apogee: 300, type: 'SLV' },
  'gslv-mk-1': { range: 500, apogee: 250, type: 'SLV' },
  'gslv-mk-2': { range: 500, apogee: 280, type: 'SLV' },
  'gslv-mk-3': { range: 500, apogee: 320, type: 'SLV' },
  'brahmos': { range: 290, apogee: 40, type: 'CRUISE' },
  'dhanush': { range: 350, apogee: 80, type: 'SRBM' },
  'aad': { range: 200, apogee: 150, type: 'ABM' },
  'k-15': { range: 700, apogee: 100, type: 'SLBM' },
  'k-4': { range: 3500, apogee: 200, type: 'SLBM' },
  'shaurya': { range: 700, apogee: 80, type: 'SRBM' },
  'nirbhay': { range: 1000, apogee: 60, type: 'CRUISE' },
  'pdv-mk-ii': { range: 300, apogee: 200, type: 'ABM' },

  // Pakistan missiles
  'hatf-1': { range: 80, apogee: 30, type: 'SRBM' },
  'hatf-2': { range: 180, apogee: 50, type: 'SRBM' },
  'ghaznavi': { range: 290, apogee: 80, type: 'SRBM' },
  'ghauri-1': { range: 1500, apogee: 300, type: 'MRBM' },
  'ghauri-2': { range: 1800, apogee: 350, type: 'MRBM' },
  'ghauri-3': { range: 3000, apogee: 500, type: 'IRBM' },
  'shaheen-1': { range: 750, apogee: 150, type: 'SRBM' },
  'shaheen-1a': { range: 900, apogee: 180, type: 'SRBM' },
  'shaheen-2': { range: 2000, apogee: 350, type: 'MRBM' },
  'shaheen-3': { range: 2750, apogee: 450, type: 'MRBM' },
  'babur': { range: 700, apogee: 50, type: 'CRUISE' },
  'babur-2': { range: 750, apogee: 55, type: 'CRUISE' },
  'babur-3': { range: 450, apogee: 40, type: 'SLCM' },
  'babur-1b': { range: 700, apogee: 50, type: 'CRUISE' },
  'raad': { range: 350, apogee: 30, type: 'ALCM' },
  'raad-2': { range: 550, apogee: 45, type: 'ALCM' },
  'nasr': { range: 60, apogee: 20, type: 'TACTICAL' },
  'ababeel': { range: 2200, apogee: 400, type: 'MIRV' },
  'harba': { range: 700, apogee: 50, type: 'CRUISE' },
  'unknown-3': { range: 500, apogee: 100, type: 'UNKNOWN' },
};

// Calculate apogee based on range (minimum energy trajectory approximation)
function calculateApogee(range) {
  if (range <= 0) return 50;
  // Approximate apogee for ballistic trajectory: h ≈ R/4 for short ranges
  // More accurate: h = (R/2) * tan(θ/2) where θ is launch angle (typically 45° for max range)
  // For 45°: apogee ≈ range/4 for short ranges, approaches range/2 for ICBM
  if (range < 1000) return Math.round(range / 4 + 50);
  if (range < 3000) return Math.round(range / 3.5 + 100);
  return Math.round(range / 3 + 150);
}

// Get bearing based on country and typical test directions
function getBearing(country, facility, missile) {
  const bearings = {
    iran: {
      default: 135, // Southeast toward desert
      'qom-launch-site': 135,
      'kermanshah-region': 120,
      'semnan-launch-site': 90,
      'shahroud-launch-site': 90,
      'garmsar-launch-site': 90,
      'azarshahr-launch-site': 45,
    },
    india: {
      default: 90, // East toward Bay of Bengal
      'satish-dhawan-space-centre': 135,
      'chandipur': 90,
      'abdul-kalam-island': 135,
    },
    pakistan: {
      default: 180, // South toward Arabian Sea
      'sonmiani': 180,
      'tilla': 135,
    }
  };
  
  return (bearings[country] && bearings[country][facility]) || bearings[country]?.default || 90;
}

// Convert facility name to code
function facilityToCode(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Transform facility data
function transformFacilityData(inputData, country) {
  const facilities = {};
  
  for (const [name, coords] of Object.entries(inputData)) {
    if (name === 'nan') continue;
    const code = facilityToCode(name);
    facilities[code] = {
      name: name,
      lat: coords.latitude || coords.lat || 0,
      lon: coords.longitude || coords.lon || 0
    };
  }
  
  return { facilities };
}

// Transform test data
function transformTestData(inputData, country, facilityMap) {
  const timeBins = [];
  
  for (const bin of inputData.timeBins) {
    const newBin = {
      year: bin.year,
      data: []
    };
    
    for (const test of bin.data) {
      const missileName = test.name || test.missile || 'unknown';
      const missileCode = facilityToCode(missileName);
      const facilityName = test.location || test.facility || 'unknown';
      const facilityCode = facilityToCode(facilityName);
      
      // Get missile specs
      const specs = missileSpecs[missileCode] || missileSpecs['unknown'];
      const range = specs ? specs.range : 500;
      const apogee = test.apogee || (specs ? specs.apogee : calculateApogee(range));
      const bearing = test.bearing || getBearing(country, facilityCode, missileCode);
      
      const newTest = {
        date: test.date,
        missile: missileCode,
        facility: facilityCode,
        outcome: test.status || test.outcome || 'unknown',
        series: test.series || 1,
        time: test.time || 'unknown',
        landing: test.landing || 'unknown',
        apogee: apogee,
        distance: range,
        bearing: bearing,
        description: test.description || `${missileName} test from ${facilityName}`
      };
      
      newBin.data.push(newTest);
    }
    
    timeBins.push(newBin);
  }
  
  return { timeBins };
}

// Process each country
const countries = ['iran', 'india', 'pakistan'];

for (const country of countries) {
  console.log(`\n=== Processing ${country.toUpperCase()} ===`);
  
  const baseDir = `public/missile-viz/${country}/data`;
  
  // Read facility data
  const facilityFile = path.join(baseDir, 'facility.en.json');
  if (fs.existsSync(facilityFile)) {
    const facilityData = JSON.parse(fs.readFileSync(facilityFile, 'utf8'));
    const transformedFacility = transformFacilityData(facilityData, country);
    fs.writeFileSync(facilityFile, JSON.stringify(transformedFacility, null, ' '));
    console.log(`✅ Updated facility.en.json (${Object.keys(transformedFacility.facilities).length} facilities)`);
  }
  
  // Read test data
  const testFile = path.join(baseDir, 'test.en.json');
  if (fs.existsSync(testFile)) {
    const testData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    const transformedTest = transformTestData(testData, country);
    fs.writeFileSync(testFile, JSON.stringify(transformedTest, null, ' '));
    console.log(`✅ Updated test.en.json (${transformedTest.timeBins.length} years, ${transformedTest.timeBins.reduce((a,b) => a + b.data.length, 0)} tests)`);
  }
}

console.log('\n✅ All data files updated successfully!');
console.log('\nNext: Update dataloading.js to handle the new format');
