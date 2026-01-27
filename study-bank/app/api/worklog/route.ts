import { NextRequest, NextResponse } from 'next/server';
import { readWorklog, addEntry, bankAllHours } from '@/lib/worklog';

export async function GET() {
  try {
    const worklog = readWorklog();
    return NextResponse.json(worklog);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read worklog' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, hours, description } = body;
    
    // Special case for banking all hours
    if (action === 'bank_all') {
      const worklog = bankAllHours();
      return NextResponse.json(worklog);
    }
    
    if (!action || !hours) {
      return NextResponse.json(
        { error: 'Missing required fields: action and hours' },
        { status: 400 }
      );
    }
    
    if (!['log_hours', 'bank_hours', 'redeem_hours'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be log_hours, bank_hours, or redeem_hours' },
        { status: 400 }
      );
    }
    
    const worklog = addEntry(action, hours, description);
    return NextResponse.json(worklog);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add entry' },
      { status: 500 }
    );
  }
}
