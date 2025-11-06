import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-white text-xl font-semibold">Loading...</p>
      </motion.div>
    </div>
  );
};

export default Loading;
