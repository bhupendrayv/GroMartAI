import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Receipt, IndianRupee, MapPin, Search } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const ReceiptHistoryModal = ({ user, onClose, onSelectReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: remoteReceipts } = await axios.get(`${API_URL}/receipts`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        // Merge with local storage as fallback/supplement
        const localHistory = JSON.parse(localStorage.getItem('receipt_history') || '[]');
        
        // Use a Map to deduplicate by billNumber, prioritizing remote
        const all = new Map();
        localHistory.forEach(r => all.set(r.billNumber, r));
        remoteReceipts.forEach(r => all.set(r.billNumber, r));
        
        const sorted = [...all.values()].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setReceipts(sorted);
      } catch (err) {
        console.error('Error fetching history:', err);
        // Fallback to local only if remote fails
        const localHistory = JSON.parse(localStorage.getItem('receipt_history') || '[]');
        setReceipts(localHistory);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.token]);

  const filteredReceipts = receipts.filter(r => 
    r.billNumber.toLowerCase().includes(search.toLowerCase()) || 
    (r.listName && r.listName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,24,0.8)', backdropFilter: 'blur(10px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ width: '600px', maxWidth: '90%', height: '80vh', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(to right, rgba(138,43,226,0.1), rgba(65,105,225,0.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px' }}>
              <Clock size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Space Grotesk, sans-serif' }}>Receipt History</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>View your past transactions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Bill Code or List Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Receipt size={40} color="rgba(255,255,255,0.15)" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>No receipts found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence>
                {filteredReceipts.map((receipt, idx) => (
                  <motion.div
                    key={receipt._id || idx}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    onClick={() => { onClose(); onSelectReceipt(receipt); }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Space Grotesk, sans-serif', color: 'white' }}>{receipt.billNumber}</h4>
                      <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <MapPin size={12} /> {receipt.listName || 'Grocery Trip'} • {new Date(receipt.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <IndianRupee size={16} />{parseFloat(receipt.total).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                          {receipt.paymentMethod || 'Paid'}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); onClose(); onSelectReceipt(receipt); }}
                        style={{
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          color: 'white', border: 'none', padding: '6px 14px', borderRadius: '10px',
                          fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                          boxShadow: '0 4px 10px rgba(16,185,129,0.2)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Receipt size={14} /> Generate Bill
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReceiptHistoryModal;
