function loadMapOutlineImage(callback) {
	mapOutlineImage = new Image();
	mapOutlineImage.src = 'images/map_outline.png';
	mapOutlineImage.onload = callback;
}

function loadFacilityData(callback) {
	var xhr = new XMLHttpRequest();
	var dataPath = window.currentCountry ? window.currentCountry.dataPath : 'data/';
	var facilityFile = dataPath + 'facility.' + lang + '.json';
	
	xhr.open('GET', facilityFile, true);
	xhr.onreadystatechange = function() {
		if ( xhr.readyState === 4 && xhr.status === 200 ) {
			var rawData = JSON.parse( xhr.responseText );
			
			// Handle both old format (direct) and new format (with facilities wrapper)
			if (rawData.facilities) {
				latlonData = rawData;
			} else {
				// Convert old format to new format
				latlonData = { facilities: {} };
				for (var key in rawData) {
					if (key === 'nan') continue;
					var code = key.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
					latlonData.facilities[code] = {
						name: key,
						lat: rawData[key].latitude || rawData[key].lat || 0,
						lon: rawData[key].longitude || rawData[key].lon || 0
					};
				}
			}
			
			if( callback )
				callback();
		}
	};
	xhr.send( null );
}

function loadTestData(callback) {
	var dataPath = window.currentCountry ? window.currentCountry.dataPath : 'data/';
	var filePath = dataPath + 'test.' + lang + '.json';
	filePath = encodeURI( filePath );

	var xhr = new XMLHttpRequest();
	xhr.open( 'GET', filePath, true );
	xhr.onreadystatechange = function() {
		if ( xhr.readyState === 4 && xhr.status === 200 ) {
			var rawData = JSON.parse( xhr.responseText );
			timeBins = rawData.timeBins;

			maxValue = 0;
			startTime = timeBins[0].year;
			endTime = timeBins[timeBins.length - 1].year;
			timeLength = endTime - startTime;

			// Process each test to ensure missile lookup exists
			for( var i in timeBins ) {
				var bin = timeBins[i].data;
				for( var s in bin ) {
					var set = bin[s];
					
					// Ensure missile lookup exists - create fallback if not found
					if( !missileLookup[set.missile] ) {
						missileLookup[set.missile] = {
							name: set.missile.toUpperCase().replace(/-/g, ' '),
							description: set.missile,
							type: 'Unknown'
						};
					}
				}
			}

			if(callback)
				callback();
		}
	};
	xhr.send( null );
}

function loadMissileData( callback ){
	var dataPath = window.currentCountry ? window.currentCountry.dataPath : 'data/';
	var missileFile = dataPath + 'missile.' + lang + '.json';
	
	var cxhr = new XMLHttpRequest();
	cxhr.open( 'GET', missileFile, true );
	cxhr.onreadystatechange = function() {
		if ( cxhr.readyState === 4 && cxhr.status === 200 ) {
			var rawData = JSON.parse( cxhr.responseText );
			missileLookup = {};
			
			// Create lowercase keys for lookup and ensure name property exists
			for( var key in rawData ) {
				var normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
				var cleanKey = key.toLowerCase().trim();
				
				// Ensure name property exists
				if( !rawData[key].name ) {
					rawData[key].name = rawData[key].description || key;
				}
				
				// Store with multiple key variations
				missileLookup[normalizedKey] = rawData[key];
				missileLookup[cleanKey] = rawData[key];
				missileLookup[key.toLowerCase()] = rawData[key];
			}
			
			callback();
		}
	};
	cxhr.send( null );
}

function loadSatelliteData(callback) {
	var dataPath = window.currentCountry ? window.currentCountry.dataPath : 'data/';
	var satelliteFile = dataPath + 'satellite.' + lang + '.json';
	
	var cxhr = new XMLHttpRequest();
	cxhr.open('GET', satelliteFile, true);
	cxhr.onreadystatechange = function() {
		if (cxhr.readyState === 4 && cxhr.status === 200) {
			satelliteData = JSON.parse( cxhr.responseText );
			callback();
		}
	};
	cxhr.send(null);
}

function loadDictData(callback) {
	var dataPath = window.currentCountry ? window.currentCountry.dataPath : 'data/';
	var dictFile = dataPath + 'dict.' + lang + '.json';
	
	var cxhr = new XMLHttpRequest();
	cxhr.open('GET', dictFile, true);
	cxhr.onreadystatechange = function() {
		if (cxhr.readyState === 4 && cxhr.status === 200) {
			dict = JSON.parse(cxhr.responseText);
			callback();
		}
	};
	cxhr.send(null);
}

function loadAll(callback) {
	var callbackCount = 0;
	var finish = function() {
		if (++callbackCount >= 6) {
			console.log("finished read data file for", window.currentCountry ? window.currentCountry.name : 'unknown');
			callback();
		}
	};
	loadMapOutlineImage(finish);
	loadDictData(finish);
	loadFacilityData(finish);
	loadMissileData(finish);
	loadTestData(finish);
	loadSatelliteData(finish);
}
