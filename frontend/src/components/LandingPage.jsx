import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const greetings = [
  { text: "Hello", lang: "English" },
  { text: "नमस्ते", lang: "Hindi" },
  { text: "নমস্কার", lang: "Bengali" },
  { text: "నమస్కారం", lang: "Telugu" },
  { text: "नमस्कार", lang: "Marathi" },
  { text: "வணக்கம்", lang: "Tamil" },
  { text: "آداب", lang: "Urdu" },
  { text: "નમસ્તે", lang: "Gujarati" },
  { text: "ನಮಸ್ಕಾರ", lang: "Kannada" },
  { text: "ନମସ୍କାର", lang: "Odia" },
  { text: "നമസ്കാരം", lang: "Malayalam" },
  { text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", lang: "Punjabi" },
  { text: "নমস্কাৰ", lang: "Assamese" },
  { text: "CroplyAI", lang: "Your Farming Partner" }
];

export default function LandingPage({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let timer;
    if (index < greetings.length - 1) {
      // Very fast pace for languages (110ms)
      timer = setTimeout(() => setIndex(prev => prev + 1), 110);
    } else {
      // Landed on the final "CroplyAI" text
      timer = setTimeout(() => {
        setShowRipple(true);
        // Start fading the whole container out slightly after the ripple starts
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onComplete, 600); // 600ms to fade out the container
        }, 600);
      }, 800); // Hold on the final text for 800ms before rippling
    }
    return () => clearTimeout(timer);
  }, [index, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#022C22]">
      <AnimatePresence>
        {!fadeOut && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-[#022C22]" 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* The Liquid Ripple */}
            <motion.div
              className="absolute w-8 h-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(234,179,8,1) 0%, rgba(22,163,74,0.8) 50%, rgba(2,44,34,0) 100%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={showRipple ? { scale: 200, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* The Text Container */}
            <div className="relative z-10 text-center">
              {/* Removed mode="wait" so it doesn't block the rapid intervals */}
              <AnimatePresence>
                <motion.div
                  key={index}
                  // We place it absolutely so the elements sit on top of each other perfectly during transition
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full"
                  initial={{ opacity: 0, filter: "blur(8px)", scale: 0.95 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(8px)", scale: 1.05 }}
                  transition={{ 
                    duration: index < greetings.length - 1 ? 0.1 : 0.8, 
                    ease: "easeOut" 
                  }}
                >
                  <div 
                    className={`text-white font-semibold tracking-tight whitespace-nowrap ${
                      index === greetings.length - 1 ? 'text-6xl md:text-8xl drop-shadow-2xl' : 'text-5xl md:text-7xl'
                    }`}
                  >
                    {greetings[index].text}
                  </div>
                  <div 
                    className={`mt-4 font-bold tracking-[0.2em] uppercase whitespace-nowrap ${
                      index === greetings.length - 1 ? 'text-[#FEF08A] text-sm md:text-lg drop-shadow-xl' : 'text-white/40 text-[10px] md:text-xs'
                    }`}
                  >
                     {greetings[index].lang}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
