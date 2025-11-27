import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { 
  Users, GraduationCap, Gift, Plus, Trash2, Edit2, TrendingUp, Trophy, Settings
} from 'lucide-react';
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  assignTeacher,
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  getGlobalAnalytics,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getSetting,
  updateSetting
} from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' });
  const [classForm, setClassForm] = useState({ name: '', teacherId: '' });
  const [rewardForm, setRewardForm] = useState({ name: '', cost: 0, imageUrl: '', description: '' });
  const [milestoneForm, setMilestoneForm] = useState({ 
    name: '', 
    description: '', 
    dayCount: 1, 
    rewardPoints: 0, 
    rewardMessage: '', 
    icon: '🏆', 
    color: '#FFD700',
    order: 1,
    isActive: true
  });
  
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [submissionLimitEnabled, setSubmissionLimitEnabled] = useState(true);
  const [loadingSetting, setLoadingSetting] = useState(false);

  useEffect(() => {
    loadAllData();
    loadSubmissionLimitSetting();
  }, []);

  const loadSubmissionLimitSetting = async () => {
    try {
      const setting = await getSetting('emotion_submission_limit_enabled');
      setSubmissionLimitEnabled(setting.value);
    } catch (error) {
      console.error('Không thể tải setting:', error);
    }
  };

  const toggleSubmissionLimit = async () => {
    setLoadingSetting(true);
    try {
      const newValue = !submissionLimitEnabled;
      await updateSetting('emotion_submission_limit_enabled', newValue);
      setSubmissionLimitEnabled(newValue);
      alert(`Đã ${newValue ? 'bật' : 'tắt'} giới hạn gửi cảm xúc 24h`);
    } catch (error) {
      alert('Không thể cập nhật setting. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setLoadingSetting(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [teachersData, classesData, rewardsData, milestonesData, statsData] = await Promise.all([
        getAllTeachers(),
        getAllClasses(),
        getAllRewards(),
        getMilestones(),
        getGlobalAnalytics()
      ]);
      
      setTeachers(teachersData);
      setClasses(classesData);
      setRewards(rewardsData);
      setMilestones(milestonesData);
      setGlobalStats(statsData);
    } catch (error) {
      console.error('Không thể tải dữ liệu:', error);
    }
  };

  // Teacher Management
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      await createTeacher(teacherForm);
      setTeacherForm({ name: '', email: '', password: '' });
      loadAllData();
      alert('Tạo giáo viên thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo giáo viên');
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      await updateTeacher(editingTeacher._id, teacherForm);
      setEditingTeacher(null);
      setTeacherForm({ name: '', email: '', password: '' });
      loadAllData();
      alert('Cập nhật giáo viên thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật giáo viên');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa giáo viên này?')) {
      try {
        await deleteTeacher(id);
        loadAllData();
        alert('Xóa giáo viên thành công!');
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể xóa giáo viên');
      }
    }
  };

  // Class Management
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await createClass(classForm);
      setClassForm({ name: '', teacherId: '' });
      loadAllData();
      alert('Tạo lớp thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo lớp');
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      if (classForm.teacherId) {
        await assignTeacher(editingClass._id, classForm.teacherId);
      }
      await updateClass(editingClass._id, { name: classForm.name });
      setEditingClass(null);
      setClassForm({ name: '', teacherId: '' });
      loadAllData();
      alert('Cập nhật lớp thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật lớp');
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Bạn có chắc? Điều này sẽ xóa lớp khỏi tất cả giáo viên.')) {
      try {
        await deleteClass(id);
        loadAllData();
        alert('Xóa lớp thành công!');
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể xóa lớp');
      }
    }
  };

  // Reward Management
  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await createReward(rewardForm);
      setRewardForm({ name: '', cost: 0, imageUrl: '', description: '' });
      loadAllData();
      alert('Tạo phần thưởng thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo phần thưởng');
    }
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();
    try {
      await updateReward(editingReward._id, rewardForm);
      setEditingReward(null);
      setRewardForm({ name: '', cost: 0, imageUrl: '', description: '' });
      loadAllData();
      alert('Cập nhật phần thưởng thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật phần thưởng');
    }
  };

  const handleDeleteReward = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phần thưởng này?')) {
      try {
        await deleteReward(id);
        loadAllData();
        alert('Xóa phần thưởng thành công!');
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể xóa phần thưởng');
      }
    }
  };

  // Milestone Management
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await createMilestone(milestoneForm);
      setMilestoneForm({ 
        name: '', 
        description: '', 
        dayCount: 1, 
        rewardPoints: 0, 
        rewardMessage: '', 
        icon: '🏆', 
        color: '#FFD700',
        order: 1,
        isActive: true
      });
      loadAllData();
      alert('Tạo milestone thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo milestone');
    }
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    try {
      await updateMilestone(editingMilestone._id, milestoneForm);
      setEditingMilestone(null);
      setMilestoneForm({ 
        name: '', 
        description: '', 
        dayCount: 1, 
        rewardPoints: 0, 
        rewardMessage: '', 
        icon: '🏆', 
        color: '#FFD700',
        order: 1,
        isActive: true
      });
      loadAllData();
      alert('Cập nhật milestone thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật milestone');
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa milestone này?')) {
      try {
        await deleteMilestone(id);
        loadAllData();
        alert('Xóa milestone thành công!');
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể xóa milestone');
      }
    }
  };

  const tabs = [
    { id: 'teachers', label: 'Giáo Viên', icon: GraduationCap },
    { id: 'classes', label: 'Lớp Học', icon: Users },
    { id: 'rewards', label: 'Phần Thưởng', icon: Gift },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
    { id: 'settings', label: 'Cài Đặt', icon: Settings },
    { id: 'stats', label: 'Thống Kê', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen pb-8">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white mb-8 text-center"
        >
          Bảng Điều Khiển Quản Trị
        </motion.h1>

        {/* Tabs */}
        <div className="mb-6">
          <GlassCard className="p-2">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 py-3 px-4 rounded-xl font-semibold transition-all
                      flex items-center justify-center gap-2
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <GraduationCap className="w-7 h-7" />
              Quản Lý Giáo Viên
            </h2>

            <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingTeacher ? 'Chỉnh Sửa Giáo Viên' : 'Thêm Giáo Viên Mới'}</h3>
              <input
                type="text"
                placeholder="Tên"
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="input-field"
                required={!editingTeacher}
                disabled={!!editingTeacher}
              />
              <input
                type="password"
                placeholder={editingTeacher ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'}
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                className="input-field"
                required={!editingTeacher}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingTeacher ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                {editingTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacher(null);
                      setTeacherForm({ name: '', email: '', password: '' });
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div key={teacher._id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-semibold">{teacher.name}</h4>
                    <p className="text-white/60 text-sm">{teacher.email}</p>
                    <p className="text-white/60 text-sm">{teacher.classIds?.length || 0} lớp được phân công</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setTeacherForm({ name: teacher.name, email: teacher.email, password: '' });
                      }}
                      className="p-2 glass-card hover:bg-white/20 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher._id)}
                      className="p-2 glass-card hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-7 h-7" />
              Quản Lý Lớp Học
            </h2>

            <form onSubmit={editingClass ? handleUpdateClass : handleCreateClass} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingClass ? 'Chỉnh Sửa Lớp' : 'Thêm Lớp Mới'}</h3>
              <input
                type="text"
                placeholder="Tên Lớp"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                className="input-field"
                required
              />
              <select
                value={classForm.teacherId}
                onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                className="input-field"
              >
                <option value="">Chọn Giáo Viên (Tùy chọn)</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id} className="bg-gray-800">
                    {teacher.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                {editingClass && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClass(null);
                      setClassForm({ name: '', teacherId: '' });
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {classes.map((cls) => (
                <div key={cls._id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-semibold">{cls.name}</h4>
                    <p className="text-white/60 text-sm">
                      Giáo viên: {cls.teacherId?.name || 'Chưa phân công'}
                    </p>
                    <p className="text-white/60 text-sm">
                      Học sinh: {cls.studentIds?.length || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setClassForm({ 
                          name: cls.name, 
                          teacherId: cls.teacherId?._id || '' 
                        });
                      }}
                      className="p-2 glass-card hover:bg-white/20 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls._id)}
                      className="p-2 glass-card hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Gift className="w-7 h-7" />
              Quản Lý Phần Thưởng
            </h2>

            <form onSubmit={editingReward ? handleUpdateReward : handleCreateReward} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingReward ? 'Chỉnh Sửa Phần Thưởng' : 'Thêm Phần Thưởng Mới'}</h3>
              <input
                type="text"
                placeholder="Tên Phần Thưởng"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Giá (điểm)"
                value={rewardForm.cost}
                onChange={(e) => setRewardForm({ ...rewardForm, cost: parseInt(e.target.value) })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="URL Hình Ảnh (tùy chọn)"
                value={rewardForm.imageUrl}
                onChange={(e) => setRewardForm({ ...rewardForm, imageUrl: e.target.value })}
                className="input-field"
              />
              <textarea
                placeholder="Mô tả (tùy chọn)"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                className="input-field resize-none"
                rows="2"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingReward ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                {editingReward && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReward(null);
                      setRewardForm({ name: '', cost: 0, imageUrl: '', description: '' });
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div key={reward._id} className="glass-card p-4">
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-6xl mb-3">
                    {reward.imageUrl ? (
                      <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      '🎁'
                    )}
                  </div>
                  <h4 className="text-white font-semibold mb-1">{reward.name}</h4>
                  <p className="text-white/60 text-sm mb-2">{reward.description}</p>
                  <p className="text-yellow-400 font-bold mb-3">⭐ {reward.cost} points</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingReward(reward);
                        setRewardForm(reward);
                      }}
                      className="flex-1 py-2 glass-card hover:bg-white/20 rounded-lg text-white text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward._id)}
                      className="flex-1 py-2 glass-card hover:bg-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              Quản Lý Milestones
            </h2>

            <form onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingMilestone ? 'Chỉnh Sửa Milestone' : 'Thêm Milestone Mới'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Ví dụ: 7 Ngày Liên Tiếp"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="number"
                  placeholder="Ví dụ: 7 (số ngày liên tiếp cần đạt)"
                  value={milestoneForm.dayCount}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, dayCount: parseInt(e.target.value) })}
                  className="input-field"
                  required
                  min="1"
                />
                <textarea
                  placeholder="Mô tả ngắn về milestone này (tùy chọn)"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="input-field resize-none"
                  rows="2"
                />
                <input
                  type="number"
                  placeholder="Ví dụ: 50 (số điểm học sinh nhận được)"
                  value={milestoneForm.rewardPoints}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, rewardPoints: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Ví dụ: 🏆 (1-2 ký tự emoji)"
                  value={milestoneForm.icon}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, icon: e.target.value })}
                  className="input-field"
                  maxLength="2"
                />
                <input
                  type="text"
                  placeholder="Ví dụ: #FFD700 (mã màu hex)"
                  value={milestoneForm.color}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, color: e.target.value })}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Ví dụ: 1 (số càng nhỏ càng hiển thị trước)"
                  value={milestoneForm.order}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, order: parseInt(e.target.value) || 1 })}
                  className="input-field"
                  min="0"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={milestoneForm.isActive}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="isActive" className="text-white">Kích hoạt</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingMilestone ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
                {editingMilestone && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMilestone(null);
                      setMilestoneForm({ 
                        name: '', 
                        description: '', 
                        dayCount: 1, 
                        rewardPoints: 0, 
                        rewardMessage: '', 
                        icon: '🏆', 
                        color: '#FFD700',
                        order: 1,
                        isActive: true
                      });
                    }}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {milestones.sort((a, b) => (a.order || 0) - (b.order || 0) || a.dayCount - b.dayCount).map((milestone) => (
                <div key={milestone._id} className="glass-card p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{milestone.icon || '🏆'}</div>
                    <div>
                      <h4 className="text-white font-semibold">{milestone.name}</h4>
                      <p className="text-white/60 text-sm">{milestone.description || `Milestone ${milestone.dayCount} ngày`}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-yellow-400 text-sm">📅 {milestone.dayCount} ngày</span>
                        {milestone.rewardPoints > 0 && (
                          <span className="text-green-400 text-sm">⭐ +{milestone.rewardPoints} điểm</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${milestone.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {milestone.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                        </span>
                        <span className="text-white/40 text-xs">Thứ tự: {milestone.order || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setMilestoneForm({
                          name: milestone.name,
                          description: milestone.description || '',
                          dayCount: milestone.dayCount,
                          rewardPoints: milestone.rewardPoints || 0,
                          rewardMessage: milestone.rewardMessage || '',
                          icon: milestone.icon || '🏆',
                          color: milestone.color || '#FFD700',
                          order: milestone.order || milestone.dayCount,
                          isActive: milestone.isActive !== undefined ? milestone.isActive : true
                        });
                      }}
                      className="p-2 glass-card hover:bg-white/20 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone._id)}
                      className="p-2 glass-card hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {milestones.length === 0 && (
                <p className="text-white/70 text-center py-8">
                  Chưa có milestones nào. Hãy tạo milestone đầu tiên!
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-7 h-7" />
              Cài Đặt Hệ Thống
            </h2>

            <div className="space-y-6">
              {/* Submission Limit Toggle */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Giới Hạn Gửi Cảm Xúc
                    </h3>
                    <p className="text-white/70 text-sm">
                      {submissionLimitEnabled 
                        ? 'Học sinh chỉ có thể gửi cảm xúc 1 lần mỗi ngày (reset vào 0h)'
                        : 'Đã tắt giới hạn - Học sinh có thể gửi cảm xúc nhiều lần trong ngày'}
                    </p>
                  </div>
                  <button
                    onClick={toggleSubmissionLimit}
                    disabled={loadingSetting}
                    className={`
                      relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                      ${submissionLimitEnabled ? 'bg-green-500' : 'bg-gray-600'}
                      ${loadingSetting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                        ${submissionLimitEnabled ? 'translate-x-7' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
                <div className="mt-4 text-xs text-white/50">
                  {submissionLimitEnabled ? '✅ Đang bật' : '❌ Đang tắt'}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && globalStats && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Thống Kê Tổng Quan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{globalStats.totalStudents}</p>
                <p className="text-white/70">Tổng Số Học Sinh</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{globalStats.totalEmotions}</p>
                <p className="text-white/70">Tổng Số Lượt Gửi</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{classes.length}</p>
                <p className="text-white/70">Tổng Số Lớp</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Phân Bố Cảm Xúc</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(globalStats.emotionDistribution).map(([emotion, count]) => {
                  const EMOTION_LABELS = {
                    happy: 'Vui vẻ',
                    neutral: 'Bình thường',
                    sad: 'Buồn',
                    angry: 'Giận dữ',
                    tired: 'Mệt mỏi'
                  };
                  return (
                  <div key={emotion} className="text-center glass-card p-4 rounded-xl">
                    <p className="text-3xl font-bold text-white mb-1">{count}</p>
                      <p className="text-white/70">{EMOTION_LABELS[emotion] || emotion}</p>
                  </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
