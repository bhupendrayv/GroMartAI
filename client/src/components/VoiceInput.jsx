import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Enhanced VoiceInput with NLP command parsing
 * Supported commands:
 *   "Add milk"
 *   "Add 2 kg rice"
 *   "Add milk 2 liters for 50 rupees"
 *   "Remove milk"
 *   "Delete onion"
 *   "Update rice to 3 kg"
 *   "Clear list"
 */

const NUM_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  half: 0.5, quarter: 0.25, dozen: 12
};

const UNITS = ['kg', 'g', 'gram', 'grams', 'kilogram', 'kilograms',
  'liter', 'liters', 'litre', 'litres', 'l', 'ml', 'milliliter',
  'pcs', 'piece', 'pieces', 'pack', 'packs', 'dozen', 'box', 'boxes',
  'bottle', 'bottles', 'can', 'cans', 'bag', 'bags'];

const parseQuantity = (text) => {
  // Match numeral or word + optional unit: "2 kg", "three liters", "half pack"
  const reNum = new RegExp(`(\\d+\\.?\\d*)\\s*(${UNITS.join('|')})?`, 'i');
  const reWord = new RegExp(`(${Object.keys(NUM_WORDS).join('|')})\\s*(${UNITS.join('|')})?`, 'i');

  let qty = '1';
  let unit = '';
  let remainder = text;

  const numMatch = text.match(reNum);
  const wordMatch = text.match(reWord);

  if (numMatch) {
    qty = numMatch[1];
    unit = numMatch[2] || '';
    remainder = text.replace(numMatch[0], '').trim();
  } else if (wordMatch) {
    qty = String(NUM_WORDS[wordMatch[1].toLowerCase()]);
    unit = wordMatch[2] || '';
    remainder = text.replace(wordMatch[0], '').trim();
  }

  return { qty, unit, remainder };
};

const parsePrice = (text) => {
  // "for 50 rupees", "₹50", "50 rs", "cost 80"
  const re = /(?:for|costing?|at|₹|rs\.?|rupees?)[\s₹]*(\d+\.?\d*)|(\d+\.?\d*)\s*(?:rs\.?|rupees?)/i;
  const m = text.match(re);
  if (m) {
    const price = parseFloat(m[1] || m[2]);
    const remainder = text.replace(m[0], '').trim();
    return { price, remainder };
  }
  return { price: 0, remainder: text };
};

const parseVoiceCommand = (raw) => {
  const text = raw.trim().toLowerCase();

  // Clear list
  if (/^clear\s+(the\s+)?list$/.test(text)) {
    return { action: 'clear' };
  }

  // Remove / Delete
  const removeMatch = text.match(/^(?:remove|delete|take out|drop)\s+(.+)/i);
  if (removeMatch) {
    const name = removeMatch[1].replace(/\b(the|a|an)\b/gi, '').trim();
    return { action: 'remove', name: capitalize(name) };
  }

  // Update
  const updateMatch = text.match(/^(?:update|change|set|modify)\s+(.+?)\s+to\s+(.+)/i);
  if (updateMatch) {
    const name = capitalize(updateMatch[1].trim());
    const { qty, unit } = parseQuantity(updateMatch[2]);
    return { action: 'update', name, quantity: `${qty}${unit ? ' ' + unit : ''}`.trim() };
  }

  // Add (explicit or implicit)
  const addMatch = text.match(/^(?:add|include|buy|get|put|i need)\s+(.+)/i);
  const itemText = addMatch ? addMatch[1] : text;

  // Extract price
  const { price, remainder: afterPrice } = parsePrice(itemText);

  // Extract quantity from what's left
  const { qty, unit, remainder: itemName } = parseQuantity(afterPrice);

  // Clean up filler words
  const cleaned = itemName
    .replace(/\b(the|a|an|some|please|now)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return { action: 'unknown', raw };

  return {
    action: 'add',
    name: capitalize(cleaned),
    quantity: `${qty}${unit ? ' ' + unit : ''}`.trim(),
    price,
  };
};

const capitalize = (s) =>
  s.replace(/\b\w/g, c => c.toUpperCase());

const STATUS_META = {
  idle:       { color: '#8a2be2', label: 'Tap mic to start listening',   icon: '🎤' },
  listening:  { color: '#8a2be2', label: 'Listening… speak your command', icon: '👂' },
  processing: { color: '#f59e0b', label: 'Processing command…',           icon: '⚡' },
  done:       { color: '#10b981', label: 'Done! Tap for another command', icon: '✅' },
  error:      { color: '#ef4444', label: 'Could not understand. Try again', icon: '❌' },
};

const EXAMPLES = [
  '"Add milk 2 liters"',
  '"Add 3 kg rice for ₹80"',
  '"Remove onion"',
  '"Update sugar to 1 kg"',
  '"Clear list"',
  '"Buy two dozen eggs"',
];

const CommandLog = ({ log }) => {
  const icons = { add: '➕', remove: '🗑️', update: '✏️', clear: '🧹', unknown: '❓' };
  const colors = { add: '#10b981', remove: '#ef4444', update: '#f59e0b', clear: '#8b5cf6', unknown: '#6b7280' };
  return (
    <div style={{ width: '100%', maxWidth: '400px', maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <AnimatePresence initial={false}>
        {log.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 12px', border: `1px solid ${colors[entry.action]}30` }}
          >
            <span>{icons[entry.action] || '📝'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: '700', color: colors[entry.action], fontSize: '0.88rem' }}>
                {entry.action.toUpperCase()}
              </span>
              <span style={{ color: 'white', fontSize: '0.88rem' }}>{' '}{entry.name || ''}
                {entry.quantity && entry.quantity !== '1' ? <span style={{ color: '#aaa' }}> × {entry.quantity}</span> : ''}
                {entry.price > 0 ? <span style={{ color: '#10b981' }}> ₹{entry.price}</span> : ''}
              </span>
            </div>
            {entry.success
              ? <CheckCircle size={14} color="#10b981" />
              : <AlertCircle size={14} color="#ef4444" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const VoiceInput = ({ onCommand, onClose }) => {
  const [status, setStatus] = useState('idle');
  const [interim, setInterim] = useState('');
  const [log, setLog] = useState([]);
  const [continuous, setContinuous] = useState(false);
  
  const recognitionRef = useRef(null);
  const statusRef = useRef(status);
  const continuousRef = useRef(continuous);
  const isManuallyStopped = useRef(false);

  const startingRef = useRef(false);

  // Sync refs with state to avoid stale closures in recognition handlers
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.1; u.volume = 0.7;
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('error'); return; }

    // Prevent multiple simultaneous starts or overlapping instances
    if (startingRef.current) return;
    if (recognitionRef.current && (statusRef.current === 'listening' || statusRef.current === 'processing')) {
      return;
    }

    startingRef.current = true;
    const r = new SR();
    recognitionRef.current = r;
    isManuallyStopped.current = false;
    
    r.lang = 'en-IN';
    r.continuous = continuousRef.current;
    r.interimResults = true;

    r.onstart = () => { 
      startingRef.current = false;
      setStatus('listening'); 
      setInterim(''); 
    };

    r.onerror = (e) => {
      startingRef.current = false;
      console.error('Speech recognition error:', e.error);
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setStatus('error');
      } else if (e.error === 'no-speech') {
        setStatus('idle');
      }
    };

    r.onend = () => {
      startingRef.current = false;
      // Restart if continuous mode is active and we didn't manually stop
      if (continuousRef.current && !isManuallyStopped.current) {
        setTimeout(() => {
          if (continuousRef.current && !isManuallyStopped.current && statusRef.current !== 'listening') {
            startListening();
          }
        }, 400);
      } else {
        if (statusRef.current !== 'processing' && statusRef.current !== 'done') {
          setStatus('idle');
        }
      }
    };

    r.onresult = async (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interimText += event.results[i][0].transcript;
      }

      if (interimText) setInterim(interimText);

      if (finalText) {
        setInterim('');
        setStatus('processing');
        const parsed = parseVoiceCommand(finalText);
        
        const success = await onCommand(parsed);
        setLog(prev => [{ ...parsed, success: success !== false }, ...prev].slice(0, 10));

        // Voice feedback
        if (parsed.action === 'add') speak(`Adding ${parsed.name}`);
        else if (parsed.action === 'remove') speak(`Removing ${parsed.name}`);
        else if (parsed.action === 'update') speak(`Updated ${parsed.name}`);
        else if (parsed.action === 'clear') speak('List cleared');
        else speak('Command not recognized');

        setTimeout(() => {
          if (continuousRef.current) {
            setStatus('listening');
          } else {
            setStatus('done');
            setTimeout(onClose, 1000);
          }
        }, 600);
      }
    };

    try {
      r.start();
    } catch (err) {
      startingRef.current = false;
      console.error('Failed to start recognition:', err);
    }
  };

  const stopListening = () => {
    isManuallyStopped.current = true;
    startingRef.current = false;
    recognitionRef.current?.stop();
    setStatus('idle');
    setInterim('');
  };

  useEffect(() => {
    // Auto-start listening on mount
    startListening();

    return () => { 
      isManuallyStopped.current = true;
      startingRef.current = false;
      recognitionRef.current?.stop(); 
      window.speechSynthesis.cancel(); 
    };
  }, []);

  const meta = STATUS_META[status];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', top: '2rem', right: '2rem', width: '340px', background: 'rgba(20,20,30,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem' }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2rem', fontWeight: '700' }}>
        🤖 AI Voice Input
      </p>

      {/* Mic Button */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        {status === 'listening' && [1,2,3].map(i => (
          <motion.div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${meta.color}` }}
            animate={{ scale: [1, 1.5 + i * 0.25], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          />
        ))}
        <motion.button
          onClick={status === 'listening' ? stopListening : startListening}
          whileTap={{ scale: 0.93 }}
          style={{
            width: '96px', height: '96px', borderRadius: '50%', cursor: 'pointer', position: 'relative',
            background: status === 'listening'
              ? `linear-gradient(135deg, ${meta.color}, #4169e1)`
              : status === 'done' ? 'linear-gradient(135deg,#10b981,#059669)'
              : status === 'error' ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
              : 'rgba(138,43,226,0.12)',
            border: `2px solid ${meta.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Mic size={34} color={status === 'idle' || status === 'processing' ? meta.color : 'white'} />
        </motion.button>
      </div>

      {/* Status */}
      <p style={{ color: meta.color, fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
        {meta.icon} {meta.label}
      </p>

      {/* Interim text */}
      <div style={{ minHeight: '36px', textAlign: 'center', marginBottom: '1.25rem' }}>
        <AnimatePresence mode="wait">
          {interim && (
            <motion.p key="int" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.15rem', fontStyle: 'italic' }}>
              {interim}…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Continuous toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 16px' }}>
        <Info size={14} color="var(--text-muted)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Continuous mode</span>
        <button
          onClick={() => {
            const newVal = !continuous;
            setContinuous(newVal);
            if (newVal) {
              if (statusRef.current === 'idle') startListening();
            } else {
              stopListening();
            }
          }}
          style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', background: continuous ? '#8a2be2' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          <span style={{ position: 'absolute', top: '3px', left: continuous ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </button>
      </div>

      {/* Command Log */}
      {log.length > 0 && (
        <div style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '400px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '700' }}>Command history</p>
          <CommandLog log={log} />
        </div>
      )}

      {/* Examples */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '700' }}>Try saying</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '420px' }}>
          {EXAMPLES.map(ex => (
            <span key={ex} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
              {ex}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default VoiceInput;
