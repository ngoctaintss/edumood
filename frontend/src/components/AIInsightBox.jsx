import { motion } from 'framer-motion';
import { Brain, Lightbulb, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
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

          {analysis.concerningStudents && analysis.concerningStudents.length > 0 && (
            <div className="glass-card p-4 rounded-xl border-l-4 border-red-500">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
                <h4 className="text-white font-semibold">Học Sinh Cần Quan Tâm</h4>
              </div>
              <div className="space-y-3">
                {analysis.concerningStudents.map((student, index) => {
                  const getRiskColor = (level) => {
                    if (level === 'critical') return 'text-red-400 border-red-500';
                    if (level === 'high') return 'text-orange-400 border-orange-500';
                    return 'text-yellow-400 border-yellow-500';
                  };
                  
                  const getRiskIcon = (level) => {
                    if (level === 'critical') return <AlertOctagon className="w-4 h-4" />;
                    if (level === 'high') return <AlertTriangle className="w-4 h-4" />;
                    return <AlertCircle className="w-4 h-4" />;
                  };
                  
                  const getRiskLabel = (level) => {
                    if (level === 'critical') return 'Nghiêm Trọng';
                    if (level === 'high') return 'Cao';
                    return 'Trung Bình';
                  };
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border-l-4 ${getRiskColor(student.riskLevel)} bg-white/5`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getRiskIcon(student.riskLevel)}
                        <span className="font-semibold text-white">{student.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getRiskColor(student.riskLevel)} border`}>
                          {getRiskLabel(student.riskLevel)}
                        </span>
                      </div>
                      <div className="text-white/80 text-sm space-y-1 ml-6">
                        {student.hasDangerousKeywords && (
                          <p className="text-red-300">⚠️ Có từ nguy hiểm trong tin nhắn</p>
                        )}
                        {student.consecutiveNegativeDays > 0 && (
                          <p>📅 {student.consecutiveNegativeDays} ngày liên tiếp cảm xúc tiêu cực</p>
                        )}
                        <p>📊 {student.negativeRatio}% cảm xúc tiêu cực</p>
                        {student.dangerousMessages && student.dangerousMessages.length > 0 && (
                          <div className="mt-2 p-2 bg-red-500/20 rounded text-xs">
                            <p className="font-semibold mb-1">Tin nhắn:</p>
                            {student.dangerousMessages.slice(0, 2).map((msg, i) => (
                              <p key={i} className="italic">"{msg}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
