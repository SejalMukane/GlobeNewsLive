#!/usr/bin/env python3
"""
Transform country missile data to match the expected visualization format.
The visualization expects timeBins to have a 'year' property for each bin.
"""

import json
import os
from datetime import datetime
from collections import defaultdict
from pathlib import Path

def transform_missile_data(country: str, input_file: str, output_file: str):
    """
    Transform raw missile data into the visualization format.
    Groups data by year and adds required properties.
    """
    
    print(f"\nProcessing {country}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract test data - handle both formats
    if isinstance(data, dict) and 'timeBins' in data:
        test_records = []
        for bin_item in data.get('timeBins', []):
            test_records.extend(bin_item.get('data', []))
    else:
        test_records = data if isinstance(data, list) else []
    
    if not test_records:
        print(f"  ⚠️  No test records found in {input_file}")
        return
    
    # Group tests by year
    tests_by_year = defaultdict(list)
    min_year = None
    max_year = None
    
    for test in test_records:
        date_str = test.get('date', '')
        try:
            year = int(date_str.split('-')[0])
            tests_by_year[year].append(test)
            if min_year is None or year < min_year:
                min_year = year
            if max_year is None or year > max_year:
                max_year = year
        except (ValueError, IndexError):
            print(f"  ⚠️  Invalid date format: {date_str}")
            continue
    
    if not tests_by_year:
        print(f"  ⚠️  No valid test records found")
        return
    
    # Create timeBins structure grouped by year
    time_bins = []
    for year in sorted(tests_by_year.keys()):
        time_bins.append({
            'year': year,
            'data': tests_by_year[year]
        })
    
    # Create output structure
    output_data = {
        'timeBins': time_bins
    }
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"  [OK] Transformed {len(test_records)} tests")
    print(f"  [OK] Year range: {min_year} - {max_year}")
    print(f"  [OK] Written to {output_file}")


def main():
    base_dir = Path('public/missile-viz')
    
    # Countries to process
    countries = {
        'north-korea': 'data/test.en.json',
        'iran': 'iran/data/test.en.json',
        'india': 'india/data/test.en.json',
        'pakistan': 'pakistan/data/test.en.json'
    }
    
    for country, rel_path in countries.items():
        input_path = base_dir / rel_path
        if input_path.exists():
            output_path = input_path  # Overwrite in place
            transform_missile_data(country, str(input_path), str(output_path))
        else:
            print(f"⚠️  Not found: {input_path}")


if __name__ == '__main__':
    os.chdir('c:/Users/SEJAL MUKANE/Desktop/OpenScan/GlobeNewsLive')
    main()
    print("\n[SUCCESS] Data transformation complete!")
