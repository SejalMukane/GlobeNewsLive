// Country detection and configuration
(function() {
  // Detect country from URL path or query parameter
  var path = window.location.pathname;
  var search = window.location.search;
  console.log('🔍 Current path:', path);
  console.log('🔍 Current search:', search);
  
  // Try query parameter first
  var queryMatch = search.match(/[?&]country=([^&]+)/);
  var country = queryMatch ? queryMatch[1] : null;
  
  // Fallback: detect from path
  if (!country) {
    var countryMatch = path.match(/\/missile-viz\/([^\/]+)/);
    if (countryMatch && countryMatch[1] !== 'js' && countryMatch[1] !== 'css' && countryMatch[1] !== 'images') {
      country = countryMatch[1];
    }
  }
  
  // Default to north-korea
  if (!country) {
    country = 'north-korea';
  }
  
  console.log('🔍 Detected country:', country);
  
  // Country configurations
  window.countryConfig = {
    'north-korea': {
      name: 'North Korea',
      title: 'North Korea Missile Test Visualization',
      subtitle: 'An interactive visualization of flight tests of all missiles launched by North Korea from 1984 to 2026',
      loadingText: 'Loading North Korea Missile Test Data from 1984 to 2026. Please wait...',
      dataPath: 'data/',
      years: [1984, 1986, 1990, 1991, 1992, 1993, 1998, 2006, 2009, 2012, 2013, 2014, 2015, 2016, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
    },
    'iran': {
      name: 'Iran',
      title: 'Iran Missile Test Visualization',
      subtitle: 'An interactive visualization of flight tests of all missiles launched by Iran from 1985 to 2024',
      loadingText: 'Loading Iran Missile Test Data from 1985 to 2024. Please wait...',
      dataPath: 'data/',
      years: [1985, 1987, 1988, 1990, 1991, 1994, 1997, 1998, 1999, 2000, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
    },
    'india': {
      name: 'India',
      title: 'India Missile Test Visualization',
      subtitle: 'An interactive visualization of flight tests of all missiles launched by India from 1979 to 2020',
      loadingText: 'Loading India Missile Test Data from 1979 to 2020. Please wait...',
      dataPath: 'data/',
      years: [1979, 1980, 1983, 1986, 1988, 1989, 1990, 1991, 1992, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020]
    },
    'pakistan': {
      name: 'Pakistan',
      title: 'Pakistan Missile Test Visualization',
      subtitle: 'An interactive visualization of flight tests of all missiles launched by Pakistan from 1989 to 2024',
      loadingText: 'Loading Pakistan Missile Test Data from 1989 to 2024. Please wait...',
      dataPath: 'data/',
      years: [1989, 1990, 1992, 1993, 1994, 1997, 1998, 1999, 2000, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
    }
  };
  
  // Set current country config
  window.currentCountry = window.countryConfig[country] || window.countryConfig['north-korea'];
  window.currentCountryCode = country;
  
  console.log('🌍 Country detected:', country, '-', window.currentCountry.name);
})();