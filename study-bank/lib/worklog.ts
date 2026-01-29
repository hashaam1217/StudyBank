import fs from 'fs';
import path from 'path';
import type { Worklog, WorklogEntry } from './types';
import { REDEMPTION_MULTIPLIER } from './types';

export { REDEMPTION_MULTIPLIER } from './types';
export type { Worklog, WorklogEntry } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKLOG_FILE = path.join(DATA_DIR, 'worklog.json');

export function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function worklogExists(): boolean {
  return fs.existsSync(WORKLOG_FILE);
}

export function createWorklog(): Worklog {
  ensureDataDirectory();
  
  const initialWorklog: Worklog = {
    userId: 'user_' + Date.now(),
    activities: [],
    totalHoursLogged: 0,
    totalHoursBanked: 0,
    totalHoursRedeemed: 0,
    unbankedHours: 0,
    lastActive: new Date().toISOString(),
  };
  
  fs.writeFileSync(WORKLOG_FILE, JSON.stringify(initialWorklog, null, 2));
  return initialWorklog;
}

export function readWorklog(): Worklog {
  if (!worklogExists()) {
    return createWorklog();
  }
  
  const data = fs.readFileSync(WORKLOG_FILE, 'utf-8');
  const worklog = JSON.parse(data) as Worklog;
  
  // Migration: Add unbankedHours if it doesn't exist
  if (worklog.unbankedHours === undefined) {
    // Calculate unbanked hours as total logged minus total banked
    worklog.unbankedHours = Math.max(0, worklog.totalHoursLogged - worklog.totalHoursBanked);
    writeWorklog(worklog);
  }
  
  return worklog;
}

export function writeWorklog(worklog: Worklog): void {
  ensureDataDirectory();
  fs.writeFileSync(WORKLOG_FILE, JSON.stringify(worklog, null, 2));
}

export function addEntry(action: WorklogEntry['action'], hours: number, description?: string): Worklog {
  const worklog = readWorklog();
  
  const entry: WorklogEntry = {
    action,
    timestamp: new Date().toISOString(),
    details: {
      hours,
      description,
    },
  };
  
  worklog.activities.push(entry);
  worklog.lastActive = entry.timestamp;
  
  // Update totals based on action
  if (action === 'log_hours') {
    worklog.totalHoursLogged += hours;
    worklog.unbankedHours += hours;
  } else if (action === 'bank_hours') {
    // When banking, move hours from unbanked to banked
    worklog.totalHoursBanked += hours;
    worklog.unbankedHours -= hours;
  } else if (action === 'redeem_hours') {
    worklog.totalHoursRedeemed += hours;
  }
  
  writeWorklog(worklog);
  return worklog;
}

export function bankAllHours(): Worklog {
  const worklog = readWorklog();
  
  if (worklog.unbankedHours > 0) {
    const entry: WorklogEntry = {
      action: 'bank_hours',
      timestamp: new Date().toISOString(),
      details: {
        hours: worklog.unbankedHours,
        description: 'Banked all available hours',
      },
    };
    
    worklog.activities.push(entry);
    worklog.lastActive = entry.timestamp;
    worklog.totalHoursBanked += worklog.unbankedHours;
    worklog.unbankedHours = 0;
    
    writeWorklog(worklog);
  }
  
  return worklog;
}

export function calculateDailyAverage(worklog: Worklog): number {
  const loggedActivities = worklog.activities.filter(a => a.action === 'log_hours');
  
  if (loggedActivities.length === 0) return 0;
  
  // Get the earliest activity date
  const timestamps = loggedActivities.map(a => new Date(a.timestamp).getTime());
  const earliestDate = new Date(Math.min(...timestamps));
  const now = new Date();
  
  // Calculate days since first activity
  const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Return average hours per day
  return worklog.totalHoursLogged / daysSinceStart;
}
