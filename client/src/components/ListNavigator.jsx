import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, List as ListIcon, ChevronRight, ShieldCheck, Receipt } from 'lucide-react';
import { speak } from '../utils/voiceUtils';

const API_URL = 'http://localhost:5000/api';

const ListNavigator = ({ user, activeList, onListSelect, onVerifyClick, onHistoryClick, initialListId }) => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchLists = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/lists`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Pin "Main List" to the top
      const sorted = [
        ...data.filter(l => l.list_name === 'Main List'),
        ...data.filter(l => l.list_name !== 'Main List')
      ];
      setLists(sorted);
      // Auto-select initial list or first list on load
      if (!activeList && sorted.length > 0) {
        let toSelect = sorted[0];
        if (initialListId) {
          const found = sorted.find(l => l._id === initialListId);
          if (found) toSelect = found;
        }
        onListSelect(toSelect);
      }
      // If no lists exist at all, create Main List automatically
      if (data.length === 0) {
        const { data: newList } = await axios.post(`${API_URL}/lists`,
          { listName: 'Main List' },
          { headers: { Authorization: `Bearer ${user.token}` }}
        );
        setLists([newList]);
        onListSelect(newList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName) return;
    try {
      const { data } = await axios.post(`${API_URL}/lists`, 
        { listName: newListName },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      setLists([...lists, data]);
      setNewListName('');
      setIsCreating(false);
      onListSelect(data);
      speak(`Welcome to your ${data.list_name} collection.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="list-nav-container" style={{ 
      width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem'
    }}>
      <div className="glass-panel" style={{ 
        padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(40px)', border: '1px solid var(--glass-border)', borderRadius: '24px'
      }}>
        <h3 className="vibrant-heading" style={{ 
          marginBottom: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', 
          letterSpacing: '0.2rem', fontWeight: '800', opacity: 0.8
        }}>
          Collections
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
          {lists.map(list => (
            <React.Fragment key={list._id}>
              <div 
                onClick={() => onListSelect(list)}
                style={{
                  padding: '12px 16px', borderRadius: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: activeList?._id === list._id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  border: '1.5px solid',
                  borderColor: activeList?._id === list._id ? 'var(--primary)' : 'var(--glass-border)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeList?._id === list._id ? '0 15px 30px -5px rgba(138, 43, 226, 0.4)' : 'none',
                  transform: activeList?._id === list._id ? 'scale(1.02)' : 'scale(1)'
                }}
                className="list-item-nav"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <ListIcon size={22} style={{ opacity: activeList?._id === list._id ? 1 : 0.5 }} />
                  <span style={{ 
                    fontSize: '1.1rem', fontWeight: activeList?._id === list._id ? '700' : '500',
                    color: activeList?._id === list._id ? 'white' : 'var(--text-muted)'
                  }}>{list.list_name}</span>
                </div>
                {activeList?._id === list._id && <ChevronRight size={20} />}
              </div>

              {/* Insert Verify Bill right below Main List */}
              {list.list_name === 'Main List' && (
                <>
                  <button 
                    onClick={onVerifyClick}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '14px', marginBottom: '0.4rem',
                      background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.25)', 
                      color: '#10b981', display: 'flex', alignItems: 'center', gap: '12px', 
                      cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.3s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                  >
                    <ShieldCheck size={20} /> Verify Bill Code
                  </button>
                  <button 
                    onClick={onHistoryClick}
                    style={{
                      marginTop: '0.75rem', width: '100%', padding: '14px', background: 'rgba(65,105,225,0.08)',
                      border: '1px solid rgba(65,105,225,0.35)', color: '#4169e1', display: 'flex',
                      alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      borderRadius: '16px', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'Space Grotesk, sans-serif'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,105,225,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(65,105,225,0.08)'}
                  >
                    <Receipt size={20} /> Receipt History
                  </button>
                </>
              )}
            </React.Fragment>
          ))}
        </div>

        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            style={{
              marginTop: '1rem', width: '100%', padding: '14px', background: 'transparent',
              border: '2px dashed var(--glass-border)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              borderRadius: '20px', fontSize: '1rem', fontWeight: '600', transition: 'all 0.3s ease'
            }}
            className="social-box"
          >
            <Plus size={22} /> New Collection
          </button>
        ) : (
          <form onSubmit={handleCreateList} style={{ marginTop: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
            <input 
              type="text" 
              placeholder="Name your list..." 
              className="glass-input"
              value={newListName} 
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              style={{ marginBottom: '1.25rem', padding: '16px' }}
            />
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button type="submit" className="grocerio-btn shimmer-btn" style={{ flex: 1.5, height: '48px', fontSize: '1rem', borderRadius: '14px' }}>Create</button>
              <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderRadius: '14px' }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ListNavigator;
