import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const emotions = [
  { value: 'happy', emoji: '😊', label: 'Vui vẻ', color: 'from-yellow-400 to-orange-400' },
  { value: 'neutral', emoji: '😐', label: 'Bình thường', color: 'from-gray-400 to-gray-500' },
  { value: 'sad', emoji: '😔', label: 'Buồn', color: 'from-blue-400 to-blue-600' },
  { value: 'angry', emoji: '😡', label: 'Giận dữ', color: 'from-red-400 to-red-600' },
  { value: 'tired', emoji: '😴', label: 'Mệt mỏi', color: 'from-purple-400 to-indigo-500' },
];

const EmojiSelector = ({ selected, onSelect }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.7)'
        }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center gap-4 flex-wrap">
      {emotions.map((emotion) => (
        <motion.button
          key={emotion.value}
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(emotion.value)}
          className={`
            relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center
            transition-all duration-300 cursor-pointer
            ${selected === emotion.value 
              ? `bg-gradient-to-br ${emotion.color} shadow-2xl scale-110` 
              : 'glass-card hover:bg-white/20'
            }
          `}
        >
          <span className="text-4xl mb-1">{emotion.emoji}</span>
          <span className="text-white text-xs font-medium">{emotion.label}</span>
          
          {selected === emotion.value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs">✓</span>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default EmojiSelector;
