// Types and constants that can be used on both client and server

// Redemption multiplier: redeemed hours cost 0.4x of available balance
export const REDEMPTION_MULTIPLIER = 0.4;

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
