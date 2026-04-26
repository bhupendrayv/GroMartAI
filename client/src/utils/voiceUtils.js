/**
 * High-quality Text-to-Speech utility for Grocerio
 */

const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Priority list for premium sounding female voices
    const preferred = [
        'Google US English', 
        'Microsoft Zira', 
        'Samantha', 
        'Victoria', 
        'Karen', 
        'Moira'
    ];

    for (const name of preferred) {
        const found = voices.find(v => v.name.includes(name));
        if (found) return found;
    }

    // Fallback: any female voice
    return voices.find(v => v.name.toLowerCase().includes('female')) || voices[0];
};

export const speak = (text) => {
    if (!window.speechSynthesis) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voices are loaded asynchronously, so we might need to wait or try again
    const setVoiceAndSpeak = () => {
        const voice = getFemaleVoice();
        if (voice) {
            utterance.voice = voice;
            utterance.pitch = 1.05; // Slightly higher for friendly female tone
            utterance.rate = 0.95;  // Slightly slower for premium feel
            window.speechSynthesis.speak(utterance);
        }
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
        setVoiceAndSpeak();
    }
};
