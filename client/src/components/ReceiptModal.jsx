import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { speak } from '../utils/voiceUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:5000/api';
const TAX_RATE = 0.05; // 5% GST
const STORE_NAME = 'Grocerio';
const STORE_TAG = 'Your Smart Family Kitchen';

const generateBillNumber = () => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `S${num}`;
};

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const ReceiptModal = ({ user, items, listId, listName, onClose, initialReceiptData = null, onBillSaved = null }) => {
  const receiptRef = useRef(null);
  const [billNumber] = useState(initialReceiptData?.billNumber || generateBillNumber());
  const [billDate] = useState(initialReceiptData?.createdAt ? new Date(initialReceiptData.createdAt).toLocaleDateString() : formatDate());
  const [downloading, setDownloading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(initialReceiptData?.paymentMethod || 'Cash on Delivery');
  const [isSaved, setIsSaved] = useState(!!initialReceiptData);
  const [saveError, setSaveError] = useState('');
  const saveAttempted = useRef(false);

  // Lock the initial items in state so they don't vanish if the parent updates its unbilledItems prop
  const [activeItems] = useState(initialReceiptData?.items || items || []);
  const subtotal = initialReceiptData?.subtotal || activeItems.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 1), 0);
  const tax = initialReceiptData?.tax || (subtotal * TAX_RATE);
  const grandTotal = initialReceiptData?.total || (subtotal + tax);

  const saveToLocalStorage = (receiptData) => {
    try {
      const history = JSON.parse(localStorage.getItem('receipt_history') || '[]');
      // Avoid duplicates
      if (!history.find(r => r.billNumber === receiptData.billNumber)) {
        history.unshift(receiptData);
        localStorage.setItem('receipt_history', JSON.stringify(history.slice(0, 50)));
      }
    } catch (e) { console.error('Local storage save failed:', e); }
  };

  useEffect(() => {
    const saveToBackend = async () => {
      if (initialReceiptData || saveAttempted.current || isSaved || !user || activeItems.length === 0) return;
      saveAttempted.current = true;
      
      const receiptData = {
        billNumber,
        list_id: listId || items[0]?.list_id || "000000000000000000000000",
        listName: listName || "Main List",
        items: activeItems.map(i => ({ name: i.name, quantity: i.quantity, category: i.category, price: Number(i.price) || 0 })),
        subtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      try {
        setSaveError('');
        const itemIds = activeItems.map(i => i._id).filter(Boolean);
        
        await axios.post(`${API_URL}/receipts`, {
          ...receiptData,
          itemIds
        }, { headers: { Authorization: `Bearer ${user.token}` } });
        
        // Also save to localStorage for history persistence/backup
        saveToLocalStorage(receiptData);
        
        setIsSaved(true);
        if (onBillSaved) onBillSaved();
      } catch (err) {
        console.error('Failed to save receipt:', err);
        setSaveError(err.response?.data?.error || err.message);
        saveAttempted.current = false;
        
        // Even if backend fails, save to local storage so user doesn't lose it
        saveToLocalStorage(receiptData);
      }
    };
    saveToBackend();
  }, [user, initialReceiptData, billNumber, listId, items, listName, subtotal, tax, grandTotal, isSaved, paymentMethod]);

  useEffect(() => {
    speak(`Welcome! Your grand total is ${grandTotal.toFixed(2)} rupees.`);
  }, []); // Only once when modal opens

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${billNumber}</title>
          <style>body { margin: 0; padding: 20px; font-family: monospace; background: white; color: #111; }</style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const el = receiptRef.current;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${billNumber}.pdf`);
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,10,0.94)', backdropFilter: 'blur(40px)', zIndex: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '2rem 1rem', overflowY: 'auto' }}
      className="hide-scrollbar"
    >
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: '800' }}>
          {initialReceiptData ? '🛡️ Verified Receipt' : '🧾 Receipt Preview'}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isSaved && !initialReceiptData && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <button 
                onClick={() => setIsSaved(s => !s)} 
                style={{ padding: '10px 18px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🔄 Retry Save
              </button>
              {saveError && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '600' }}>Error: {saveError}</span>}
            </div>
          )}
          {isSaved && !initialReceiptData && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: '700', background: 'rgba(16,185,129,0.1)', padding: '0 12px', borderRadius: '12px' }}><CheckCircle size={14} /> Saved</div>}
          <button onClick={handlePrint} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={16} /> Print</button>
          <button onClick={handleDownload} disabled={downloading} style={{ padding: '10px 20px', background: downloading ? 'rgba(138,43,226,0.3)' : 'linear-gradient(90deg,#8a2be2,#4169e1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {downloading ? '⏳ Generating...' : <><Download size={16} /> Download PDF</>}
          </button>
          <button onClick={onClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
      </div>


      <div ref={receiptRef} style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '16px', padding: '2rem', color: '#111', fontFamily: 'monospace', fontSize: '0.9rem', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        {activeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <h3 style={{ margin: 0, color: '#111' }}>Empty Bill</h3>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>There are no items to bill in this list yet.</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '2px dashed #ddd', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', fontFamily: 'Arial Black, sans-serif', letterSpacing: '-1px', color: '#1a1a2e' }}>🛒 {STORE_NAME}</div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: '4px' }}>{STORE_TAG}</div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#444' }}>
            <div>Bill No: <strong>{billNumber}</strong></div>
            <div>Date: {billDate}</div>
            <div>List: <strong>{listName || 'Main List'}</strong></div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ background: '#f4f4f8' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: '0.75rem', color: '#555' }}>#</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: '0.75rem', color: '#555' }}>ITEM</th>
              <th style={{ textAlign: 'center', padding: '8px 6px', fontSize: '0.75rem', color: '#555' }}>QTY</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', fontSize: '0.75rem', color: '#555' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.map((item, idx) => {
              const numericQty = parseFloat(item.quantity) || 1;
              const price = parseFloat(item.price) || 0;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '7px 6px', color: '#888' }}>{idx + 1}</td>
                  <td style={{ padding: '7px 6px' }}>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#999' }}>{item.category}</div>
                  </td>
                  <td style={{ padding: '7px 6px', textAlign: 'center' }}>{item.quantity || 1}</td>
                  <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: '700' }}>₹{(numericQty * price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ borderTop: '2px dashed #ddd', paddingTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: '#888' }}><span>GST (5%)</span><span>₹{tax.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.15rem', borderTop: '2px solid #1a1a2e', paddingTop: '8px' }}><span>GRAND TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#aaa', marginTop: '4px' }}>
            {activeItems.length} item(s) · GST included
          </div>
        </div>

        <div style={{ borderTop: '2px dashed #ddd', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <QRCodeSVG value={`GROCERIO:${billNumber}:${grandTotal.toFixed(2)}`} size={80} level="M" bgColor="white" fgColor="#1a1a2e" />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🙏</div>
            <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>Thank you for shopping!</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>Powered by Grocerio</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginTop: '8px', color: '#10b981', fontSize: '0.78rem', fontWeight: '700' }}>
              <CheckCircle size={14} /> Verified Purchase
            </div>
          </div>
        </div>
      </>
    )}
  </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1rem' }}>Receipt ID: {billNumber} · Click Download PDF to save</p>
    </motion.div>
  );
};

export default ReceiptModal;
