import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, User, Pencil, Check, X, IndianRupee, Plus, Minus, Clock } from 'lucide-react';

// Helper: format relative time (e.g., "2 minutes ago")
const getRelativeTime = (timestamp) => {
  if (!timestamp) return null;
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const ItemCard = ({ item, onToggle, onDelete, onEdit, onUpdateItem }) => {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);

  // Derive unit price from total price and quantity
  useEffect(() => {
    const qtyNum = parseFloat(item.quantity) || 1;
    if (qtyNum > 0 && item.price > 0) {
      setUnitPrice(item.price / qtyNum);
    } else {
      setUnitPrice(0);
    }
  }, [item.price, item.quantity]);

  // Change quantity and automatically update total price
  const handleQuantityChange = (delta) => {
    const match = String(item.quantity).match(/^([\d.]+)\s*(.*)$/);
    const currentNum = match ? parseFloat(match[1]) : 1;
    const unit = match ? match[2] : 'pcs';
    const newNum = Math.max(1, currentNum + delta);
    const newQuantityStr = `${newNum} ${unit}`.trim();
    
    const newTotalPrice = unitPrice * newNum;
    onUpdateItem(item._id, {
      quantity: newQuantityStr,
      price: newTotalPrice,
    });
  };

  // Manual price edit (updates total price and recalculates unit price)
  const handlePriceEdit = (e) => {
    e.stopPropagation();
    setPriceInput(item.price > 0 ? String(item.price) : '');
    setEditingPrice(true);
  };

  const handlePriceSave = (e) => {
    e.stopPropagation();
    const newTotalPrice = parseFloat(priceInput) || 0;
    onUpdateItem(item._id, { price: newTotalPrice });
    setEditingPrice(false);
  };

  const handlePriceClear = (e) => {
    e.stopPropagation();
    onUpdateItem(item._id, { price: 0 });
    setEditingPrice(false);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') handlePriceSave(e);
    if (e.key === 'Escape') setEditingPrice(false);
  };

  const relativeTime = getRelativeTime(item.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`glass-panel item-card ${item.purchased ? 'purchased' : ''}`}
      style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1.5px solid var(--glass-border)',
        borderColor: item.purchased ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)',
        opacity: item.purchased ? 0.5 : 1,
        transform: item.purchased ? 'scale(0.97)' : 'scale(1)',
        background: item.purchased ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={onToggle}
        style={{ cursor: 'pointer', marginRight: '1.5rem', display: 'flex', alignItems: 'center' }}
      >
        {item.purchased ? (
          <CheckCircle2 color="var(--accent)" size={34} strokeWidth={2.5} />
        ) : (
          <Circle color="var(--text-muted)" size={34} strokeWidth={2} />
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h4
            className="vibrant-heading"
            style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              margin: 0,
              textDecoration: item.purchased ? 'line-through' : 'none',
              opacity: item.purchased ? 0.6 : 1,
            }}
          >
            {item.name}
          </h4>

          {/* Quantity controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '30px',
              padding: '2px 8px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={(parseFloat(item.quantity) || 1) <= 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                opacity: item.quantity <= 1 ? 0.4 : 1,
              }}
            >
              <Minus size={14} />
            </button>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', minWidth: '30px', textAlign: 'center' }}>
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Meta row: category, user, timestamp, price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)',
              padding: '4px 10px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {item.category}
          </span>

          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
            }}
          >
            <User size={14} opacity={0.6} /> {item.added_by?.username || 'Family'}
          </span>

          {/* Timestamp */}
          {relativeTime && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255,255,255,0.03)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              <Clock size={12} /> {relativeTime}
            </span>
          )}

          {/* Price editing / display */}
          {editingPrice ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '700' }}>₹</span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                style={{
                  width: '70px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--primary)',
                  color: 'white',
                  padding: '3px 7px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handlePriceSave}
                title="Save"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} />
              </button>
              <button
                onClick={handlePriceClear}
                title="Clear price"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
              {item.price > 0 ? (
                <span
                  onClick={handlePriceEdit}
                  title="Click to edit unit price"
                  style={{
                    fontSize: '0.95rem',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: '700',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    gap: '4px',
                  }}
                >
                  ₹{(item.price * (parseFloat(item.quantity) || 1)).toFixed(2)}
                  <Pencil size={10} style={{ opacity: 0.6 }} />
                </span>
              ) : (
                <button
                  onClick={handlePriceEdit}
                  title="Set price"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    color: 'var(--text-muted)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  <IndianRupee size={11} /> Set price
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
        <button
          onClick={onEdit}
          title="Edit item"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text)',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          title="Delete item"
          style={{
            background: 'rgba(211, 195, 195, 0.05)',
            color: '#ef4444',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(239, 68, 68, 0.15)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export default ItemCard;