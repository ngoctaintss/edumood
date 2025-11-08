import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import EmojiSelector from '../components/EmojiSelector';
import RewardCard from '../components/RewardCard';
import { Star, Send, Gift, Lock, X, Heart, Calendar, Flame, Trophy, Target } from 'lucide-react';
import { submitEmotion, getAllRewards, redeemReward, changePassword, getEncouragement, getStudentEmotions7Days, getStreak, getMilestones } from '../utils/api';

const StudentDashboard = () => {
  const { user, updateUser } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [loadingEncouragement, setLoadingEncouragement] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [streak, setStreak] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [milestoneAchieved, setMilestoneAchieved] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  useEffect(() => {
    loadRewards();
    loadStreak();
    loadMilestones();
  }, []);

  useEffect(() => {
    if (showHistory && user?._id) {
      loadEmotionHistory();
    }
  }, [showHistory, user?._id]);

  const loadRewards = async () => {
    try {
      const data = await getAllRewards();
      setRewards(data);
    } catch (error) {
      console.error('Không thể tải phần thưởng:', error);
    }
  };

  const loadEmotionHistory = async () => {
    if (!user?._id) return;
    
    setLoadingHistory(true);
    try {
      const data = await getStudentEmotions7Days(user._id);
      setEmotionHistory(data);
    } catch (error) {
      console.error('Không thể tải lịch sử cảm xúc:', error);
      alert('Không thể tải lịch sử cảm xúc. Vui lòng thử lại.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadStreak = async () => {
    setLoadingStreak(true);
    try {
      const data = await getStreak();
      setStreak(data);
    } catch (error) {
      console.error('Không thể tải streak:', error);
    } finally {
      setLoadingStreak(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const data = await getMilestones();
      setMilestones(data);
    } catch (error) {
      console.error('Không thể tải milestones:', error);
    }
  };

  const handleSubmitEmotion = async () => {
    if (!selectedEmotion) {
      alert('Vui lòng chọn cảm xúc!');
      return;
    }

    setSubmitting(true);
    
    // Store emotion and message before clearing for encouragement API
    const emotionToSubmit = selectedEmotion;
    const messageToSubmit = message;
    
    try {
      const result = await submitEmotion(emotionToSubmit, messageToSubmit);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update user points (including milestone rewards if any)
      const totalPoints = (user.points || 0) + 10 + (result.milestoneAchieved?.rewardPoints || 0);
      updateUser({ points: totalPoints });

      // Update streak info
      if (result.streak) {
        setStreak({
          currentStreak: result.streak.currentStreak,
          longestStreak: result.streak.longestStreak,
          totalSubmissions: result.streak.totalSubmissions,
          milestonesAchieved: streak?.milestonesAchieved || []
        });
      }

      // Show milestone achievement if any
      if (result.milestoneAchieved) {
        setMilestoneAchieved(result.milestoneAchieved);
        setShowMilestoneModal(true);
        // Trigger extra confetti for milestone
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });
      }

      setSuccessMessage(result.message);
      
      // Clear form
      setSelectedEmotion('');
      setMessage('');
      
      // Automatically get and show encouragement
      setLoadingEncouragement(true);
      setShowEncouragement(true);
      try {
        const encouragementData = await getEncouragement(emotionToSubmit, messageToSubmit);
        setEncouragement(encouragementData.encouragement);
      } catch (encouragementError) {
        console.error('Không thể lấy lời động viên:', encouragementError);
        // Don't show error to user, just skip encouragement
        setShowEncouragement(false);
        setEncouragement('');
      } finally {
        setLoadingEncouragement(false);
      }

      // Reload streak to get updated milestones
      loadStreak();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit error
        const hoursLeft = error.response?.data?.hoursLeft || 0;
        alert(error.response?.data?.message || `Bạn đã gửi cảm xúc trong 24 giờ qua. Vui lòng đợi ${hoursLeft} giờ nữa.`);
      } else {
        alert(error.response?.data?.message || 'Không thể gửi cảm xúc. Vui lòng thử lại.');
      }
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      alert('Đổi mật khẩu thành công!');
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
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
              <p className="text-white text-center font-semibold whitespace-pre-line">{successMessage}</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Milestone Achievement Modal */}
        {showMilestoneModal && milestoneAchieved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMilestoneModal(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="glass-card max-w-md w-full p-8 rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-500/30 to-orange-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-8xl mb-4"
                >
                  {milestoneAchieved.icon || '🏆'}
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎉 Chúc Mừng! 🎉
                </h2>
                <h3 className="text-xl font-bold text-yellow-300 mb-2">
                  {milestoneAchieved.name}
                </h3>
                <p className="text-white/90 mb-4">
                  {milestoneAchieved.description || `Bạn đã duy trì ${milestoneAchieved.dayCount} ngày liên tiếp!`}
                </p>
                {milestoneAchieved.rewardPoints > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xl text-yellow-300 font-bold mb-4">
                    <Star className="w-6 h-6 fill-yellow-300" />
                    <span>+{milestoneAchieved.rewardPoints} Điểm Thưởng!</span>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMilestoneModal(false)}
                  className="btn-primary w-full"
                >
                  Tuyệt Vời!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Streak & Journey Section */}
        <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-400" />
                Chuỗi Ngày Liên Tiếp
              </h3>
            </div>
            {loadingStreak ? (
              <div className="flex justify-center py-8">
                <div className="spinner w-8 h-8 border-2"></div>
              </div>
            ) : streak ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl"
                    >
                      🔥
                    </motion.div>
                    <div>
                      <div className="text-5xl font-bold text-orange-400">
                        {streak.currentStreak}
                      </div>
                      <div className="text-white/70 text-sm">ngày</div>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">
                    Kỷ lục: {streak.longestStreak} ngày
                  </p>
                  <p className="text-white/70 text-xs mt-2">
                    Tổng: {streak.totalSubmissions} lần chia sẻ
                  </p>
                </div>
                {streak.currentStreak > 0 && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-white/90 text-sm text-center">
                      💪 Tiếp tục duy trì! Hãy quay lại ngày mai để tiếp tục chuỗi ngày của bạn!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/70 text-center py-4">
                Bắt đầu chuỗi ngày của bạn ngay hôm nay! 🚀
              </p>
            )}
          </motion.div>

          {/* Milestones Journey */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Hành Trình
              </h3>
            </div>
            {milestones.length === 0 ? (
              <p className="text-white/70 text-center py-4">
                Chưa có cột mốc nào được chinh phục
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {milestones.map((milestone) => {
                  const isAchieved = streak?.milestonesAchieved?.some(
                    m => {
                      const milestoneId = m.milestoneId?._id || m.milestoneId;
                      return milestoneId === milestone._id;
                    }
                  );
                  const currentStreak = streak?.currentStreak || 0;
                  const progress = currentStreak > 0 ? Math.min((currentStreak / milestone.dayCount) * 100, 100) : 0;
                  const isNext = !isAchieved && currentStreak < milestone.dayCount;
                  const isInProgress = !isAchieved && currentStreak > 0 && currentStreak < milestone.dayCount;

                  return (
                    <motion.div
                      key={milestone._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border-2 ${
                        isAchieved
                          ? 'bg-yellow-500/30 border-yellow-400'
                          : isInProgress
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl flex-shrink-0">
                          {isAchieved ? milestone.icon : isInProgress ? '🎯' : '🔒'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold text-sm ${
                              isAchieved ? 'text-yellow-300' : isInProgress ? 'text-blue-300' : 'text-white/70'
                            }`}>
                              {milestone.name}
                            </span>
                            <span className="text-xs text-white/60">
                              {milestone.dayCount} ngày
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-2 rounded-full ${
                                isAchieved
                                  ? 'bg-yellow-400'
                                  : isInProgress
                                  ? 'bg-blue-400'
                                  : 'bg-white/30'
                              }`}
                            />
                          </div>
                          {isNext && currentStreak > 0 && (
                            <p className="text-xs text-white/60">
                              Còn {milestone.dayCount - currentStreak} ngày nữa
                            </p>
                          )}
                          {isNext && currentStreak === 0 && (
                            <p className="text-xs text-white/60">
                              Bắt đầu ngay hôm nay!
                            </p>
                          )}
                          {isAchieved && milestone.rewardPoints > 0 && (
                            <p className="text-xs text-yellow-300 mt-1">
                              ⭐ +{milestone.rewardPoints} điểm
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

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

            {showEncouragement && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 glass-card bg-blue-500/20 border-blue-400/50 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-2">💬 Lời Động Viên từ AI</h3>
                    {loadingEncouragement ? (
                      <div className="flex items-center gap-2 py-4">
                        <div className="spinner w-5 h-5 border-2"></div>
                        <span className="text-white/70">Đang tạo lời động viên...</span>
                      </div>
                    ) : encouragement ? (
                      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{encouragement}</p>
                    ) : null}
                  </div>
                  {!loadingEncouragement && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowEncouragement(false);
                        setEncouragement('');
                      }}
                      className="p-1 hover:bg-white/20 rounded transition-all"
                    >
                      <X className="w-4 h-4 text-white" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </GlassCard>
        </div>

        {/* Actions */}
        <div className="text-center mb-6 flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShop(!showShop)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Gift className="w-5 h-5" />
            <span>{showShop ? 'Ẩn' : 'Hiện'} Cửa Hàng Quà Tặng</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && user?._id) {
                loadEmotionHistory();
              }
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span>{showHistory ? 'Ẩn' : 'Xem'} Lịch Sử 7 Ngày</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Lock className="w-5 h-5" />
            <span>Đổi Mật Khẩu</span>
          </motion.button>
        </div>

        {/* Emotion History 7 Days */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Lịch Sử Cảm Xúc 7 Ngày Qua
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHistory(false)}
                  className="p-2 glass-card hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <div className="spinner w-8 h-8 border-2"></div>
                </div>
              ) : emotionHistory.length === 0 ? (
                <p className="text-white/70 text-center py-10">
                  Chưa có dữ liệu cảm xúc trong 7 ngày qua. Hãy chia sẻ cảm xúc của bạn nhé! 😊
                </p>
              ) : (
                <div className="space-y-4">
                  {emotionHistory.map((emotion, index) => {
                    const emotionEmojis = {
                      happy: '😊',
                      neutral: '😐',
                      sad: '😔',
                      angry: '😡',
                      tired: '😴'
                    };
                    const emotionLabels = {
                      happy: 'Vui vẻ',
                      neutral: 'Bình thường',
                      sad: 'Buồn',
                      angry: 'Giận dữ',
                      tired: 'Mệt mỏi'
                    };
                    const emotionBorderColors = {
                      happy: '#fbbf24',
                      neutral: '#9ca3af',
                      sad: '#60a5fa',
                      angry: '#f87171',
                      tired: '#a78bfa'
                    };
                    
                    const date = new Date(emotion.date);
                    const dateStr = date.toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <motion.div
                        key={emotion._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 glass-card bg-white/10 rounded-lg"
                        style={{ borderLeft: `4px solid ${emotionBorderColors[emotion.emotion]}` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl flex-shrink-0">
                            {emotionEmojis[emotion.emotion]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white font-bold text-lg">
                                {emotionLabels[emotion.emotion]}
                              </h3>
                              <span className="text-white/70 text-sm">
                                {dateStr}
                              </span>
                            </div>
                            {emotion.message && (
                              <p className="text-white/90 mt-2 italic">
                                "{emotion.message}"
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Change Password Form */}
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  Đổi Mật Khẩu
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="p-2 glass-card hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-medium">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field w-full"
                    required
                    minLength={6}
                  />
                  <p className="text-white/60 text-sm mt-1">Tối thiểu 6 ký tự</p>
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field w-full"
                    required
                    minLength={6}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={changingPassword}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <div className="spinner w-6 h-6 border-2"></div>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Đổi Mật Khẩu</span>
                    </>
                  )}
                </motion.button>
              </form>
            </GlassCard>
          </motion.div>
        )}

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
