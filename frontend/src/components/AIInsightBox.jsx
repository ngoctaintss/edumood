import { motion } from 'framer-motion';
import { Brain, Lightbulb } from 'lucide-react';
import GlassCard from './GlassCard';

const AIInsightBox = ({ analysis, loading }) => {
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="spinner"></div>
          <p className="text-white">Đang phân tích cảm xúc bằng AI...</p>
        </div>
      </GlassCard>
    );
  }

  if (!analysis) {
    return null;
  }

  const EMOTION_LABELS = {
    happy: 'Vui vẻ',
    neutral: 'Bình thường',
    sad: 'Buồn',
    angry: 'Giận dữ',
    tired: 'Mệt mỏi'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white text-xl font-bold">Phân Tích AI</h3>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-1" />
              <h4 className="text-white font-semibold">Tóm Tắt Phân Tích</h4>
            </div>
            <p className="text-white/90 leading-relaxed whitespace-pre-line">
              {analysis.summary}
            </p>
          </div>

          {analysis.emotionDistribution && (
            <div className="glass-card p-4 rounded-xl">
              <h4 className="text-white font-semibold mb-2">Phân Bố Cảm Xúc</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(analysis.emotionDistribution).map(([emotion, percentage]) => (
                  <div key={emotion} className="text-center">
                    <p className="text-2xl font-bold text-white">{percentage}%</p>
                    <p className="text-white/70 text-sm">{EMOTION_LABELS[emotion] || emotion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AIInsightBox;
