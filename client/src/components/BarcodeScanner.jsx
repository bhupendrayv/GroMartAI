import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Scan } from 'lucide-react';
import axios from 'axios';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [loadingMsg, setLoadingMsg] = useState('');
  const onScanSuccessRef = React.useRef(onScanSuccess);
  const scannerRef = React.useRef(null);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    if (scannerRef.current) return;
    // Inject CSS for scanning animation and scanner overrides
    const styleId = 'html5-qr-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        #barcode-reader { border: none !important; }
        #barcode-reader button {
          background: linear-gradient(90deg, #8a2be2, #4169e1) !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          cursor: pointer !important;
          margin: 10px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(138,43,226,0.3) !important;
        }
        #barcode-reader select {
          padding: 10px !important;
          border-radius: 12px !important;
          background: rgba(255,255,255,0.05) !important;
          color: #333 !important;
          border: 1px solid #ddd !important;
        }
        .scanner-viewfinder {
          position: relative;
          overflow: hidden;
        }
        .scanning-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: #8a2be2;
          top: 0;
          left: 0;
          box-shadow: 0 0 15px #8a2be2;
          animation: scan 2s linear infinite;
          z-index: 10;
          pointer-events: none;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `;
      document.head.appendChild(style);
    }

    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      { 
        fps: 20, 
        qrbox: { width: 280, height: 200 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
        ],
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        }
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setLoadingMsg(`Analyzing ${decodedText}...`);

        let priceParsed = '';
        if (decodedText.length === 12 || decodedText.length === 13) {
           const code = decodedText.length === 12 ? '0' + decodedText : decodedText;
           if (code.startsWith('02') || code.startsWith('2')) {
               const valueStr = code.substring(8, 12);
               priceParsed = (Number(valueStr) / 100).toFixed(2);
           }
        }

        try {
          const res = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
          if (res.data && res.data.status === 1) {
            const product = res.data.product;
            onScanSuccessRef.current({
              name: product.product_name || product.generic_name || 'Generic Product',
              category: 'Other', 
              price: priceParsed || '',
              barcode: decodedText
            });
          } else {
            onScanSuccessRef.current({ name: '', category: 'Other', price: priceParsed, barcode: decodedText });
          }
        } catch (error) {
          onScanSuccessRef.current({ name: '', category: 'Other', price: priceParsed, barcode: decodedText });
        }
      },
      () => {}
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ 
          background: 'white', padding: '30px', borderRadius: '32px', width: '400px', maxWidth: '90%', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
            <Scan size={24} color="#8a2be2" />
            <h3 style={{ margin: 0, color: '#1a1a2e', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '800' }}>Smart Scanner</h3>
        </div>
        
        <div className="scanner-viewfinder" style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid #f0f0f5', position: 'relative' }}>
            {!loadingMsg && <div className="scanning-line"></div>}
            
            <div id="barcode-reader" style={{ width: '100%', display: loadingMsg ? 'none' : 'block' }}></div>
            
            {loadingMsg && (
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#8a2be2', zIndex: 20 }}>
                 {loadingMsg}
               </div>
            )}
        </div>
        
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '20px', fontWeight: '500' }}>
            Align the barcode within the frame to scan
        </p>
      </div>

      <button onClick={onClose} style={{
        marginTop: '2.5rem', padding: '14px 28px', borderRadius: '24px',
        background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '1rem',
        fontWeight: '700', transition: 'all 0.3s'
      }}>
        <X size={20} /> Exit Scanner
      </button>
    </div>
  );
};

export default BarcodeScanner;
