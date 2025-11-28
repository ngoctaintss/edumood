import { motion } from 'framer-motion';
import { 
  Brain, Lightbulb, AlertTriangle, AlertCircle, AlertOctagon, 
  FileText, TrendingUp, Target, CheckCircle, Clock, User, 
  BarChart3, Sparkles, Heart, MessageSquare
} from 'lucide-react';
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

  // Parse summary text into sections
  const parseSummary = (text) => {
    if (!text) return null;
    
    const sections = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSection = null;
    let currentContent = [];
    
    lines.forEach(line => {
      // Check if it's a section header (### or ##)
      if (line.match(/^###?\s+\d+\./)) {
        // Save previous section
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        
        // Start new section
        const title = line.replace(/^###?\s+\d+\.\s*/, '').trim();
        currentSection = {
          title,
          type: line.includes('Tóm tắt') ? 'summary' : 
                line.includes('insights') || line.includes('hành vi') ? 'insights' :
                line.includes('Gợi ý') ? 'suggestions' : 'other'
        };
        currentContent = [];
      } else if (line.match(/^[-*•]\s+/)) {
        // Bullet point
        currentContent.push(line.replace(/^[-*•]\s+/, '').trim());
      } else if (line.trim()) {
        // Regular content
        currentContent.push(line.trim());
      }
    });
    
    // Add last section
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: currentContent.join('\n').trim()
      });
    }
    
    // If no sections found, return original text
    if (sections.length === 0) {
      return { raw: text };
    }
    
    return { sections };
  };

  const parsedSummary = parseSummary(analysis.summary);

  const getSectionIcon = (type) => {
    switch(type) {
      case 'summary': return <FileText className="w-5 h-5" />;
      case 'insights': return <TrendingUp className="w-5 h-5" />;
      case 'suggestions': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getSectionColor = (type) => {
    switch(type) {
      case 'summary': return 'from-blue-500 to-cyan-500';
      case 'insights': return 'from-purple-500 to-pink-500';
      case 'suggestions': return 'from-green-500 to-emerald-500';
      default: return 'from-yellow-500 to-orange-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white text-xl font-bold">Phân Tích AI</h3>
            {analysis.period && (
              <p className="text-white/60 text-sm">Phân tích {analysis.period} ngày gần nhất</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Parsed Sections */}
          {parsedSummary?.sections ? (
            parsedSummary.sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative overflow-hidden rounded-xl"
              >
                <div className={`bg-gradient-to-r ${getSectionColor(section.type)}/20 backdrop-blur-sm border border-white/20 p-5`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getSectionColor(section.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {getSectionIcon(section.type)}
                    </div>
                    <h4 className="text-white font-bold text-lg flex-1 pt-1">
                      {section.title}
                    </h4>
                  </div>
                  
                  <div className="ml-[52px] space-y-3">
                    {section.content.split('\n').map((paragraph, pIdx) => {
                      if (!paragraph.trim()) return null;
                      
                      // Check if it's a bullet point or numbered item
                      const isBullet = paragraph.match(/^[-*•]\s+/);
                      const isNumbered = paragraph.match(/^\d+\.\s+/);
                      const isBold = paragraph.match(/\*\*(.+?)\*\*/);
                      
                      if (isBullet || isNumbered) {
                        const text = paragraph.replace(/^[-*•\d.]+\s+/, '').trim();
                        const boldMatch = text.match(/\*\*(.+?)\*\*/);
                        
                        return (
                          <div key={pIdx} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getSectionColor(section.type)}/30 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getSectionColor(section.type)}`} />
                            </div>
                            <p className="text-white/95 leading-relaxed flex-1">
                              {boldMatch ? (
                                <>
                                  <span className="font-bold text-white">{boldMatch[1]}</span>
                                  {text.replace(/\*\*(.+?)\*\*/, '')}
                                </>
                              ) : (
                                text
                              )}
                            </p>
                          </div>
                        );
                      }
                      
                      if (isBold) {
                        return (
                          <p key={pIdx} className="text-white/95 leading-relaxed">
                            <span className="font-bold text-white text-lg">{isBold[1]}</span>
                            {paragraph.replace(/\*\*(.+?)\*\*/, '')}
                          </p>
                        );
                      }
                      
                      return (
                        <p key={pIdx} className="text-white/95 leading-relaxed text-base">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            // Fallback: Show raw text if parsing fails
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 p-5 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg pt-1">Tóm Tắt Phân Tích</h4>
              </div>
              <div className="ml-[52px]">
                <p className="text-white/95 leading-relaxed whitespace-pre-line text-base">
                  {parsedSummary?.raw || analysis.summary}
                </p>
              </div>
            </div>
          )}

          {/* Key Findings Section */}
          {analysis.keyFindings && analysis.keyFindings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 p-5 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg pt-1">Phát Hiện Chính</h4>
              </div>
              <div className="ml-[52px] space-y-2">
                {analysis.keyFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/95 leading-relaxed">{finding}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Suggestions */}
          {analysis.actionSuggestions && analysis.actionSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-white/20 p-5 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg pt-1">Gợi Ý Hành Động</h4>
              </div>
              <div className="ml-[52px] space-y-4">
                {analysis.actionSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        suggestion.priority === 'high' ? 'bg-red-500/30' :
                        suggestion.priority === 'medium' ? 'bg-orange-500/30' :
                        'bg-yellow-500/30'
                      }`}>
                        <CheckCircle className={`w-4 h-4 ${
                          suggestion.priority === 'high' ? 'text-red-400' :
                          suggestion.priority === 'medium' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-1">{suggestion.action}</p>
                        {suggestion.reason && (
                          <p className="text-white/70 text-sm mb-2">{suggestion.reason}</p>
                        )}
                        {suggestion.timeframe && (
                          <div className="flex items-center gap-2 text-white/60 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{suggestion.timeframe}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Positive Note */}
          {analysis.positiveNote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 p-5 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-2">Điểm Tích Cực</h4>
                  <p className="text-white/95 leading-relaxed">{analysis.positiveNote}</p>
                </div>
              </div>
            </motion.div>
          )}

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 p-5 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg">Phân Bố Cảm Xúc</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(analysis.emotionDistribution).map(([emotion, percentage]) => {
                  const emotionColors = {
                    happy: 'from-yellow-400 to-yellow-600',
                    neutral: 'from-gray-400 to-gray-600',
                    sad: 'from-blue-400 to-blue-600',
                    angry: 'from-red-400 to-red-600',
                    tired: 'from-purple-400 to-purple-600'
                  };
                  const emotionEmojis = {
                    happy: '😊',
                    neutral: '😐',
                    sad: '😔',
                    angry: '😡',
                    tired: '😴'
                  };
                  
                  return (
                    <motion.div
                      key={emotion}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/10 rounded-lg p-4 text-center border border-white/20 hover:bg-white/15 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${emotionColors[emotion]} flex items-center justify-center mx-auto mb-2 text-2xl`}>
                        {emotionEmojis[emotion]}
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{percentage}%</p>
                      <p className="text-white/80 text-sm font-medium">{EMOTION_LABELS[emotion] || emotion}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AIInsightBox;
