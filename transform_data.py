import json
import os
from datetime import datetime

countries = ["iran", "india", "pakistan"]

for country in countries:
    source_file = f"public/missile-data/{country}_missiles.json"
    dest_dir = f"public/missile-viz/{country}/data"
    
    if not os.path.exists(source_file):
        print(f"File not found: {source_file}")
        continue

    with open(source_file, 'r', encoding='utf-8') as f:
        source_data = json.load(f)

    # Flatten the data if it's already in timeBins
    raw_tests = []
    if "timeBins" in source_data:
        for bin in source_data["timeBins"]:
            raw_tests.extend(bin["data"])
    else:
        raw_tests = source_data

    # 1. test.en.json (Grouping by Year)
    years_map = {}
    for test in raw_tests:
        try:
            year = test['date'].split('-')[0]
            if year not in years_map:
                years_map[year] = []
            years_map[year].append(test)
        except:
            continue
    
    time_bins = []
    for year in sorted(years_map.keys()):
        time_bins.append({
            "year": int(year),
            "data": years_map[year]
        })
    
    with open(f"{dest_dir}/test.en.json", 'w', encoding='utf-8') as f:
        json.dump({"timeBins": time_bins}, f, indent=2)

    # 2. missile.en.json
    missiles = {}
    for test in raw_tests:
        name = test.get('name')
        if name and name not in missiles:
            # Source data might not have descriptions, using name as placeholder
            missiles[name] = {"description": name, "type": test.get('type', 'Unknown')}
    
    with open(f"{dest_dir}/missile.en.json", 'w', encoding='utf-8') as f:
        json.dump(missiles, f, indent=2)

    # 3. facility.en.json
    facilities = {}
    for test in raw_tests:
        loc = test.get('location')
        if loc and loc not in facilities:
            facilities[loc] = {
                "latitude": test.get('latitude', 0),
                "longitude": test.get('longitude', 0)
            }
    
    with open(f"{dest_dir}/facility.en.json", 'w', encoding='utf-8') as f:
        json.dump(facilities, f, indent=2)

    # 4. dict.en.json
    display_country = country.capitalize()
    dictionary = {
        "_title": f"{display_country} Missile Test Visualization",
        "_subtitle": f"An interactive visualization of missile tests by {display_country}",
        "about": "About",
        "date": "Date",
        "missile-name": "Missile Name",
        "missile-type": "Missile Type",
        "facility-name": "Facility Name",
        "status": "Status",
        "success": "Success",
        "failure": "Failure",
        "unknown": "Unknown"
    }
    
    with open(f"{dest_dir}/dict.en.json", 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, indent=2)

    print(f"Processed {country}")
