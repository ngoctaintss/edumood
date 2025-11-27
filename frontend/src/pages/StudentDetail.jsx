import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { ArrowLeft, MessageSquare, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { getStudentEmotions, getStudentAIAnalysis } from '../utils/api';

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [latestMessage, setLatestMessage] = useState(null);
  const [emotions7Days, setEmotions7Days] = useState([]);
  const [analysis7Days, setAnalysis7Days] = useState(null);
  const [analysis30Days, setAnalysis30Days] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisPeriod, setAnalysisPeriod] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      // Load latest emotions
      const emotions = await getStudentEmotions(studentId, 30);
      if (emotions.length > 0) {
        setLatestMessage(emotions[0]);
        // Get last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = emotions.filter(e => new Date(e.date) >= sevenDaysAgo);
        setEmotions7Days(recent);
      }
    } catch (error) {
      console.error('Không thể tải dữ liệu học sinh:', error);
      alert('Không thể tải dữ liệu học sinh');
    }
  };

  const handleAnalyze = async (days) => {
    setLoadingAnalysis(true);
    setAnalysisPeriod(days);
    try {
      const analysis = await getStudentAIAnalysis(studentId, days);
      if (days === 7) {
        setAnalysis7Days(analysis);
      } else {
        setAnalysis30Days(analysis);
      }
    } catch (error) {
      console.error('Lỗi phân tích:', error);
      alert('Không thể phân tích. Vui lòng thử lại.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: '😊 Vui vẻ',
      neutral: '😐 Bình thường',
      sad: '😔 Buồn',
      angry: '😡 Giận dữ',
      tired: '😴 Mệt mỏi'
    };
    return labels[emotion] || emotion;
  };

  return (
    <div className="min-h-screen pb-8">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/teacher')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-4xl font-bold text-white">
            Chi Tiết Học Sinh
          </h1>
        </motion.div>

        {/* Latest Message */}
        {latestMessage && (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Tin Nhắn Mới Nhất</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getEmotionLabel(latestMessage.emotion).split(' ')[0]}</span>
                <div>
                  <p className="text-white font-semibold">
                    {getEmotionLabel(latestMessage.emotion)}
                  </p>
                  <p className="text-white/60 text-sm">
                    {new Date(latestMessage.date).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              {latestMessage.message && (
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-white">{latestMessage.message}</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* 7 Days History */}
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Lịch Sử 7 Ngày Gần Nhất</h2>
            </div>
            <button
              onClick={() => handleAnalyze(7)}
              disabled={loadingAnalysis && analysisPeriod === 7}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAnalysis && analysisPeriod === 7 ? 'Đang phân tích...' : 'Phân Tích 7 Ngày'}
            </button>
          </div>
          
          {emotions7Days.length === 0 ? (
            <p className="text-white/70 text-center py-8">
              Chưa có dữ liệu trong 7 ngày qua
            </p>
          ) : (
            <div className="space-y-3">
              {emotions7Days.map((emotion) => (
                <div key={emotion._id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getEmotionLabel(emotion.emotion).split(' ')[0]}
                      </span>
                      <div>
                        <p className="text-white font-semibold">
                          {getEmotionLabel(emotion.emotion)}
                        </p>
                        <p className="text-white/60 text-sm">
                          {new Date(emotion.date).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  {emotion.message && (
                    <p className="text-white/80 mt-2 ml-11">{emotion.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 7 Days Analysis Result */}
          {analysis7Days && (
            <div className="mt-6 glass-card p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Phân Tích 7 Ngày
              </h3>
              <div className="text-white whitespace-pre-line">
                {analysis7Days.summary}
              </div>
            </div>
          )}
        </GlassCard>

        {/* 30 Days Analysis */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Phân Tích 30 Ngày</h2>
            <button
              onClick={() => handleAnalyze(30)}
              disabled={loadingAnalysis && analysisPeriod === 30}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAnalysis && analysisPeriod === 30 ? 'Đang phân tích...' : 'Phân Tích 30 Ngày'}
            </button>
          </div>

          {analysis30Days ? (
            <div className="glass-card p-6 rounded-lg">
              <div className="text-white whitespace-pre-line">
                {analysis30Days.summary}
              </div>
            </div>
          ) : (
            <p className="text-white/70 text-center py-8">
              Nhấn nút "Phân Tích 30 Ngày" để xem phân tích
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default StudentDetail;

