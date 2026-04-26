import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const VerifyBillModal = ({ user, onClose, onVerifySuccess }) => {
  const [billCode, setBillCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!billCode.trim()) return setError('Please enter a Bill Code.');
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.get(`${API_URL}/receipts/${billCode.trim().toUpperCase()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      onVerifySuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not find a bill with that code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(30px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '400px', background: 'rgba(30,30,46,1)', borderRadius: '28px', border: '1.5px solid rgba(255,255,255,0.1)', padding: '2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(138,43,226,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif' }}>Verify Bill Code</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter the Bill Number from your receipt</p>
        </div>

        <form onSubmit={handleVerify}>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="e.g. S49281"
              value={billCode}
              onChange={(e) => { setBillCode(e.target.value); setError(''); }}
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '16px', padding: '14px 14px 14px 48px', color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'all 0.2s', textTransform: 'uppercase' }}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '12px' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: '54px', background: 'linear-gradient(90deg, #8a2be2, #4169e1)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
          >
            {loading ? <Loader2 className="spin" size={20} /> : 'Verify Now'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default VerifyBillModal;
