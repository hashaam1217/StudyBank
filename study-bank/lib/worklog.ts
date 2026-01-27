import fs from 'fs';
import path from 'path';

export interface WorklogEntry {
  action: 'log_hours' | 'bank_hours' | 'redeem_hours';
  timestamp: string;
  details: {
    hours: number;
    description?: string;
  };
}

export interface Worklog {
  userId: string;
  activities: WorklogEntry[];
  totalHoursLogged: number;
  totalHoursBanked: number;
  totalHoursRedeemed: number;
  unbankedHours: number; // Logged hours that haven't been banked yet
  lastActive: string;
}

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
  return JSON.parse(data);
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
