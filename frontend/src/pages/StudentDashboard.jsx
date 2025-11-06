import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import EmojiSelector from '../components/EmojiSelector';
import RewardCard from '../components/RewardCard';
import { Star, Send, Gift } from 'lucide-react';
import { submitEmotion, getAllRewards, redeemReward } from '../utils/api';

const StudentDashboard = () => {
  const { user, updateUser } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const data = await getAllRewards();
      setRewards(data);
    } catch (error) {
      console.error('Không thể tải phần thưởng:', error);
    }
  };

  const handleSubmitEmotion = async () => {
    if (!selectedEmotion) {
      alert('Vui lòng chọn cảm xúc!');
      return;
    }

    setSubmitting(true);
    
    try {
      const result = await submitEmotion(selectedEmotion, message);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update user points
      updateUser({ points: (user.points || 0) + 10 });

      setSuccessMessage(result.message);
      setSelectedEmotion('');
      setMessage('');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert('Không thể gửi cảm xúc. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemReward = async (reward) => {
    if (window.confirm(`Đổi "${reward.name}" với ${reward.cost} điểm?`)) {
      try {
        const result = await redeemReward(reward._id);
        updateUser({ points: result.remainingPoints });
        alert(result.message);
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể đổi phần thưởng');
      }
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Chào, {user?.name}! 👋
          </h1>
          <div className="flex items-center justify-center gap-2 text-2xl text-white">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{user?.points || 0}</span>
            <span className="text-white/80">Điểm Năng Lượng</span>
          </div>
        </motion.div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 max-w-2xl mx-auto"
          >
            <GlassCard className="bg-green-500/20 border-green-400">
              <p className="text-white text-center font-semibold">{successMessage}</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Emotion Submission */}
        <div className="max-w-3xl mx-auto mb-8">
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Hôm nay bạn cảm thấy thế nào?
            </h2>

            <EmojiSelector selected={selectedEmotion} onSelect={setSelectedEmotion} />

            <div className="mt-6">
              <label className="block text-white mb-2 font-medium">
                Bạn muốn chia sẻ thêm gì không? (Không bắt buộc)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field resize-none"
                rows="3"
                placeholder="Chia sẻ những gì bạn đang nghĩ..."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitEmotion}
              disabled={submitting || !selectedEmotion}
              className="w-full mt-6 btn-primary flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="spinner w-6 h-6 border-2"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Gửi & Nhận 10 Điểm</span>
                </>
              )}
            </motion.button>
          </GlassCard>
        </div>

        {/* Reward Shop Toggle */}
        <div className="text-center mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShop(!showShop)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Gift className="w-5 h-5" />
            <span>{showShop ? 'Ẩn' : 'Hiện'} Cửa Hàng Quà Tặng</span>
          </motion.button>
        </div>

        {/* Reward Shop */}
        {showShop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gift className="w-7 h-7" />
                Cửa Hàng Quà Tặng
              </h2>

              {rewards.length === 0 ? (
                <p className="text-white/70 text-center py-10">
                  Chưa có quà tặng nào. Quay lại sau nhé!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward._id}
                      reward={reward}
                      onRedeem={handleRedeemReward}
                      userPoints={user?.points || 0}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
