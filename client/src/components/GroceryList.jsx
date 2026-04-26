import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Plus, ShoppingBasket, Pencil, Check, Mic, Receipt, CheckCircle } from 'lucide-react';
import ItemCard from './ItemCard';
import AddItemForm from './AddItemForm';
import ListNavigator from './ListNavigator';
import VoiceInput from './VoiceInput';
import ReceiptModal from './ReceiptModal';
import VerifyBillModal from './VerifyBillModal';
import ReceiptHistoryModal from './ReceiptHistoryModal';
import { GrocerioLogo } from './Assets';
import { recordItem } from '../itemHistory';

const API_URL = 'http://localhost:5000/api';

const GroceryList = ({ user, onLogout }) => {
  // ... (rest of the state and logical functions remain the same)
  const [activeList, setActiveList] = useState(null);
  const [items, setItems] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); // Label is Receipt History now
  const [verifiedReceipt, setVerifiedReceipt] = useState(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const initialStripeData = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      const pendingData = localStorage.getItem('pendingReceiptData');
      if (pendingData) {
        try {
          return JSON.parse(pendingData);
        } catch (e) { return null; }
      }
    }
    return null;
  }, []);

  const [stripeSuccessData, setStripeSuccessData] = useState(initialStripeData);
  const [showStripeTick, setShowStripeTick] = useState(!!initialStripeData);

  useEffect(() => {
    if (initialStripeData) {
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('pendingReceiptData');
    }
  }, [initialStripeData]);

  const handleUpdateBudget = async () => {
    try {
      const newBudget = parseFloat(budgetInput) || 0;
      await axios.put(`${API_URL}/lists/${activeList._id}`, 
        { budget: newBudget },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      setActiveList({ ...activeList, budget: newBudget });
    } catch (err) {
      console.error(err);
    }
    setIsEditingBudget(false);
  };

  const fetchItems = async (listId) => {
    if (!listId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/items?listId=${listId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied' && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (activeList) {
      fetchItems(activeList._id);

      let eventSource;
      const setupSSE = () => {
        eventSource = new EventSource(`${API_URL}/events?token=${user.token}`);
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'UPDATE') {
             fetchItems(activeList._id);
             // Trigger Push Notification if update made by another user
             if (data.senderId && data.senderId !== user.id) {
                 if (Notification.permission === "granted") {
                     new Notification("Grocerio Update", { 
                        body: "Someone in your group updated the list!", 
                        icon: '/favicon.ico' 
                     });
                 }
             }
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setTimeout(setupSSE, 5000); // Auto-reconnect in 5s
        };
      };

      setupSSE();
      return () => eventSource?.close();
    }
  }, [activeList]);

  const toggleStatus = async (item) => {
    // Optimistic update
    setItems(items.map(i => i._id === item._id ? { ...i, purchased: !i.purchased } : i));
    try {
      await axios.put(`${API_URL}/items/${item._id}`, 
        { purchased: !item.purchased },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
    } catch (err) { 
      console.error(err); 
      // Revert if error
      fetchItems(activeList._id);
    }
  };

  const deleteItem = async (id) => {
    // Optimistic update
    setItems(items.filter(i => i._id !== id));
    try {
      await axios.delete(`${API_URL}/items/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) { 
      console.error(err); 
      // Revert if error
      fetchItems(activeList._id);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsAddOpen(true);
  };

  const updateItem = async (id, updates) => {
    // Optimistic update
    setItems(items.map(i => i._id === id ? { ...i, ...updates } : i));
    try {
      await axios.put(`${API_URL}/items/${id}`,
        updates,
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
    } catch (err) {
      console.error(err);
      fetchItems(activeList._id);
    }
  };

  const handleCloseForm = () => {
    setIsAddOpen(false);
    setEditingItem(null);
  };

  const handleVerifySuccess = (receipt) => {
    setVerifiedReceipt(receipt);
    setShowVerifyModal(false);
  };



  const [showCompleted, setShowCompleted] = useState(false);

  const categories = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery', 'Snacks', 'Beverages', 'Other'];
  const activeItems = items.filter(i => !i.purchased && !i.billed);
  const completedItems = items.filter(i => i.purchased && !i.billed);
  const unbilledItems = completedItems; // Only bill what is checked off
  const groupedItems = categories.map(cat => ({
    name: cat,
    items: activeItems.filter(i => i.category === cat)
  })).filter(g => g.items.length > 0);

  const totalBudget = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);

  return (
    <div className="grocery-container fade-in" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', minHeight: '100vh', gap: '1.5rem' }}>
      <ListNavigator user={user} activeList={activeList} onListSelect={setActiveList} onVerifyClick={() => setShowVerifyModal(true)} onHistoryClick={() => setShowHistoryModal(true)} initialListId={initialStripeData?.listId} />

      <div style={{ flex: 1 }}>
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem',
          padding: '1.5rem', borderRadius: '24px', background: 'var(--glass)', border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(30px)', position: 'relative'
        }}>
          <div>
            <div style={{ transform: 'scale(1.15)', transformOrigin: 'left' }}><GrocerioLogo /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: '500' }}>
              Welcome back, <span style={{ color: 'white', fontWeight: '700' }}>{user.username}</span> | 
              Group: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{user.groupName}</span>
            </p>
            {activeList && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total List Budget</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>
                      ₹{totalBudget.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Right-side header actions */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
            {activeList && (
              <button
                onClick={() => setShowReceipt(true)}
                style={{ 
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  transition: 'all 0.3s'
                }}
              >
                <Receipt size={18} />
                Generate Bill ({unbilledItems.length > 0 ? unbilledItems.length : items.filter(i => !i.billed).length})
              </button>
            )}
            <button onClick={onLogout} style={{ 
              background: 'rgba(255, 255, 255, 0.04)', color: 'white', border: '1px solid var(--glass-border)',
              padding: '9px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '700',
              fontSize: '0.88rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </header>



        <main style={{ paddingBottom: '4rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '8rem', opacity: 0.6, fontSize: '1.4rem', fontWeight: '600' }}>✨ Syncing your groceries...</div>
          ) : !activeList ? (
            <div className="auth-card" style={{ maxWidth: 'none', padding: '8rem', height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Plus size={64} style={{ margin: '0 auto 2rem auto', opacity: 0.2 }} />
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800' }}>Select a Collection</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}>Choose from your group's shopping lists to begin management</p>
            </div>
          ) : items.length === 0 ? (
            <div className="auth-card" style={{ maxWidth: 'none', padding: '8rem' }}>
              <ShoppingBasket size={100} style={{ color: 'rgba(255,255,255,0.03)', marginBottom: '2.5rem' }} />
              <h2 style={{ color: 'var(--text-muted)', fontSize: '2rem', fontWeight: '700' }}>Your list is waiting for essentials...</h2>
            </div>
          ) : (
            <>
              {/* Active items grouped by category */}
              {activeItems.length === 0 && completedItems.length > 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                  <span style={{ fontSize: '2rem' }}>🎉</span>
                  <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>All done! Everything is bought.</p>
                </div>
              ) : (
                groupedItems.map(group => (
                  <section key={group.name} style={{ marginBottom: '2.5rem' }}>
                    <h3 className="vibrant-heading" style={{ fontSize: '1.6rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '5px', height: '36px', background: 'var(--primary)', borderRadius: '3px' }}></span>
                      {group.name}
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '4px', background: 'rgba(255,255,255,0.07)', padding: '2px 10px', borderRadius: '20px' }}>{group.items.length}</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      <AnimatePresence mode="popLayout">
                        {group.items.map(item => (
                          <ItemCard key={item._id} item={item} onToggle={() => toggleStatus(item)} onDelete={() => deleteItem(item._id)} onEdit={() => handleEditClick(item)} onUpdateItem={updateItem} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                ))
              )}

              {/* Completed Section */}
              {completedItems.length > 0 && (
                <section style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setShowCompleted(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16,185,129,0.07)', border: '1.5px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '10px 18px', color: '#10b981', cursor: 'pointer', width: '100%', marginBottom: showCompleted ? '1rem' : '0', transition: 'all 0.2s', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>✅</span>
                    <span style={{ fontWeight: '700', fontSize: '1rem', fontFamily: 'Space Grotesk, sans-serif' }}>Completed</span>
                    <span style={{ background: '#10b981', color: 'white', borderRadius: '20px', padding: '1px 9px', fontSize: '0.8rem', fontWeight: '800' }}>{completedItems.length}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.7 }}>{showCompleted ? '▲ Hide' : '▼ Show'}</span>
                  </button>

                  <AnimatePresence>
                    {showCompleted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                          <AnimatePresence mode="popLayout">
                            {completedItems.map(item => (
                              <ItemCard key={item._id} item={item} onToggle={() => toggleStatus(item)} onDelete={() => deleteItem(item._id)} onEdit={() => handleEditClick(item)} onUpdateItem={updateItem} />
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}
            </>
          )}
        </main>

        {/* Floating Action Buttons */}
        {activeList && (
          <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 100 }}>
            {/* Add FAB */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setEditingItem(null); setIsAddOpen(true); }}
              style={{ height: '58px', padding: '0 2rem', borderRadius: '29px', background: 'linear-gradient(90deg, #8a2be2, #4169e1)', border: 'none', color: 'white', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'Space Grotesk, sans-serif', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 12px 32px rgba(138,43,226,0.4)' }}
            >
              <Plus size={22} /> Add Item
            </motion.button>
          </div>
        )}

        {isAddOpen && <AddItemForm user={user} listId={activeList?._id} listName={activeList?.list_name} onClose={handleCloseForm} onAdd={() => fetchItems(activeList._id)} initialItem={editingItem} items={items} />}
        <AnimatePresence>
          {showReceipt && (
            <ReceiptModal 
              user={user} 
              items={unbilledItems.length > 0 ? unbilledItems : items.filter(i => !i.billed)} 
              listId={activeList?._id} 
              listName={activeList?.name} 
              onClose={() => setShowReceipt(false)} 
              onBillSaved={() => fetchItems(activeList?._id)} 
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showVerifyModal && <VerifyBillModal user={user} onClose={() => setShowVerifyModal(false)} onVerifySuccess={handleVerifySuccess} />}
        </AnimatePresence>
        <AnimatePresence>
          {verifiedReceipt && <ReceiptModal user={user} items={[]} listName="" onClose={() => setVerifiedReceipt(null)} initialReceiptData={verifiedReceipt} />}
        </AnimatePresence>
        <AnimatePresence>
          {showHistoryModal && (
            <ReceiptHistoryModal 
              user={user} 
              onClose={() => setShowHistoryModal(false)} 
              onSelectReceipt={(receipt) => setVerifiedReceipt(receipt)} 
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showStripeTick && stripeSuccessData && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,24,0.75)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem 2rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CheckCircle size={45} color="#10b981" />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif' }}>Payment Successful!</h2>
                  <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your payment via Stripe was processed perfectly.</p>
                </div>
                <button
                  type="button" onClick={() => { setShowStripeTick(false); setStripeSuccessData(null); }}
                  style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

 
      </div>
    </div>
  );
};

export default GroceryList;
