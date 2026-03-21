import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const greetings = [
  { text: "Hello", lang: "English" },
  { text: "नमस्ते", lang: "Hindi" },
  { text: "வணக்கம்", lang: "Tamil" },
  { text: "నమస్కారం", lang: "Telugu" },
  { text: "নমস্কার", lang: "Bengali" },
  { text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", lang: "Punjabi" },
  { text: "નમસ્તે", lang: "Gujarati" },
  { text: "ನಮಸ್ಕಾರ", lang: "Kannada" },
  { text: "ନମସ୍କାର", lang: "Odia" },
  { text: "നമസ്കാരം", lang: "Malayalam" },
];

export default function LandingPage({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let timer;
    if (index < greetings.length) {
      timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 140);
    } else {
      timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 500);
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [index, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <AnimatePresence mode="wait">
          {index < greetings.length && (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center"
            >
              <div className="text-white text-5xl md:text-7xl font-semibold tracking-wide">
                {greetings[index].text}
              </div>
              <div className="text-gray-500 text-lg mt-2 tracking-wider">
                {greetings[index].lang}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
