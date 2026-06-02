'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Monitor,
  Laptop,
  Smartphone,
  Shield,
  ShieldAlert,
  Trash2,
  LogOut,
  CheckCircle,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface Session {
  id: string;
  user_agent: string;
  ip: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

interface DevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  let os = 'Unknown Device';
  let osIcon = Smartphone;

  if (uaLower.includes('iphone') || uaLower.includes('ipod')) {
    os = 'iPhone';
    osIcon = Smartphone;
  } else if (uaLower.includes('ipad')) {
    os = 'iPad';
    osIcon = Smartphone;
  } else if (uaLower.includes('android')) {
    os = 'Android';
    osIcon = Smartphone;
  } else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) {
    os = 'macOS';
    osIcon = Laptop;
  } else if (uaLower.includes('windows')) {
    os = 'Windows';
    osIcon = Monitor;
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
    osIcon = Monitor;
  }

  let browser = 'Web Browser';
  if (uaLower.includes('firefox') && !uaLower.includes('seamonkey')) {
    browser = 'Firefox';
  } else if (uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Safari';
  } else if (uaLower.includes('edge') || uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opera') || uaLower.includes('opr/')) {
    browser = 'Opera';
  }

  return { os, browser, osIcon };
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DevicesModal({ isOpen, onClose }: DevicesModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null); // 'all' or sessionId
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    label: string;
    type: 'single' | 'others';
  } | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_sessions');
      if (rpcError) throw rpcError;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Could not retrieve active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setConfirmTarget(null);
    }
  }, [isOpen]);

  const requestRevokeSession = (session: Session) => {
    const { os, browser } = parseUserAgent(session.user_agent);
    setConfirmTarget({
      id: session.id,
      label: `${os} · ${browser}`,
      type: 'single',
    });
  };

  const requestRevokeOthers = () => {
    setConfirmTarget({
      id: 'all',
      label: 'all other devices',
      type: 'others',
    });
  };

  const executeRevokeSession = async (sessionId: string) => {
    setActionInProgress(sessionId);
    setConfirmTarget(null);
    try {
      const { error: rpcError } = await supabase.rpc('revoke_user_session', { target_session_id: sessionId });
      if (rpcError) throw rpcError;
      
      // Update local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Error revoking session:', err);
      alert('Failed to revoke session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const executeRevokeOthers = async () => {
    setActionInProgress('all');
    setConfirmTarget(null);
    try {
      const { error: rpcError } = await supabase.rpc('revoke_other_user_sessions');
      if (rpcError) throw rpcError;

      // Update state to keep only the current session
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err) {
      console.error('Error revoking other sessions:', err);
      alert('Failed to sign out of other devices. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Devices & Sessions" size="md">
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: 'var(--text-primary)', minHeight: 180 }}>
        
        <AnimatePresence mode="wait">
          {confirmTarget ? (
            <motion.div
              key="confirm-view"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                background: 'rgba(104, 104, 104, 0.04)',
                border: '1.5px solid rgba(104, 104, 104, 0.22)',
                borderRadius: 20,
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(104, 104, 104, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6a6a6a',
                }}
              >
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                  {confirmTarget.type === 'single' ? 'Log Out of Device?' : 'Log Out of Other Devices?'}
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {confirmTarget.type === 'single' ? (
                    <>
                      Are you sure you want to log out of <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{confirmTarget.label}</strong>? 
                      The user on that device will be signed out immediately.
                    </>
                  ) : (
                    'Are you sure you want to log out of all other active sessions? You will remain signed in only on this device.'
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 12,
                    border: '1.5px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmTarget.type === 'single') {
                      executeRevokeSession(confirmTarget.id);
                    } else {
                      executeRevokeOthers();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: '#6a6a6a',
                    color: '#FFF',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(104, 104, 104, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#4d4d4d'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#6a6a6a'}
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Info Alert */}
              <div
                style={{
                  background: 'rgba(85, 85, 85, 0.08)',
                  border: '1px solid rgba(85, 85, 85, 0.16)',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 20,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Shield size={20} color="var(--accent-light)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Security Information:</strong>
                  <p style={{ margin: '4px 0 0' }}>
                    These are the devices currently logged into your account. If you see any unrecognized login details, you should immediately revoke the session and update your password.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(104, 104, 104, 0.08)',
                    border: '1px solid rgba(104, 104, 104, 0.16)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 20,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <AlertTriangle size={18} color="#6a6a6a" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#8e8e8e', fontWeight: 600 }}>{error}</p>
                </div>
              )}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
                  <RefreshCw size={24} color="var(--accent-primary)" className="animate-spin" />
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Retrieving active sessions...</span>
                  <style jsx global>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                      animation: spin 1s linear infinite;
                    }
                  `}</style>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  {sessions.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <button
                        onClick={requestRevokeOthers}
                        disabled={actionInProgress !== null}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(104, 104, 104, 0.08)',
                          border: '1px solid rgba(104, 104, 104, 0.2)',
                          borderRadius: 10,
                          padding: '8px 14px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          cursor: actionInProgress !== null ? 'wait' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (actionInProgress === null) {
                            e.currentTarget.style.background = 'rgba(104, 104, 104, 0.14)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(104, 104, 104, 0.08)';
                        }}
                      >
                        <LogOut size={14} />
                        {actionInProgress === 'all' ? 'Revoking others...' : 'Log out of other devices'}
                      </button>
                    </div>
                  )}

                  {/* Sessions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sessions.map((session) => {
                      const { os, browser, osIcon: Icon } = parseUserAgent(session.user_agent);
                      const isCurrent = session.is_current;
                      const isCurrentAction = actionInProgress === session.id;

                      return (
                        <div
                          key={session.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: 16,
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${isCurrent ? 'color-mix(in srgb, var(--accent-primary) 35%, var(--border-default))' : 'var(--border-default)'}`,
                            borderRadius: 16,
                            position: 'relative',
                            boxShadow: isCurrent ? '0 0 12px rgba(85, 85, 85, 0.06)' : 'none',
                          }}
                        >
                          {/* Device Icon */}
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: isCurrent ? 'rgba(85, 85, 85, 0.12)' : 'rgba(127, 127, 127,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isCurrent ? 'var(--accent-light)' : 'var(--text-muted)',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={22} />
                          </div>

                          {/* Session Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {os} · {browser}
                              </span>
                              {isCurrent && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: 'var(--accent-primary)',
                                    color: 'var(--accent-on-primary)',
                                    padding: '2px 8px',
                                    borderRadius: 8,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <CheckCircle size={10} />
                                  This device
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-muted)' }}>
                                <Globe size={13} style={{ opacity: 0.8 }} />
                                {session.ip || 'Unknown IP'}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-muted)' }}>
                                <Clock size={13} style={{ opacity: 0.8 }} />
                                {isCurrent ? 'Active now' : formatRelativeTime(session.updated_at)}
                              </span>
                            </div>
                          </div>

                          {/* Revoke Action */}
                          {!isCurrent && (
                            <button
                              onClick={() => requestRevokeSession(session)}
                              disabled={actionInProgress !== null}
                              title="Log out this device"
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                border: 'none',
                                background: 'rgba(104, 104, 104, 0.08)',
                                color: '#6a6a6a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: actionInProgress !== null ? 'wait' : 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                if (actionInProgress === null) {
                                  e.currentTarget.style.background = 'rgba(104, 104, 104, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(104, 104, 104, 0.08)';
                              }}
                            >
                              {isCurrentAction ? (
                                <RefreshCw size={16} className="animate-spin" color="#6a6a6a" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {sessions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                      No active sessions found.
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Modal>
  );
}
