// focus-tracker.js — Focus Session Tracking & Statistics
// Handles: Storing focus session data, displaying counts, managing finished state

const FOCUS_TRACKER_KEY = 'trapezibuddy_focus_tracker'

// Focus session data structure:
// {
//   sessions: [
//     {
//       date: "2026-05-30",
//       startTime: "10:30:45",
//       endTime: "10:55:45",
//       duration: 1500, // in seconds (25 min)
//       completed: true,
//       timestamp: 1719738600000 // milliseconds
//     }
//   ]
// }

class FocusTracker {
  constructor() {
    this.loadData()
  }

  loadData() {
    const saved = localStorage.getItem(FOCUS_TRACKER_KEY)
    if (saved) {
      try {
        this.data = JSON.parse(saved)
      } catch (e) {
        console.error('[FocusTracker] Error loading data:', e)
        this.resetData()
      }
    } else {
      this.resetData()
    }
  }

  saveData() {
    localStorage.setItem(FOCUS_TRACKER_KEY, JSON.stringify(this.data))
  }

  resetData() {
    this.data = {
      sessions: [],
    }
    this.saveData()
  }

  /**
   * Get today's date as YYYY-MM-DD
   */
  getToday() {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  /**
   * Add a completed focus session
   * @returns {Object} - Session object that was added
   */
  addSession(durationSeconds = 1500) {
    const now = new Date()
    const today = this.getToday()
    
    const session = {
      date: today,
      startTime: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      }),
      endTime: new Date(now.getTime()).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      }),
      duration: durationSeconds,
      completed: true,
      timestamp: now.getTime(),
    }

    this.data.sessions.push(session)
    this.saveData()
    
    console.log('[FocusTracker] Session added:', session)
    return session
  }

  /**
   * Get today's completed sessions
   * @returns {Array} - Array of sessions completed today
   */
  getTodaysSessions() {
    const today = this.getToday()
    return this.data.sessions.filter(s => s.date === today && s.completed)
  }

  /**
   * Get count of today's completed sessions
   * @returns {Number} - Count of completed sessions today
   */
  getTodaysCount() {
    return this.getTodaysSessions().length
  }

  /**
   * Get total duration of today's focus sessions
   * @returns {Number} - Total duration in seconds
   */
  getTodaysDuration() {
    return this.getTodaysSessions().reduce((sum, s) => sum + (s.duration || 0), 0)
  }

  /**
   * Get formatted time string for today's total duration
   * @returns {String} - Formatted time like "1h 15m"
   */
  getTodaysDurationFormatted() {
    const totalSeconds = this.getTodaysDuration()
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  /**
   * Get statistics for a date range
   */
  getStats(daysBack = 7) {
    const now = new Date()
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    
    const sessions = this.data.sessions.filter(s => 
      s.completed && new Date(s.timestamp) >= cutoff
    )

    return {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      averageDuration: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
        : 0,
      sessionsByDate: this._groupByDate(sessions),
    }
  }

  _groupByDate(sessions) {
    return sessions.reduce((acc, s) => {
      const date = s.date
      if (!acc[date]) acc[date] = []
      acc[date].push(s)
      return acc
    }, {})
  }

  /**
   * Get formatted session info
   */
  getSessionInfo(session) {
    if (!session) return ''
    
    const mins = Math.floor(session.duration / 60)
    return `${session.date} • ${session.startTime} - ${session.endTime} • ${mins}m`
  }

  /**
   * Export all data as JSON
   */
  export() {
    return JSON.stringify(this.data, null, 2)
  }

  /**
   * Clear old data (older than 30 days)
   */
  cleanup() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const before = this.data.sessions.length
    this.data.sessions = this.data.sessions.filter(s => 
      new Date(s.timestamp) > thirtyDaysAgo
    )
    const removed = before - this.data.sessions.length
    
    if (removed > 0) {
      this.saveData()
      console.log(`[FocusTracker] Cleaned up ${removed} old sessions`)
    }
  }
}

// Create global instance
const focusTracker = new FocusTracker()

// Cleanup on init
focusTracker.cleanup()

console.log('[FocusTracker] Initialized')
