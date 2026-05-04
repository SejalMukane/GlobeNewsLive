#!/usr/bin/env python3
"""
Generate country-specific missile and facility databases from test data.
Creates proper lookup files that match the test records.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

def slugify(text):
    """Convert text to slug format (lowercase, hyphenated)."""
    return text.lower().replace(' ', '-').replace('_', '-')

def generate_country_databases(country: str, test_data_path: str, output_dir: str):
    """
    Generate missile and facility lookup files from test data.
    """
    
    print(f"\nGenerating databases for {country}...")
    
    with open(test_data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract all test records
    test_records = []
    for bin_item in data.get('timeBins', []):
        test_records.extend(bin_item.get('data', []))
    
    # Collect unique missiles and facilities
    missiles = {}
    facilities = {}
    
    for test in test_records:
        # Process missile
        missile_name = test.get('name', 'Unknown')
        missile_type = test.get('type', 'Unknown')
        missile_slug = slugify(missile_name)
        
        if missile_slug not in missiles:
            missiles[missile_slug] = {
                'name': missile_name,
                'type': missile_type
            }
        
        # Process facility
        location_name = test.get('location', 'Unknown')
        facility_slug = slugify(location_name)
        latitude = test.get('latitude')
        longitude = test.get('longitude')
        
        if facility_slug not in facilities:
            facilities[facility_slug] = {
                'name': location_name,
                'lat': latitude,
                'lon': longitude
            }
    
    # Add "unknown" entries if not present
    if 'unknown' not in missiles:
        missiles['unknown'] = {'name': 'Unknown', 'type': 'Unknown'}
    if 'unknown' not in facilities:
        facilities['unknown'] = {'name': 'Unknown', 'lat': 0, 'lon': 0}
    
    # Write missile database
    missile_output_path = os.path.join(output_dir, 'missile.en.json')
    with open(missile_output_path, 'w', encoding='utf-8') as f:
        json.dump(missiles, f, indent=1, ensure_ascii=False)
    print(f"  [OK] Created {missile_output_path} with {len(missiles)} missiles")
    
    # Write facility database
    facility_output_path = os.path.join(output_dir, 'facility.en.json')
    facility_data = {'facilities': facilities}
    with open(facility_output_path, 'w', encoding='utf-8') as f:
        json.dump(facility_data, f, indent=1, ensure_ascii=False)
    print(f"  [OK] Created {facility_output_path} with {len(facilities)} facilities")
    
    return missiles, facilities, test_records

def transform_test_data_with_slugs(test_records, missiles, facilities, output_path):
    """
    Transform test data to use missile and facility slugs instead of names.
    """
    
    transformed_records = []
    
    for test in test_records:
        missile_name = test.get('name', 'Unknown')
        missile_slug = slugify(missile_name)
        
        location_name = test.get('location', 'Unknown')
        facility_slug = slugify(location_name)
        
        # Create transformed record
        transformed = {
            'date': test.get('date', ''),
            'missile': missile_slug,
            'facility': facility_slug,
            'outcome': test.get('status', 'unknown'),
            'series': 1
        }
        
        # Preserve any additional fields
        for key, value in test.items():
            if key not in ['name', 'type', 'location', 'latitude', 'longitude', 'status']:
                transformed[key] = value
        
        transformed_records.append(transformed)
    
    # Group by year
    from collections import defaultdict
    by_year = defaultdict(list)
    
    for record in transformed_records:
        try:
            year = int(record['date'].split('-')[0])
            by_year[year].append(record)
        except (ValueError, IndexError):
            pass
    
    # Create timeBins structure
    time_bins = []
    for year in sorted(by_year.keys()):
        time_bins.append({
            'year': year,
            'data': by_year[year]
        })
    
    output_data = {'timeBins': time_bins}
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=1, ensure_ascii=False)
    
    print(f"  [OK] Transformed test data -> {output_path}")

def main():
    base_dir = Path('public/missile-viz')
    
    countries = {
        'north-korea': 'data',
        'iran': 'iran/data',
        'india': 'india/data',
        'pakistan': 'pakistan/data'
    }
    
    for country, rel_path in countries.items():
        data_dir = base_dir / rel_path
        if data_dir.exists():
            test_file = data_dir / 'test.en.json'
            if test_file.exists():
                missiles, facilities, tests = generate_country_databases(
                    country, 
                    str(test_file),
                    str(data_dir)
                )
                transform_test_data_with_slugs(tests, missiles, facilities, str(test_file))
            else:
                print(f"  [SKIP] test.en.json not found")
        else:
            print(f"  [SKIP] Directory not found: {data_dir}")

if __name__ == '__main__':
    os.chdir('c:/Users/SEJAL MUKANE/Desktop/OpenScan/GlobeNewsLive')
    main()
    print("\n[SUCCESS] Database generation complete!")
