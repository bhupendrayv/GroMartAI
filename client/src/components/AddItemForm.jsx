import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, PlusCircle, Pencil, ScanLine, ShoppingCart, Tag, IndianRupee,
  Search, CheckCircle2, Mic, Plus, Minus, ShoppingBag, CreditCard, Banknote, CheckCircle
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import VoiceInput from './VoiceInput';
import ReceiptModal from './ReceiptModal';
import { getSuggestions, recordItem } from '../itemHistory';

const API_URL = 'http://localhost:5000/api';

const CATEGORY_ICONS = {
  Vegetables: '🥦', Fruits: '🍎', Dairy: '🥛', Meat: '🥩',
  Bakery: '🍞', Snacks: '🍿', Beverages: '☕', Other: '🛒'
};

const CATEGORY_COLORS = {
  Vegetables: '#22c55e', Fruits: '#f97316', Dairy: '#60a5fa',
  Meat: '#f43f5e', Bakery: '#fbbf24', Snacks: '#a78bfa',
  Beverages: '#34d399', Other: '#94a3b8'
};

/* Each product has its own unique emoji */
const PRODUCT_EMOJIS = {
  // Vegetables
  Tomato: '🍅', Potato: '🥔', Onion: '🧅', Carrot: '🥕', Broccoli: '🥦',
  Spinach: '🥬', Cucumber: '🥒', Capsicum: '🫑', Cabbage: '🥬', Cauliflower: '🤍',
  'Green Chilli': '🌶️', Garlic: '🧄', Ginger: '🫚', Peas: '🟢',
  'Sweet Potato': '🍠', Corn: '🌽', Mushroom: '🍄', Beetroot: '🟣',
  Radish: '⚪', 'Lady Finger': '🟩',
  // Fruits
  Apple: '🍎', Banana: '🍌', Orange: '🍊', Grapes: '🍇', Mango: '🥭',
  Berry: '🫐', Watermelon: '🍉', Pineapple: '🍍', Papaya: '🥝', Kiwi: '🥝',
  Pomegranate: '🔴', Lemon: '🍋', Coconut: '🥥', Strawberry: '🍓',
  Peach: '🍑', Cherry: '🍒', Guava: '🟢', Litchi: '🩷',
  // Dairy
  Milk: '🥛', Cheese: '🧀', Butter: '🧈', Yogurt: '🍶', Eggs: '🥚',
  Cream: '🍦', Paneer: '🧱', Curd: '🥣', Ghee: '🫕',
  'Milk Powder': '🥛', 'Whipped Cream': '🍨',
  // Meat
  Chicken: '🍗', Beef: '🥩', Pork: '🥓', Fish: '🐟', Bacon: '🥓',
  Mutton: '🍖', Prawns: '🦐', Crab: '🦀', 'Eggs (Tray)': '🥚',
  Sausage: '🌭', Salami: '🍖',
  // Bakery
  Bread: '🍞', Buns: '🫓', Croissant: '🥐', Cake: '🎂', Muffin: '🧁',
  Biscuits: '🍪', Pastry: '🍰', Donut: '🍩', Pizza: '🍕',
  'Cup Cake': '🧁', Brownie: '🟫', Rusk: '🍞', Pav: '🫓',
  // Snacks
  Chips: '🍟', Popcorn: '🍿', Cookies: '🍪', Chocolate: '🍫',
  Crackers: '🥨', Namkeen: '🥜', Noodles: '🍜', 'Instant Noodles': '🍝',
  Candy: '🍬', Lollipop: '🍭', 'Ice Cream': '🍨', 'Peanut Butter': '🥜',
  Jam: '🫙', 'Dry Fruits': '🌰', Almonds: '🌰', Cashews: '🥜',
  // Beverages
  Water: '💧', Juice: '🧃', Soda: '🥤', Coffee: '☕', Tea: '🍵',
  'Coconut Water': '🥥', Smoothie: '🥤', 'Green Tea': '🍵',
  Lassi: '🥛', Milkshake: '🥤', 'Energy Drink': '⚡', Lemonade: '🍋',
  // Other — Grocery Staples & Household
  Rice: '🍚', Flour: '🌾', Sugar: '🍬', Salt: '🧂', Oil: '🫒',
  'Mustard Oil': '🟡', 'Olive Oil': '🫒', Honey: '🍯',
  Turmeric: '🟡', 'Red Chilli': '🌶️', Cumin: '🟤', 'Garam Masala': '🫙',
  Vinegar: '🫗', Ketchup: '🍅', Sauce: '🫙', Pickle: '🥒',
  'Toilet Paper': '🧻', Soap: '🧼', Toothpaste: '🪥', Detergent: '🫧',
  Shampoo: '🧴', 'Hand Wash': '🧴', Comb: '💇', 'Face Wash': '🧴',
  Perfume: '🧴', Sunscreen: '☀️', Razor: '🪒', 'Cotton Buds': '🩹',
  Copy: '📓', Notebook: '📒', Pen: '🖊️', Pencil: '✏️', Eraser: '🧹',
  Tape: '📎', Glue: '🫙', Scissors: '✂️', Stapler: '📌',
  Battery: '🔋', Bulb: '💡', Candle: '🕯️', Matchbox: '🔥',
  Dustbin: '🗑️', Broom: '🧹', Mop: '🧹',
};

const getProductEmoji = (name) => PRODUCT_EMOJIS[name] || '🛒';

/* Base approximate prices in INR */
const PRODUCT_PRICES = {
  Tomato: 60, Potato: 20, Onion: 90, Carrot: 40, Broccoli: 120,
  Spinach: 30, Cucumber: 40, Capsicum: 60, Cabbage: 30, Cauliflower: 40,
  'Green Chilli': 80, Garlic: 150, Ginger: 120, Peas: 80,
  'Sweet Potato': 40, Corn: 25, Mushroom: 50, Beetroot: 40,
  Radish: 30, 'Lady Finger': 50,
  Apple: 150, Banana: 60, Orange: 80, Grapes: 100, Mango: 120,
  Berry: 200, Watermelon: 50, Pineapple: 80, Papaya: 50, Kiwi: 150,
  Pomegranate: 140, Lemon: 10, Coconut: 50, Strawberry: 250,
  Peach: 180, Cherry: 300, Guava: 60, Litchi: 120,
  Milk: 60, Cheese: 120, Butter: 55, Yogurt: 40, Eggs: 70,
  Cream: 80, Paneer: 90, Curd: 30, Ghee: 500,
  'Milk Powder': 150, 'Whipped Cream': 180,
  Chicken: 250, Beef: 400, Pork: 350, Fish: 300, Bacon: 500,
  Mutton: 700, Prawns: 600, Crab: 800, 'Eggs (Tray)': 200,
  Sausage: 350, Salami: 400,
  Bread: 40, Buns: 30, Croissant: 80, Cake: 400, Muffin: 60,
  Biscuits: 20, Pastry: 80, Donut: 70, Pizza: 250,
  'Cup Cake': 50, Brownie: 90, Rusk: 50, Pav: 30,
  Chips: 20, Popcorn: 50, Cookies: 60, Chocolate: 100,
  Crackers: 30, Namkeen: 40, Noodles: 15, 'Instant Noodles': 15,
  Candy: 10, Lollipop: 5, 'Ice Cream': 80, 'Peanut Butter': 150,
  Jam: 120, 'Dry Fruits': 800, Almonds: 900, Cashews: 800,
  Water: 20, Juice: 100, Soda: 40, Coffee: 150, Tea: 100,
  'Coconut Water': 50, Smoothie: 120, 'Green Tea': 150,
  Lassi: 40, Milkshake: 100, 'Energy Drink': 110, Lemonade: 60,
  Rice: 60, Flour: 45, Sugar: 45, Salt: 25, Oil: 150,
  'Mustard Oil': 160, 'Olive Oil': 800, Honey: 250,
  Turmeric: 30, 'Red Chilli': 40, Cumin: 50, 'Garam Masala': 80,
  Vinegar: 50, Ketchup: 120, Sauce: 100, Pickle: 150,
  'Toilet Paper': 60, Soap: 40, Toothpaste: 90, Detergent: 120,
  Shampoo: 180, 'Hand Wash': 99, Comb: 30, 'Face Wash': 150,
  Perfume: 400, Sunscreen: 350, Razor: 80, 'Cotton Buds': 50,
  Copy: 40, Notebook: 60, Pen: 10, Pencil: 5, Eraser: 5,
  Tape: 20, Glue: 30, Scissors: 75, Stapler: 120,
  Battery: 45, Bulb: 100, Candle: 20, Matchbox: 2,
  Dustbin: 150, Broom: 80, Mop: 200,
};

const CATEGORY_UNITS = {
  Vegetables: 'kg',
  Fruits: 'kg',
  Dairy: 'litre',
  Meat: 'kg',
  Bakery: 'pcs',
  Snacks: 'pcs',
  Beverages: 'ml',
  Other: 'pcs'
};

const SUGGESTIONS = {
  Vegetables: ['Tomato', 'Potato', 'Onion', 'Carrot', 'Broccoli', 'Spinach', 'Cucumber', 'Capsicum', 'Cabbage', 'Cauliflower', 'Green Chilli', 'Garlic', 'Ginger', 'Peas', 'Sweet Potato', 'Corn', 'Mushroom', 'Beetroot', 'Radish', 'Lady Finger'],
  Fruits: ['Apple', 'Banana', 'Orange', 'Grapes', 'Mango', 'Berry', 'Watermelon', 'Pineapple', 'Papaya', 'Kiwi', 'Pomegranate', 'Lemon', 'Coconut', 'Strawberry', 'Peach', 'Cherry', 'Guava', 'Litchi'],
  Dairy: ['Milk', 'Cheese', 'Butter', 'Yogurt', 'Eggs', 'Cream', 'Paneer', 'Curd', 'Ghee', 'Milk Powder', 'Whipped Cream'],
  Meat: ['Chicken', 'Beef', 'Pork', 'Fish', 'Bacon', 'Mutton', 'Prawns', 'Crab', 'Eggs (Tray)', 'Sausage', 'Salami'],
  Bakery: ['Bread', 'Buns', 'Croissant', 'Cake', 'Muffin', 'Biscuits', 'Pastry', 'Donut', 'Pizza', 'Cup Cake', 'Brownie', 'Rusk', 'Pav'],
  Snacks: ['Chips', 'Popcorn', 'Cookies', 'Chocolate', 'Crackers', 'Namkeen', 'Noodles', 'Instant Noodles', 'Candy', 'Lollipop', 'Ice Cream', 'Peanut Butter', 'Jam', 'Dry Fruits', 'Almonds', 'Cashews'],
  Beverages: ['Water', 'Juice', 'Soda', 'Coffee', 'Tea', 'Coconut Water', 'Smoothie', 'Green Tea', 'Lassi', 'Milkshake', 'Energy Drink', 'Lemonade'],
  Other: ['Rice', 'Flour', 'Sugar', 'Salt', 'Oil', 'Mustard Oil', 'Olive Oil', 'Honey', 'Turmeric', 'Red Chilli', 'Cumin', 'Garam Masala', 'Vinegar', 'Ketchup', 'Sauce', 'Pickle', 'Toilet Paper', 'Soap', 'Toothpaste', 'Detergent', 'Shampoo', 'Hand Wash', 'Face Wash', 'Perfume', 'Sunscreen', 'Razor', 'Copy', 'Notebook', 'Pen', 'Pencil', 'Eraser', 'Tape', 'Glue', 'Scissors', 'Battery', 'Bulb', 'Candle', 'Matchbox', 'Broom', 'Mop'],
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);
const ALL_PRODUCTS = CATEGORIES.flatMap(cat =>
  SUGGESTIONS[cat].map(name => ({ name, category: cat, emoji: getProductEmoji(name), defaultPrice: PRODUCT_PRICES[name] || '' }))
);

// Custom hook to get window width
const useWindowSize = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

/* ─────────────────────────────────────────── */
/*  EDIT MODE — single-item traditional form   */
/* ─────────────────────────────────────────── */
const EditItemForm = ({ user, initialItem, onClose, onAdd }) => {
  const parseInitQty = (qStr) => {
    const match = String(qStr).trim().match(/^([\d.]+)\s*(.*)$/);
    return match ? { q: match[1], u: match[2] || 'pcs' } : { q: '1', u: 'pcs' };
  };
  const initQ = parseInitQty(initialItem?.quantity || '1');
  const [name, setName] = useState(initialItem?.name || '');
  const [qtyNum, setQtyNum] = useState(initQ.q);
  const [unit, setUnit] = useState(initQ.u);
  const [price, setPrice] = useState(initialItem?.price || '');
  const [category, setCategory] = useState(initialItem?.category || 'Vegetables');
  const [error, setError] = useState('');

  const adjustQty = (delta) => setQtyNum(prev => String(Math.max(1, (parseFloat(prev) || 1) + delta)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter an item name.');
    const finalQuantity = `${qtyNum} ${unit}`.trim();
    try {
      await axios.put(`${API_URL}/items/${initialItem._id}`,
        { name: name.trim(), quantity: finalQuantity, category, price: Number(price) || 0 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      recordItem(name.trim(), category, Number(price) || 0);
      onAdd();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '14px 18px', marginBottom: '1.5rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>Item Name</label>
        <div style={{ position: 'relative' }}>
          <Tag size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Fresh Avocado"
            style={{ ...inputStyle, paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Qty + Price */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={labelStyle}>Quantity</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            <button type="button" onClick={() => adjustQty(-1)} style={qtyBtnStyle}><Minus size={16} /></button>
            <input type="text" value={qtyNum} onChange={e => setQtyNum(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700', outline: 'none', minWidth: '40px' }} />
            <button type="button" onClick={() => adjustQty(1)} style={{ ...qtyBtnStyle, color: 'var(--primary)' }}><Plus size={16} /></button>
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '76px', background: 'transparent', border: 'none', borderLeft: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', textAlign: 'center' }}>
              {['pcs', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen'].map(u => <option key={u} value={u} style={{ background: '#1e1e2e' }}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={labelStyle}>Price (₹) <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: '5px' }}>{price > 0 ? `Total: ₹${(price * (parseFloat(qtyNum) || 1)).toFixed(2)}` : ''}</span></label>
          <div style={{ position: 'relative' }}>
            <IndianRupee size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
            <input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, paddingLeft: '38px' }} />
          </div>
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={labelStyle}>Category</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} type="button" onClick={() => {
              setCategory(cat);
              setUnit(CATEGORY_UNITS[cat] || 'pcs');
            }} style={{
              padding: '12px 6px', textAlign: 'center', cursor: 'pointer', borderRadius: '14px',
              background: category === cat ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${category === cat ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
              color: category === cat ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.85rem'
            }}>
              <span style={{ fontSize: '1.3rem' }}>{CATEGORY_ICONS[cat]}</span>{cat}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" style={submitBtnStyle}>Save Changes</button>
    </form>
  );
};

/* ─────────────────────────────────────────── */
/*  ADD MODE — multi-product picker            */
/* ─────────────────────────────────────────── */
const MultiProductPicker = ({ user, listId, listName, onClose, onAdd, items = [] }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Map());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [confirmedStep, setConfirmedStep] = useState(null); // null | 'cod' | 'receipt'
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 768;

  const displayedProducts = useMemo(() => {
    let list = activeCategory === 'All' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const toggleProduct = (product) => {
    const key = `${product.name}::${product.category}`;
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
        if (expandedKey === key) setExpandedKey(null);
      } else {
        const unit = CATEGORY_UNITS[product.category] || 'pcs';
        next.set(key, { name: product.name, category: product.category, qty: '1', unit, price: product.defaultPrice || '' });
        setExpandedKey(key);
      }
      return next;
    });
  };

  const updateField = (key, field, value) => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(key)) next.set(key, { ...next.get(key), [field]: value });
      return next;
    });
  };

  const handleScanSuccess = (product) => {
    if (product.name) {
      const cat = product.category && CATEGORIES.includes(product.category) ? product.category : 'Other';
      const key = `${product.name}::${cat}`;
      setSelectedItems(prev => {
        const next = new Map(prev);
        if (!next.has(key)) next.set(key, { name: product.name, category: cat, qty: '1', unit: 'pcs', price: product.price || '' });
        return next;
      });
      setExpandedKey(key);
    }
    setShowScanner(false);
  };

  const handleVoiceCommand = async (parsed) => {
    if (parsed.action === 'add' && parsed.name) {
      const matchedProduct = ALL_PRODUCTS.find(p => p.name.toLowerCase() === parsed.name.toLowerCase());
      const cat = matchedProduct ? matchedProduct.category : 'Other';
      const name = matchedProduct ? matchedProduct.name : parsed.name;
      const defaultPrice = matchedProduct ? matchedProduct.defaultPrice : '';
      const key = `${name}::${cat}`;
      setSelectedItems(prev => {
        const next = new Map(prev);
        if (!next.has(key)) {
          const qty = parsed.quantity || '1';
          const match = String(qty).match(/^([\d.]+)\s*(.*)$/);
          next.set(key, {
            name: name,
            category: cat,
            qty: match?.[1] || '1',
            unit: match?.[2] || 'pcs',
            price: parsed.price ? String(parsed.price) : String(defaultPrice || '')
          });
        }
        return next;
      });
      setExpandedKey(key);
      return true;
    }
    return false;
  };

  const [paymentStep, setPaymentStep] = useState(false); // true after items saved
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [addedTotal, setAddedTotal] = useState(0);
  const [addedCount, setAddedCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.size === 0) return;
    if (!listId) return setError('No list selected.');
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(
        [...selectedItems.values()].map(item =>
          axios.post(`${API_URL}/items`, {
            name: item.name,
            quantity: `${item.qty} ${item.unit}`.trim(),
            category: item.category,
            list_id: listId,
            price: Number(item.price) || 0,
          }, { headers: { Authorization: `Bearer ${user.token}` } })
        )
      );
      const backendItems = results.map(r => r.data);
      [...selectedItems.values()].forEach(item => recordItem(item.name, item.category, Number(item.price) || 0));
      // Calculate total for payment step
      const total = [...selectedItems.values()].reduce((sum, item) => {
        return sum + (Number(item.price) || 0) * (parseFloat(item.qty) || 1);
      }, 0);
      setAddedTotal(total);
      setAddedCount(selectedItems.size);
      setSavedItems(backendItems);
      onAdd(); // Refresh parent list
      setPaymentStep(true); // Show payment step
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add items.');
      setLoading(false);
    }
  };

  const selectedCount = selectedItems.size;

  if (paymentStep) {
    // --- COD confirmed: show success tick screen ---
    if (confirmedStep === 'cod') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,24,0.99)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
            style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CheckCircle size={55} color="#10b981" />
          </motion.div>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif', textAlign: 'center' }}>Order Confirmed!</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center' }}>Your items will be delivered.<br />Pay ₹{(addedTotal * 1.05).toFixed(2)} on delivery.</p>
          <button
            type="button" onClick={onClose}
            style={{ marginTop: '1rem', height: '52px', padding: '0 3rem', background: 'linear-gradient(90deg,#8a2be2,#4169e1)', border: 'none', borderRadius: '16px', color: 'white', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Done
          </button>
        </motion.div>
      );
    }

    // --- Online payment confirmed: show ReceiptModal ---
    if (confirmedStep === 'receipt') {
      return (
        <ReceiptModal
          user={user}
          items={savedItems}
          listId={listId}
          listName={listName || 'Shopping List'}
          onClose={onClose}
          onBillSaved={onAdd}
        />
      );
    }
 

    // --- Payment selection screen ---
    const upiTotal = addedTotal * 1.05;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,24,0.99)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto', gap: '1.5rem' }}
      >
        {/* Success Header */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}
          >
            <CheckCircle size={40} color="#10b981" />
          </motion.div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif' }}>Items Added!</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
            {addedCount} item{addedCount > 1 ? 's' : ''} added to your list
          </p>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', marginTop: '10px' }}>₹{addedTotal.toFixed(2)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>subtotal (excl. tax)</div>
        </div>

        {/* Payment Method Toggle */}
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>Select Payment Method</div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '5px', border: '1px solid rgba(255,255,255,0.1)', gap: '5px' }}>
            {[
              { id: 'Cash on Delivery', icon: <Banknote size={20} />, label: 'Cash on Delivery' },
              { id: 'Stripe', icon: <CreditCard size={20} />, label: 'Card / Wallets' },
              { id: 'UPI', icon: <ScanLine size={20} />, label: 'UPI / QR' }
            ].map(m => (
              <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                style={{ flex: 1, padding: '14px 8px', borderRadius: '16px', border: 'none', background: paymentMethod === m.id ? 'linear-gradient(135deg,#8a2be2,#4169e1)' : 'transparent', color: paymentMethod === m.id ? 'white' : 'var(--text-muted)', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: paymentMethod === m.id ? '0 6px 20px rgba(138,43,226,0.35)' : 'none' }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stripe Info */}
        <AnimatePresence>
          {paymentMethod === 'Stripe' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ textAlign: 'center', width: '100%', maxWidth: '480px' }}
            >
              <div style={{ display: 'inline-block', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem', width: '100%' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💳</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>Pay Securely via Stripe</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>Credit/Debit Cards & Wallets Supported</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', marginTop: '12px' }}>₹{upiTotal.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>(incl. 5% GST)</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPI QR Info */}
        <AnimatePresence>
          {paymentMethod === 'UPI' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ textAlign: 'center', width: '100%', maxWidth: '480px' }}
            >
              <div style={{ display: 'inline-block', padding: '1.5rem', background: 'white', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', marginBottom: '1rem' }}>
                <QRCodeSVG value="https://buy.stripe.com/test_fZu00j3Tn0TS4c1dYE2ZO01" size={180} level="M" bgColor="white" fgColor="#1a1a2e" />
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Scan with any QR scanner to pay via Stripe</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>₹{upiTotal.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>(incl. 5% GST)</span></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COD Card */}
        <AnimatePresence>
          {paymentMethod === 'Cash on Delivery' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ textAlign: 'center', padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '480px' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏠</div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>Pay when delivered</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>Amount due: ₹{upiTotal.toFixed(2)} <span style={{ fontSize: '0.8rem' }}>(incl. 5% GST)</span></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Button */}
        <button type="button"
          onClick={async () => {
             if (paymentMethod === 'Cash on Delivery') {
               setConfirmedStep('cod');
             } else if (paymentMethod === 'UPI') {
               setConfirmedStep('receipt');
             } else if (paymentMethod === 'Stripe') {
               try {
                 localStorage.setItem('pendingReceiptData', JSON.stringify({
                   listId,
                   items: savedItems,
                   paymentMethod: 'Card (Stripe)'
                 }));
                 const res = await axios.post(`${API_URL}/payment/create-checkout-session`, {
                   total: upiTotal,
                   listId
                 }, { headers: { Authorization: `Bearer ${user.token}` } });
                 window.location.href = res.data.url;
               } catch (err) {
                 console.error("Stripe Error:", err);
                 setError(err.response?.data?.error || 'Failed to initialize payment.');
               }
             }
          }}
          disabled={loading}
          style={{ width: '100%', maxWidth: '480px', height: '58px', background: 'linear-gradient(90deg,#10b981,#059669)', border: 'none', borderRadius: '18px', color: 'white', fontSize: '1.05rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 28px rgba(16,185,129,0.4)' }}
        >
          <CheckCircle size={22} />
          {paymentMethod === 'Stripe' ? 'Proceed to Pay with Stripe' : paymentMethod === 'UPI' ? 'Payment Done — Generate Receipt' : 'Confirm Order'}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '12px 16px', marginBottom: '1.25rem', color: '#ef4444', fontSize: '0.95rem' }}>
          {error}
        </div>
      )}

      {/* Search + action buttons row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '46px' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setShowVoice(true)} title="Voice" style={iconBtnStyle}>
            <Mic size={20} />
          </button>
          <AnimatePresence>
            {showVoice && <VoiceInput onCommand={handleVoiceCommand} onClose={() => setShowVoice(false)} />}
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => setShowScanner(true)} title="Scan barcode" style={iconBtnStyle}>
          <ScanLine size={20} />
        </button>
      </div>

      {/* Split Pane Layout */}
      <div className="split-layout" style={{ display: 'flex', gap: '1.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Left Side: Product Selection */}
        <div style={{ flex: '1.2', minWidth: isMobile ? 'auto' : '280px' }}>
          {/* Category tabs - scrollable on mobile */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat} type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  whiteSpace: 'nowrap', padding: isMobile ? '6px 12px' : '7px 16px', borderRadius: '30px', fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: '700',
                  border: `1.5px solid ${activeCategory === cat ? (CATEGORY_COLORS[cat] || 'var(--primary)') : 'rgba(255,255,255,0.08)'}`,
                  background: activeCategory === cat ? `${CATEGORY_COLORS[cat] || 'var(--primary)'}22` : 'rgba(255,255,255,0.03)',
                  color: activeCategory === cat ? (CATEGORY_COLORS[cat] || 'white') : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
                }}
              >
                {cat === 'All' ? '🛍️ All' : `${CATEGORY_ICONS[cat]} ${cat}`}
              </button>
            ))}
          </div>

          {/* Product grid - responsive column count */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '90px' : '120px'}, 1fr))`,
            gap: '12px',
            maxHeight: '550px',
            overflowY: 'auto',
            paddingRight: '8px',
          }}>
            {displayedProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                No products found
              </div>
            )}
            {displayedProducts.map(product => {
              const key = `${product.name}::${product.category}`;
              const isSelected = selectedItems.has(key);
              const color = CATEGORY_COLORS[product.category] || '#8a2be2';
              return (
                <motion.button
                  key={key} type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleProduct(product)}
                  style={{
                    position: 'relative', padding: isMobile ? '12px 6px' : '16px 10px', borderRadius: '20px', cursor: 'pointer',
                    border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                    background: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                    color: isSelected ? 'white' : 'var(--text-muted)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    transition: 'all 0.18s', outline: 'none', textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: isMobile ? '1.6rem' : '2rem', lineHeight: 1 }}>{product.emoji}</span>
                  <span style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '700', lineHeight: 1.2 }}>{product.name}</span>
                  <span style={{ fontSize: '0.65rem', color: isSelected ? color : 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{product.category}</span>

                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={12} color="white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected List & Submit */}
        <div style={{
          flex: '0.8',
          minWidth: isMobile ? 'auto' : '280px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '24px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: isMobile ? '400px' : '650px'
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="var(--primary)" />
            Selected ({selectedCount})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedCount === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.6 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Pick products</p>
              </div>
            ) : (
              [...selectedItems.entries()].map(([key, item]) => {
                const color = CATEGORY_COLORS[item.category] || '#8a2be2';
                const isExpanded = expandedKey === key;
                return (
                  <div key={key} style={{ borderRadius: '16px', border: `1.5px solid ${color}30`, background: `${color}08`, overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedKey(isExpanded ? null : key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{getProductEmoji(item.name)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'white' }}>{item.name}</div>
                        <div style={{ fontSize: '0.7rem', color: color, fontWeight: '600' }}>
                          {item.qty} {item.unit} {item.price ? `· ₹${((parseFloat(item.price) || 0) * (parseFloat(item.qty) || 1)).toFixed(2)}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); toggleProduct(item); }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: '8px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden', height: '36px' }}>
                                <button type="button" onClick={() => updateField(key, 'qty', String(Math.max(1, (parseFloat(item.qty) || 1) - 1)))} style={{ ...qtyBtnStyle, width: '32px', height: '36px' }}><Minus size={12} /></button>
                                <input type="text" value={item.qty} onChange={e => updateField(key, 'qty', e.target.value)} style={{ width: '30px', flex: 1, background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', outline: 'none' }} />
                                <button type="button" onClick={() => updateField(key, 'qty', String((parseFloat(item.qty) || 1) + 1))} style={{ ...qtyBtnStyle, width: '32px', height: '36px', color: color }}><Plus size={12} /></button>
                              </div>
                              <select value={item.unit} onChange={e => updateField(key, 'unit', e.target.value)} style={{ flex: 0.8, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0 6px', outline: 'none' }}>
                                {['pcs', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen'].map(u => <option key={u} value={u} style={{ background: '#1e1e2e' }}>{u}</option>)}
                              </select>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <IndianRupee size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', opacity: 0.6 }} />
                              <input
                                type="number" placeholder="Unit Price ₹" value={item.price}
                                onChange={e => updateField(key, 'price', e.target.value)}
                                style={{ width: '100%', height: '36px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', padding: '0 10px 0 28px', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="submit"
            disabled={selectedCount === 0 || loading}
            style={{
              ...submitBtnStyle,
              height: '48px',
              opacity: selectedCount === 0 || loading ? 0.5 : 1,
              cursor: selectedCount === 0 || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            {loading ? 'Adding...' : (
              <>
                <CheckCircle2 size={18} />
                {selectedCount === 0 ? 'Select products' : `Add ${selectedCount} Items`}
              </>
            )}
          </button>
        </div>
      </div>

      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
    </form>
  );
};

/* ─────────────────────────────────────────── */
/*  Shared styles                              */
/* ─────────────────────────────────────────── */
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: '14px', padding: '13px 14px', color: 'white', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s'
};
const labelStyle = {
  fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem', display: 'block'
};
const submitBtnStyle = {
  width: '100%', background: 'linear-gradient(90deg, #8a2be2, #4169e1)',
  border: 'none', borderRadius: '16px', color: 'white', fontWeight: '800',
  fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', boxShadow: '0 8px 24px -4px rgba(138,43,226,0.4)',
  transition: 'opacity 0.2s'
};
const qtyBtnStyle = {
  background: 'transparent', border: 'none', color: 'white',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const iconBtnStyle = {
  width: '48px', height: '48px', borderRadius: '14px', border: '1.5px solid rgba(138,43,226,0.4)',
  background: 'rgba(138,43,226,0.12)', color: 'var(--primary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
};

/* ─────────────────────────────────────────── */
/*  Root wrapper                               */
/* ─────────────────────────────────────────── */
const AddItemForm = ({ user, listId, listName, onClose, onAdd, initialItem = null, items = [] }) => {
  const isEditing = !!initialItem;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="hide-scrollbar"
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,24,0.97)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 4vh, 2rem) 1rem', position: 'relative' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #8a2be2, #4169e1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isEditing ? <Pencil size={20} color="white" /> : <ShoppingCart size={20} color="white" />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 5vw, 1.7rem)', fontWeight: '800', fontFamily: 'Space Grotesk, sans-serif' }}>
                {isEditing ? 'Edit Item' : 'Add Items'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isEditing ? 'Update product details below' : 'Pick multiple products at once'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {isEditing ? (
          <EditItemForm user={user} initialItem={initialItem} onClose={onClose} onAdd={onAdd} />
        ) : (
          <MultiProductPicker user={user} listId={listId} listName={listName} onClose={onClose} onAdd={onAdd} items={items} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default AddItemForm;