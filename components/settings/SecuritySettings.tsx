'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Fingerprint, Eye, EyeOff, ShieldAlert, Loader2, KeyRound } from 'lucide-react';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Set passcode state
  const [showSetForm, setShowSetForm] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingPasscode, setSavingPasscode] = useState(false);

  // Remove passcode state
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removePasscode, setRemovePasscode] = useState('');
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingPasscode, setRemovingPasscode] = useState(false);

  // Fetch lock status
  const fetchLockStatus = async () => {
    try {
      const res = await fetch('/api/passcode');
      const json = await res.json();
      if (res.ok && json?.data) {
        setHasPasscode(Boolean(json.data.hasPasscode));
        setHasBiometric(Boolean(json.data.hasBiometric));
      }
    } catch (e) {
      console.error('Failed to load lock status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockStatus();

    // Check biometric availability
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }
  }, []);

  const handleSavePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Passcode cannot be empty.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setErrorMsg('Passcodes do not match.');
      return;
    }

    setSavingPasscode(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/passcode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save passcode');
      }

      setHasPasscode(true);
      setShowSetForm(false);
      setPasscode('');
      setConfirmPasscode('');
      alert('Passcode set successfully! Habits will now be protected.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save passcode');
    } finally {
      setSavingPasscode(false);
    }
  };

  const handleRemovePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removePasscode.trim()) {
      setRemoveError('Please enter your current passcode.');
      return;
    }

    setRemovingPasscode(true);
    setRemoveError(null);
    try {
      // 1. Verify passcode first
      const verifyRes = await fetch('/api/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: removePasscode }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson?.data?.verified) {
        setRemoveError('Incorrect passcode. Please try again.');
        setRemovingPasscode(false);
        return;
      }

      // 2. Remove passcode and biometrics
      const deleteRes = await fetch('/api/passcode', { method: 'DELETE' });
      if (!deleteRes.ok) {
        throw new Error('Failed to remove passcode');
      }

      setHasPasscode(false);
      setHasBiometric(false);
      setShowRemoveForm(false);
      setRemovePasscode('');
      alert('Habits passcode and biometric lock removed.');
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove lock');
    } finally {
      setRemovingPasscode(false);
    }
  };

  const handleEnrollBiometric = async () => {
    setBiometricBusy(true);
    try {
      const optRes = await fetch('/api/passcode/webauthn/register');
      const optJson = await optRes.json();
      if (!optRes.ok || !optJson?.data) {
        alert(optJson?.error || 'Could not start biometric setup.');
        return;
      }
      const { startRegistration } = await import('@simplewebauthn/browser');
      const response = await startRegistration({ optionsJSON: optJson.data });
      const verRes = await fetch('/api/passcode/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verJson = await verRes.json();
      if (verRes.ok && verJson?.data?.verified) {
        setHasBiometric(true);
        alert('Face ID / Touch ID unlock is now enabled.');
      } else {
        alert(verJson?.error || 'Could not enable biometric unlock.');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'NotAllowedError') {
        alert('Biometric setup was cancelled or is unavailable on this device.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleDisableBiometric = async () => {
    if (!confirm('Disable Face ID / Touch ID unlock? Your passcode will still work.')) return;
    setBiometricBusy(true);
    try {
      const res = await fetch('/api/passcode/webauthn/register', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not disable biometric unlock. Please try again.');
        return;
      }
      setHasBiometric(false);
      alert('Biometric unlock disabled.');
    } catch {
      alert('Could not disable biometric unlock. Check your connection.');
    } finally {
      setBiometricBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
      }}>
        <Loader2 size={18} className="animate-spin" color="var(--text-muted)" />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading security settings...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Security Status Card */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-xl)',
          position: 'relative',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
          background: hasPasscode ? 'var(--surface-tint)' : 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hasPasscode ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}>
          {hasPasscode ? <Lock size={18} /> : <Unlock size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
            Habits Passcode Lock
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {hasPasscode 
              ? 'Protect habit logs with a passcode required on new sessions.' 
              : 'Secure your habit tracker entries from unauthorized device access.'}
          </p>

          <AnimatePresence mode="wait">
            {!showSetForm && !showRemoveForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                {!hasPasscode ? (
                  <button
                    onClick={() => { setShowSetForm(true); setErrorMsg(null); }}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--accent-primary)',
                      color: 'var(--accent-on-primary)',
                      border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Enable passcode
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowRemoveForm(true); setRemoveError(null); }}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Remove passcode
                  </button>
                )}
              </motion.div>
            )}

            {/* Set Passcode Form */}
            {showSetForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSavePasscode}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, width: '100%', maxWidth: 320 }}
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPasscodeText ? 'text' : 'password'}
                    placeholder="Enter new passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '10px 42px 10px 12px',
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscodeText(!showPasscodeText)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      padding: 4, display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPasscodeText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <input
                  type={showPasscodeText ? 'text' : 'password'}
                  placeholder="Confirm new passcode"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />

                {errorMsg && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{errorMsg}</p>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={savingPasscode}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: 'var(--text-primary)',
                      color: 'var(--bg-primary)',
                      border: 'none',
                      cursor: savingPasscode ? 'wait' : 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {savingPasscode ? 'Saving...' : 'Save Lock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSetForm(false); setPasscode(''); setConfirmPasscode(''); }}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {/* Remove Passcode Form */}
            {showRemoveForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleRemovePasscode}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, width: '100%', maxWidth: 320 }}
              >
                <input
                  type="password"
                  placeholder="Enter current passcode to disable"
                  value={removePasscode}
                  onChange={(e) => setRemovePasscode(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />

                {removeError && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{removeError}</p>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={removingPasscode}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: 'var(--danger)',
                      color: 'var(--accent-on-primary)',
                      border: 'none',
                      cursor: removingPasscode ? 'wait' : 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {removingPasscode ? 'Removing...' : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRemoveForm(false); setRemovePasscode(''); }}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Biometric setup card (visible only if passcode lock is active and biometrics are supported) */}
      {hasPasscode && biometricSupported && (
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: hasBiometric ? 'var(--surface-tint)' : 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hasBiometric ? 'var(--accent-primary)' : 'var(--text-muted)',
          }}>
            <Fingerprint size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
              Face ID / Touch ID Unlock
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Use your device platform authenticator to quickly unlock the Habit Tracker without typing.
            </p>

            <button
              disabled={biometricBusy}
              onClick={hasBiometric ? handleDisableBiometric : handleEnrollBiometric}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: hasBiometric ? 'transparent' : 'var(--accent-primary)',
                color: hasBiometric ? 'var(--text-secondary)' : 'var(--accent-on-primary)',
                border: hasBiometric ? '1px solid var(--border-default)' : 'none',
                cursor: biometricBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {biometricBusy 
                ? 'Processing...' 
                : hasBiometric 
                  ? 'Disable biometrics' 
                  : 'Enable biometrics'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
