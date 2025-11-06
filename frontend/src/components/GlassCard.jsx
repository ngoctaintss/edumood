import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`glass-card p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
