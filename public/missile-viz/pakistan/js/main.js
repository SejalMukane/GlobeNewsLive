var masterContainer = document.getElementById('visualization');

var mapOutlineImage;

//	where in html to hold all our things
var glContainer = document.getElementById( 'glContainer' );
var dpr = window.devicePixelRatio ? window.devicePixelRatio : 1;

var lang = getLang();
var dict;

//	contains a list of facility codes with their matching facility names
var facilityFile = 'data/facility.' + lang + '.json';
var missileFile = 'data/missile.' + lang + '.json';
var satelliteFile = 'data/satellite.' + lang + '.json';
var dictFile = 'data/dict.' + lang + '.json';

var camera, scene, renderer;
var camera2s, scene2d;

var baseHue = Math.random();
var sphere;
var rotating;
var visualizationMesh;

//	contains the data loaded from the test data file
//	contains a list of years, followed by tests within that year
var timeBins;

//	contains latlon data for each facility
var latlonData;

//	contains above but organized as a mapped list via ['facilityname'] = facilityobject
//	each facility object has data like center of facility in 3d space, lat lon and facility name
var facilityData = new Object();
var testData = new Object();

//	contains a list of missile code to missile name for running lookups
var missileLookup;

var satelliteData;

var yearIndexLookup = {};
var selectableTests = [];
var summary;

//	a list of outcome 'codes'
//	now they are just strings of categories
//	Outcome Code : Outcome Node
var outcomeLookup = {
	'success': 'Success',
	'failure': 'Failure',
	'unknown': 'Unknown'
};

// Dynamic missile colors based on loaded data
function generateMissileColors() {
	var colors = {};
	var hue = Math.random();
	var goldenRatio = 0.618033988749895;
	
	if (missileLookup) {
		var index = 0;
		for (var missileCode in missileLookup) {
			hue += goldenRatio;
			hue = hue % 1;
			var h = Math.floor(hue * 360);
			var s = 70 + (index % 2) * 20; // 70% or 90% saturation
			var l = 40 + (index % 3) * 15; // 40%, 55%, or 70% lightness
			colors[missileCode] = hslToHex(h, s, l);
			index++;
		}
	}
	return colors;
}

function hslToHex(h, s, l) {
	s /= 100;
	l /= 100;
	var c = (1 - Math.abs(2 * l - 1)) * s;
	var x = c * (1 - Math.abs((h / 60) % 2 - 1));
	var m = l - c / 2;
	var r, g, b;
	
	if (h < 60) { r = c; g = x; b = 0; }
	else if (h < 120) { r = x; g = c; b = 0; }
	else if (h < 180) { r = 0; g = c; b = x; }
	else if (h < 240) { r = 0; g = x; b = c; }
	else if (h < 300) { r = x; g = 0; b = c; }
	else { r = c; g = 0; b = x; }
	
	var hex = ((Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255)).toString(16);
	return parseInt('0x' + hex.padStart(6, '0'));
}

// Initialize missile colors after data is loaded
var missileColors = {};

//	the currently selected test
var selectedTest = null;
var previouslySelectedTest = null;

//	contains info about what year, what tests, outcomes, missiles, etc that's being visualized
var selectionData;

var lastUpdate = 0;

function getLang() {
	var lang = '';
	var match = location.search.match(/lang=(.*?)(&|$)/);
	//var match = location.href.match(/\/([a-z]{2})\/[^\/]*$/);
	if (match) {
		lang = decodeURIComponent(match[1]).substring(0, 2);
	}
	if (lang === 'ja' || lang === 'en') {
		return lang;
	}
	lang = (window.navigator.languages && window.navigator.languages[0]) ||
		window.navigator.language ||
		window.navigator.userLanguage ||
		window.navigator.browserLanguage;
	return (lang && lang.substring(0, 2) === 'ja') ? 'ja' : 'en';
}

function loadLangCSS(lang) {
	if (lang !== 'en') {
		var tags = document.createDocumentFragment();
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = 'css/style.' + lang + '.css';
		tags.appendChild(link);
		document.getElementsByTagName('head')[0].appendChild(tags);
	}
}

//	TODO
//	use underscore and ".after" to load these in order
//	don't look at me I'm ugly
function start(e) {
	//	detect for webgl and reject everything else
	if (!Detector.webgl) {
		Detector.addGetWebGLMessage();
	} else {
		loadLangCSS(lang);
		loadAll(function() {
			// Generate dynamic missile colors after data is loaded
			missileColors = generateMissileColors();
			console.log('🎨 Generated colors for', Object.keys(missileColors).length, 'missiles');
			
			document.title = dict['_title'];
			initScene();
			animate();
		});
	};
}



var Selection = function(selectedYear, selectedTest) {
	this.selectedYear = selectedYear;
	this.selectedTest = selectedTest;

	this.outcomeCategories = new Object();
	for (var i in outcomeLookup) {
		this.outcomeCategories[i] = true;
	}
	this.missileCategories = new Object();
	for (var i in missileLookup) {
		this.missileCategories[i] = true;
	}

	this.getOutcomeCategories = function() {
		var list = [];
		for (var i in this.outcomeCategories) {
			if (this.outcomeCategories[i]) {
				list.push(i);
			}
		}
		return list;
	}

	this.getMissileCategories = function() {
		var list = [];
		for (var i in this.missileCategories) {
			if (this.missileCategories[i]) {
				list.push(i);
			}
		}
		return list;
	}
};

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
	//	Let's make a scene
	scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;
	// scene.fog = new THREE.FogExp2( 0xBBBBBB, 0.00003 );

	scene2d = new THREE.Scene();

	scene.add( new THREE.AmbientLight( 0x505050 ) );

	light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730;
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );

	light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = -640;
	light2.position.y = -500;
	light2.position.z = -1000;
	scene.add( light2 );

	rotating = new THREE.Object3D();
	scene.add(rotating);

	var outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;
	// outlinedMapTexture.magFilter = THREE.NearestFilter;
	// outlinedMapTexture.minFilter = THREE.NearestFilter;

	var mapMaterial = new THREE.MeshBasicMaterial({
		map: outlinedMapTexture,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1
	});


	//	-----------------------------------------------------------------------------
	sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 100, 40, 40 ), mapMaterial );
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";
	rotating.add( sphere );


	var wireframeGeo = new THREE.EdgesGeometry(sphere.geometry, 0.3);
	var wireframeMaterial = new THREE.LineBasicMaterial({
		color: new THREE.Color().setHSL(baseHue, 1, 0.33),
		linewidth: 0.5
	});
	var wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
	sphere.add(wireframe);

	var atmosphereMaterial = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('vertexShaderAtmosphere').textContent,
		fragmentShader: document.getElementById('fragmentShaderAtmosphere').textContent,
		// atmosphere should provide light from behind the sphere, so only render the back side
		side: THREE.BackSide
	});

	var atmosphere = new THREE.Mesh(sphere.geometry.clone(), atmosphereMaterial);
	atmosphere.scale.x = atmosphere.scale.y = atmosphere.scale.z = 2.25;
	rotating.add(atmosphere);

	for( var i in timeBins ){
		var bin = timeBins[i].data;
		for( var s in bin ){
			var set = bin[s];

			var seriesPostfix = set.series ? ' [' + set.series + ']' : '';
			var missileName = missileLookup[set.missile] ? missileLookup[set.missile].name : 'Unknown Missile';
			var testName = (set.date + ' ' + missileName + seriesPostfix).toUpperCase();

			selectableTests.push( testName );
		}
	}

	console.log( selectableTests );

	// load geo data (facility lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );
	console.timeEnd('loadGeoData');

	console.time('buildDataVizGeometries');
	var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);

	var latestBin = timeBins[timeBins.length - 1];
	var selectedYear = latestBin.year;

	var latestTest = latestBin.data[latestBin.data.length - 1];
	var selectedTestName = latestTest.testName;

	selectionData = new Selection(selectedYear, selectedTestName);

	selectVisualization(timeBins, selectedYear, [selectedTestName], Object.keys(outcomeLookup), Object.keys(missileLookup));


	//	-----------------------------------------------------------------------------
	//	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias: false});
	renderer.setPixelRatio(dpr);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	renderer.sortObjects = false;
	renderer.generateMipmaps = false;

	glContainer.appendChild( renderer.domElement );


	// Detect passive event support
	var passive = false;
	var options = Object.defineProperty({}, 'passive', {
		get: function() {
			passive = true;
		}
	});
	document.addEventListener('testPassiveEventSupport', function() {}, options);
	document.removeEventListener('testPassiveEventSupport', function() {}, options);

	//	-----------------------------------------------------------------------------
	//	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'touchmove', onDocumentMouseMove, passive ? { capture: true, passive: false } : true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	//masterContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );
	//masterContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, true );
	document.addEventListener( 'touchstart', onDocumentMouseDown, passive ? { capture: true, passive: false } : true );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'touchend', onDocumentMouseUp, false );
	document.addEventListener( 'touchcancel', onDocumentMouseUp, false );

	var mc = new Hammer(document);
	mc.get('pinch').set({ enable: true });
	mc.get('pan').set({ threshold: 0, pointers: 3, direction: Hammer.DIRECTION_VERTICAL });
	mc.on('pinchstart pinchmove', onDocumentPinch);
	mc.on('panmove', onDocumentPan);

	masterContainer.addEventListener( 'click', onClick, true );
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );

	//	firefox
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
			var evt=window.event || e; //equalize event object
			onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false);

	//	-----------------------------------------------------------------------------
	//	Setup our camera
	var aspect = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(12 / Math.min(aspect, 1), aspect, 1, 20000);
	camera.position.z = 400;
	camera.position.y = 0;
	camera.lookAt(scene.position);
	camera.zoom = 0.5;
	scene.add( camera );

	camera2d = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, 1, 20000);
	camera2d.position.z = 400;
	camera2d.position.y = 0;
	camera.lookAt(scene2d.position);

	var windowResize = THREEx.WindowResize(renderer, camera, camera2d);
}


function animate() {
	var now = performance.now();
	var delta = Math.min(now - lastUpdate, 1000 / 60);

	//	Disallow roll for now, this is interfering with keyboard input during search
/*
	if(keyboard.pressed('o') && keyboard.pressed('shift') == false)
		camera.rotation.z -= 0.08;
	if(keyboard.pressed('p') && keyboard.pressed('shift') == false)
		camera.rotation.z += 0.08;
*/

	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012 * delta / (1000 / 60);
		rotateVY += (rotateTargetY - rotateY) * 0.012 * delta / (1000 / 60);

		// var move = new THREE.Vector3( rotateVX, rotateVY, 0 );
		// var distance = move.length();
		// if( distance > .01 )
		// 	distance = .01;
		// move.normalize();
		// move.multiplyScalar( distance );

		// rotateVX = move.x;
		// rotateVy = move.y;

		if( Math.abs(rotateTargetX - rotateX) < 0.02 && Math.abs(rotateTargetY - rotateY) < 0.02 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}

	rotateX += rotateVX * delta / (1000 / 60);
	rotateY += rotateVY * delta / (1000 / 60);

	//rotateY = wrap( rotateY, -Math.PI, Math.PI );

	rotateVX *= 1 - 0.02 * delta / (1000 / 60);
	rotateVY *= 1 - 0.02 * delta / (1000 / 60);

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 1 - 0.4 * delta / (1000 / 60);
		rotateVY *= 1 - 0.4 * delta / (1000 / 60);
	}

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -(1 - 0.05 * delta / (1000 / 60));
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -(1 - 0.05 * delta / (1000 / 60));
	}

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;

	if (tiltTarget !== undefined) {
		tilt += (tiltTarget - tilt) * 0.012 * delta / (1000 / 60);
		camera.position.y = 300 * Math.sin(-tilt);
		camera.position.z = 100 + 300 * Math.cos(-tilt);
		camera.lookAt(new THREE.Vector3(0, 0, 100));

		if (Math.abs(tiltTarget - tilt) < 0.05) {
			tiltTarget = undefined;
		}
	}

	if (scaleTarget !== undefined) {
		camera.zoom *= Math.pow(scaleTarget / camera.zoom, 0.012 * delta / (1000 / 60));
		camera.updateProjectionMatrix();

		if (Math.abs(Math.log(scaleTarget / camera.zoom)) < 0.05) {
			scaleTarget = undefined;
		}
	}

	render();

	requestAnimationFrame( animate );


	rotating.traverse(function(mesh) {
		if (mesh.update !== undefined) {
			mesh.update(delta);
		}
	});

	updateMarkers();
	updateSatellites();
	render2d();

	lastUpdate = now;
}

function render() {
	renderer.clear();
	renderer.render( scene, camera );
}

function render2d() {
	renderer.render( scene2d, camera2d );
}

function getHistoricalData() {
	var history = [];

	var outcomeCategories = selectionData.getOutcomeCategories();
	var missileCategories = selectionData.getMissileCategories();

	for( var i in timeBins ){
		var yearBin = timeBins[i].data;
		var value = {successes: 0, failures: 0, unknowns: 0};
		for( var s in yearBin ){
			var set = yearBin[s];
			var outcomeName = set.outcome;
			var missileName = set.missile;

			var relevantCategory = ( $.inArray(outcomeName, outcomeCategories ) >= 0 ) &&
								   ( $.inArray(missileName, missileCategories ) >= 0 );

			if( relevantCategory == false )
				continue;

			if( outcomeName === 'success' )
				value.successes++;
			else if( outcomeName === 'failure' )
				value.failures++;
			else
				value.unknowns++;
		}
		history.push(value);
	}
	// console.log(history);
	return history;
}
