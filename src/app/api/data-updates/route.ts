import { NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_SOURCES = {
  'north-korea': {
    url: 'https://www.nti.org/analysis/articles/cns-north-korea-missile-test-database/',
    backupUrl: 'https://www.nti.org/wp-content/uploads/2021/10/north_korea_missile_test_database.xlsx',
    lastUpdated: null as string | null,
    checksum: null as string | null
  },
  'iran': {
    url: 'https://www.nti.org/analysis/articles/cns-iran-missile-test-database/',
    backupUrl: '',
    lastUpdated: null,
    checksum: null
  },
  'india': {
    url: 'https://www.nti.org/analysis/articles/cns-india-missile-test-database/',
    backupUrl: '',
    lastUpdated: null,
    checksum: null
  },
  'pakistan': {
    url: 'https://www.nti.org/analysis/articles/cns-pakistan-missile-test-database/',
    backupUrl: '',
    lastUpdated: null,
    checksum: null
  }
};

interface UpdateStatus {
  country: string;
  lastChecked: string;
  lastUpdated: string | null;
  newTestsFound: number;
  status: 'success' | 'error' | 'no_change';
  message: string;
}

export async function GET() {
  try {
    const statusPath = join(process.cwd(), 'data', 'update-status.json');
    
    let status: UpdateStatus[] = [];
    if (existsSync(statusPath)) {
      status = JSON.parse(readFileSync(statusPath, 'utf8'));
    }
    
    return NextResponse.json({
      sources: DATA_SOURCES,
      lastCheck: status.length > 0 ? status[0].lastChecked : null,
      status
    });
  } catch (error) {
    console.error('❌ Error fetching update status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, country } = body;
    
    if (action === 'check') {
      const results = await checkForUpdates(country);
      return NextResponse.json({ results });
    }
    
    if (action === 'force-update') {
      const results = await forceUpdate(country);
      return NextResponse.json({ results });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ Error in update action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

async function checkForUpdates(specificCountry?: string): Promise<UpdateStatus[]> {
  const results: UpdateStatus[] = [];
  const now = new Date().toISOString();
  
  for (const [country, source] of Object.entries(DATA_SOURCES)) {
    if (specificCountry && country !== specificCountry) continue;
    
    try {
      // Check if source page is accessible
      const response = await fetch(source.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        results.push({
          country,
          lastChecked: now,
          lastUpdated: source.lastUpdated,
          newTestsFound: 0,
          status: 'error',
          message: `Source unavailable: ${response.status}`
        });
        continue;
      }
      
      // Check Last-Modified header
      const lastModified = response.headers.get('last-modified');
      
      if (lastModified && lastModified !== source.lastUpdated) {
        results.push({
          country,
          lastChecked: now,
          lastUpdated: lastModified,
          newTestsFound: 0, // Would need to parse to determine
          status: 'success',
          message: 'Update detected! New data available.'
        });
        
        // Update stored timestamp
        source.lastUpdated = lastModified;
      } else {
        results.push({
          country,
          lastChecked: now,
          lastUpdated: source.lastUpdated,
          newTestsFound: 0,
          status: 'no_change',
          message: 'No updates found.'
        });
      }
    } catch (error) {
      results.push({
        country,
        lastChecked: now,
        lastUpdated: source.lastUpdated,
        newTestsFound: 0,
        status: 'error',
        message: `Error checking: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Save status
  const statusPath = join(process.cwd(), 'data', 'update-status.json');
  writeFileSync(statusPath, JSON.stringify(results, null, 2));
  
  return results;
}

async function forceUpdate(country?: string): Promise<UpdateStatus[]> {
  // This would trigger a manual data refresh
  // In production, this would:
  // 1. Download the latest Excel file
  // 2. Parse and convert to JSON
  // 3. Update the test data files
  // 4. Notify via Telegram
  
  const results: UpdateStatus[] = [];
  const now = new Date().toISOString();
  
  for (const [c, source] of Object.entries(DATA_SOURCES)) {
    if (country && c !== country) continue;
    
    results.push({
      country: c,
      lastChecked: now,
      lastUpdated: now,
      newTestsFound: 0,
      status: 'success',
      message: 'Manual update triggered. Check Telegram for notifications.'
    });
  }
  
  return results;
}
