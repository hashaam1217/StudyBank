import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Session {
  duration: number;
  timestamp: string;
  date: string;
}

interface Transaction {
  id: string;
  type: 'bank' | 'redeem' | 'manual_add';
  amount: number;
  timestamp: string;
  description: string;
}

interface StudyData {
  currentSessionSeconds: number;
  bankedSeconds: number;
  recreationSeconds: number;
  totalStudySeconds: number;
  sessions: Session[];
  transactions: Transaction[];
  lastStudyDate: string | null;
}

interface Achievement {
  title: string;
  desc: string;
}

function App() {
  const [data, setData] = useState<StudyData>({
    currentSessionSeconds: 0,
    bankedSeconds: 0,
    recreationSeconds: 0,
    totalStudySeconds: 0,
    sessions: [],
    transactions: [],
    lastStudyDate: null
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [manualAddInput, setManualAddInput] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [buttonFeedback, setButtonFeedback] = useState<{bank: boolean, redeem: boolean}>({
    bank: false,
    redeem: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studyBankData');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studyBankData', JSON.stringify(data));
  }, [data]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Format seconds to hours with 1 decimal
  const formatHours = (seconds: number): string => {
    return (seconds / 3600).toFixed(1);
  };

  // Timer functions
  const startTimer = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    
    timerInterval.current = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(newElapsed);
      setData(prev => ({ ...prev, currentSessionSeconds: newElapsed }));
    }, 100);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    
    setIsRunning(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const stopTimer = () => {
    if (elapsedTime === 0) return;
    
    setIsRunning(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    // Save session
    const session: Session = {
      duration: elapsedTime,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    };

    setData(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      totalStudySeconds: prev.totalStudySeconds + elapsedTime,
      lastStudyDate: new Date().toDateString(),
      currentSessionSeconds: 0
    }));
    
    // Reset timer
    setElapsedTime(0);
    
    // Check achievements
    setTimeout(() => checkAchievements(session), 100);
  };

  const bankHours = () => {
    if (data.currentSessionSeconds === 0) {
      alert('No hours to bank! Complete a study session first.');
      return;
    }
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'bank',
      amount: data.currentSessionSeconds,
      timestamp: new Date().toISOString(),
      description: `Banked ${formatHours(data.currentSessionSeconds)}h from study session`
    };

    setData(prev => ({
      ...prev,
      bankedSeconds: prev.bankedSeconds + prev.currentSessionSeconds,
      currentSessionSeconds: 0,
      transactions: [transaction, ...prev.transactions]
    }));
    
    // Visual feedback
    setButtonFeedback(prev => ({ ...prev, bank: true }));
    setTimeout(() => {
      setButtonFeedback(prev => ({ ...prev, bank: false }));
    }, 1500);
  };

  const redeemHours = () => {
    const hoursToRedeem = parseFloat(redeemInput);
    
    if (isNaN(hoursToRedeem) || hoursToRedeem <= 0) {
      alert('Please enter a valid number of hours.');
      return;
    }
    
    const secondsToRedeem = hoursToRedeem * 3600;
    
    if (secondsToRedeem > data.bankedSeconds) {
      alert('Insufficient banked hours!');
      return;
    }
    
    const recreationEarned = secondsToRedeem * 0.4;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'redeem',
      amount: secondsToRedeem,
      timestamp: new Date().toISOString(),
      description: `Redeemed ${hoursToRedeem}h for ${formatHours(recreationEarned)}h recreation (0.4x)`
    };

    setData(prev => ({
      ...prev,
      bankedSeconds: prev.bankedSeconds - secondsToRedeem,
      recreationSeconds: prev.recreationSeconds + recreationEarned,
      transactions: [transaction, ...prev.transactions]
    }));
    
    setRedeemInput('');
    
    // Visual feedback
    setButtonFeedback(prev => ({ ...prev, redeem: true }));
    setTimeout(() => {
      setButtonFeedback(prev => ({ ...prev, redeem: false }));
    }, 1500);
  };

  const manualAddHours = () => {
    const hoursToAdd = parseFloat(manualAddInput);
    
    if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
      alert('Please enter a valid number of hours.');
      return;
    }
    
    const secondsToAdd = hoursToAdd * 3600;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'manual_add',
      amount: secondsToAdd,
      timestamp: new Date().toISOString(),
      description: `Manually added ${hoursToAdd}h to bank`
    };

    setData(prev => ({
      ...prev,
      bankedSeconds: prev.bankedSeconds + secondsToAdd,
      totalStudySeconds: prev.totalStudySeconds + secondsToAdd,
      transactions: [transaction, ...prev.transactions]
    }));
    
    setManualAddInput('');
    alert(`Successfully added ${hoursToAdd}h to your bank!`);
  };

  const deleteTransaction = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    if (!confirm('Are you sure you want to delete this transaction? This will reverse its effects.')) {
      return;
    }

    setData(prev => {
      let newData = { ...prev };
      
      // Reverse the transaction effects
      if (transaction.type === 'bank') {
        newData.bankedSeconds -= transaction.amount;
      } else if (transaction.type === 'redeem') {
        newData.bankedSeconds += transaction.amount;
        newData.recreationSeconds -= transaction.amount * 0.4;
      } else if (transaction.type === 'manual_add') {
        newData.bankedSeconds -= transaction.amount;
        newData.totalStudySeconds -= transaction.amount;
      }
      
      // Remove transaction from list
      newData.transactions = prev.transactions.filter(t => t.id !== id);
      
      return newData;
    });
  };

  const startEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount((transaction.amount / 3600).toFixed(1));
  };

  const saveEditTransaction = () => {
    if (!editingTransaction) return;
    
    const newHours = parseFloat(editAmount);
    if (isNaN(newHours) || newHours <= 0) {
      alert('Please enter a valid number of hours.');
      return;
    }
    
    const newSeconds = newHours * 3600;
    const oldSeconds = editingTransaction.amount;
    const difference = newSeconds - oldSeconds;

    setData(prev => {
      let newData = { ...prev };
      
      // Update transaction amount
      const transactionIndex = prev.transactions.findIndex(t => t.id === editingTransaction.id);
      if (transactionIndex !== -1) {
        const updatedTransaction = { 
          ...editingTransaction, 
          amount: newSeconds,
          description: editingTransaction.description.replace(
            formatHours(oldSeconds) + 'h',
            formatHours(newSeconds) + 'h'
          )
        };
        newData.transactions = [...prev.transactions];
        newData.transactions[transactionIndex] = updatedTransaction;
      }
      
      // Adjust balances based on transaction type
      if (editingTransaction.type === 'bank') {
        newData.bankedSeconds += difference;
      } else if (editingTransaction.type === 'redeem') {
        newData.bankedSeconds -= difference;
        newData.recreationSeconds += difference * 0.4;
      } else if (editingTransaction.type === 'manual_add') {
        newData.bankedSeconds += difference;
        newData.totalStudySeconds += difference;
      }
      
      return newData;
    });
    
    setEditingTransaction(null);
    setEditAmount('');
  };

  const calculateStreak = (): number => {
    if (data.sessions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().toDateString();
    
    // Check if studied today
    if (data.lastStudyDate === today) {
      streak = 1;
    } else {
      return 0;
    }
    
    // Count backwards
    const checkDate = new Date();
    for (let i = 1; i < 365; i++) {
      checkDate.setDate(checkDate.getDate() - 1);
      const dateStr = checkDate.toDateString();
      const hasSession = data.sessions.some(s => new Date(s.timestamp).toDateString() === dateStr);
      
      if (hasSession) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const checkAchievements = (lastSession: Session) => {
    const newAchievements: Achievement[] = [];
    
    // First session
    if (data.sessions.length === 1) {
      newAchievements.push({
        title: '🎯 First Step',
        desc: 'Completed your first study session!'
      });
    }
    
    // 10 hours milestone
    const totalHours = data.totalStudySeconds / 3600;
    if (totalHours >= 10 && totalHours < 12) {
      newAchievements.push({
        title: '⭐ 10 Hour Club',
        desc: "You've studied for 10+ hours total!"
      });
    }
    
    // 7 day streak
    const streak = calculateStreak();
    if (streak === 7) {
      newAchievements.push({
        title: '🔥 Week Warrior',
        desc: '7 day study streak achieved!'
      });
    }
    
    // Long session (2+ hours)
    if (lastSession.duration >= 7200) {
      newAchievements.push({
        title: '💪 Marathon Mind',
        desc: 'Completed a 2+ hour study session!'
      });
    }
    
    setAchievements(newAchievements);
    
    // Clear achievements after 5 seconds
    setTimeout(() => setAchievements([]), 5000);
  };

  // Calculate metrics
  const avgSeconds = data.sessions.length > 0 ? data.totalStudySeconds / data.sessions.length : 0;
  const longestSeconds = data.sessions.length > 0 ? Math.max(...data.sessions.map(s => s.duration)) : 0;
  
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklySeconds = data.sessions
    .filter(s => new Date(s.timestamp) > oneWeekAgo)
    .reduce((sum, s) => sum + s.duration, 0);
  
  const streak = calculateStreak();

  // Additional metrics
  const monthlySeconds = data.sessions
    .filter(s => new Date(s.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, s) => sum + s.duration, 0);

  const todaySeconds = data.sessions
    .filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.duration, 0);

  const totalBankedEver = data.transactions
    .filter(t => t.type === 'bank' || t.type === 'manual_add')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedeemedEver = data.transactions
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + t.amount, 0);

  const redemptionRate = totalBankedEver > 0 ? (totalRedeemedEver / totalBankedEver) * 100 : 0;

  const sessionsThisWeek = data.sessions.filter(s => new Date(s.timestamp) > oneWeekAgo).length;
  const avgSessionsPerDay = streak > 0 ? data.sessions.length / streak : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>⚡ StudyBank</h1>
          <p className="tagline">Bank your focus. Earn your freedom.</p>
        </header>

        <div className="grid">
          {/* Timer Card */}
          <div className="card">
            <div className="card-title">
              <span className="emoji">⏱️</span>
              Study Timer
            </div>
            <div className={`timer-display ${isRunning ? 'running' : ''}`}>
              {formatTime(elapsedTime)}
            </div>
            <div className="button-group">
              <button 
                className="btn btn-primary" 
                onClick={startTimer}
                disabled={isRunning}
              >
                Start
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={pauseTimer}
                disabled={!isRunning}
              >
                Pause
              </button>
              <button 
                className="btn btn-danger" 
                onClick={stopTimer}
                disabled={elapsedTime === 0}
              >
                Stop
              </button>
            </div>
            <div className="session-history">
              {data.sessions.slice(-5).reverse().map((session, idx) => (
                <div key={idx} className="session-item">
                  <span>{new Date(session.timestamp).toLocaleTimeString()}</span>
                  <span className="session-duration">{formatHours(session.duration)}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Banking Card */}
          <div className="card">
            <div className="card-title">
              <span className="emoji">🏦</span>
              Hour Bank
            </div>
            <div className="stat-group">
              <div className="stat">
                <div className="stat-label">Current Session</div>
                <div className="stat-value">{formatHours(data.currentSessionSeconds)}h</div>
              </div>
              <div className="stat">
                <div className="stat-label">Banked Hours</div>
                <div className="stat-value">{formatHours(data.bankedSeconds)}h</div>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={bankHours}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {buttonFeedback.bank ? '✅ Banked!' : '💰 Bank Current Session'}
            </button>

            {/* Manual Add Hours */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="card-title" style={{ fontSize: '1.2rem' }}>
                <span className="emoji">➕</span>
                Manual Add
              </div>
              <div className="input-group">
                <label className="input-label">Hours to add directly:</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0.0" 
                  min="0" 
                  step="0.1"
                  value={manualAddInput}
                  onChange={(e) => setManualAddInput(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={manualAddHours}
                style={{ width: '100%' }}
              >
                ➕ Add Hours to Bank
              </button>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="card-title" style={{ fontSize: '1.2rem' }}>
                <span className="emoji">🎮</span>
                Redeem Hours
              </div>
              <div className="multiplier-display">
                Redemption Rate: 0.4x (40%)
              </div>
              <div className="input-group">
                <label className="input-label">Hours to redeem:</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0.0" 
                  min="0" 
                  step="0.1"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={redeemHours}
                style={{ width: '100%' }}
              >
                {buttonFeedback.redeem ? '🎉 Redeemed!' : '🎯 Redeem for Recreation Time'}
              </button>
              <div className="stat" style={{ marginTop: '1rem' }}>
                <div className="stat-label">Available Recreation</div>
                <div className="stat-value">{formatHours(data.recreationSeconds)}h</div>
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="card">
            <div className="card-title">
              <span className="emoji">📊</span>
              Your Metrics
            </div>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-name">Total Study Time</span>
                <span className="metric-value">{formatHours(data.totalStudySeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Total Sessions</span>
                <span className="metric-value">{data.sessions.length}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Today's Study Time</span>
                <span className="metric-value">{formatHours(todaySeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">This Week</span>
                <span className="metric-value">{formatHours(weeklySeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">This Month</span>
                <span className="metric-value">{formatHours(monthlySeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Avg Session Length</span>
                <span className="metric-value">{formatHours(avgSeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Longest Session</span>
                <span className="metric-value">{formatHours(longestSeconds)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Study Streak</span>
                <span className="metric-value">{streak} days</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Sessions This Week</span>
                <span className="metric-value">{sessionsThisWeek}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Avg Sessions/Day</span>
                <span className="metric-value">{avgSessionsPerDay.toFixed(1)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Total Banked Ever</span>
                <span className="metric-value">{formatHours(totalBankedEver)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Total Redeemed Ever</span>
                <span className="metric-value">{formatHours(totalRedeemedEver)}h</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Redemption Rate</span>
                <span className="metric-value">{redemptionRate.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Recreation Earned</span>
                <span className="metric-value">{formatHours(data.recreationSeconds)}h</span>
              </div>
            </div>

            <div className="achievement-area">
              {achievements.map((ach, idx) => (
                <div key={idx} className="achievement">
                  <div className="achievement-title">{ach.title}</div>
                  <div className="achievement-desc">{ach.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <button 
          className="btn btn-primary settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ {showSettings ? 'Hide' : 'Show'} Transaction History
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="card settings-panel">
            <div className="card-title">
              <span className="emoji">📝</span>
              Transaction History
            </div>
            <div className="transaction-list">
              {data.transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No transactions yet. Start studying to build your history!
                </p>
              ) : (
                data.transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">
                        {transaction.type === 'bank' && '🏦 Bank'}
                        {transaction.type === 'redeem' && '🎮 Redeem'}
                        {transaction.type === 'manual_add' && '➕ Manual Add'}
                      </div>
                      <div className="transaction-desc">{transaction.description}</div>
                      <div className="transaction-time">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="transaction-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => startEditTransaction(transaction)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => deleteTransaction(transaction.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {editingTransaction && (
          <div className="modal-overlay" onClick={() => setEditingTransaction(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="card-title">
                <span className="emoji">✏️</span>
                Edit Transaction
              </div>
              <div className="input-group">
                <label className="input-label">Amount (hours):</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="button-group">
                <button 
                  className="btn btn-primary"
                  onClick={saveEditTransaction}
                >
                  Save
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditingTransaction(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
