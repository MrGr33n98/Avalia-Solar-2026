/**
 * Session Management
 * Generates and manages session IDs
 */

const SESSION_STORAGE_KEY = 'avaliasolar_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  id: string;
  startTime: number;
  lastActivity: number;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create session
 */
export function getSession(): SessionData {
  if (typeof window === 'undefined') {
    return {
      id: generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now()
    };
  }
  
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (stored) {
      const session: SessionData = JSON.parse(stored);
      
      // Check if session expired
      if (Date.now() - session.lastActivity < SESSION_TIMEOUT) {
        // Update last activity
        session.lastActivity = Date.now();
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        return session;
      }
    }
    
    // Create new session
    const newSession: SessionData = {
      id: generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    return newSession;
    
  } catch (e) {
    console.warn('[Session] Failed to get/create session', e);
    return {
      id: generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now()
    };
  }
}

/**
 * Get session ID
 */
export function getSessionId(): string {
  return getSession().id;
}

/**
 * Check if current session is new
 */
export function isNewSession(): boolean {
  const session = getSession();
  return Date.now() - session.startTime < 5000; // Within 5 seconds of start
}

/**
 * Clear session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
