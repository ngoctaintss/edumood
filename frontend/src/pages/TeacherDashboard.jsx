import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { EmotionPieChart, EmotionBarChart, WeeklyTrendChart } from '../components/Charts';
import AIInsightBox from '../components/AIInsightBox';
import { 
  Users, Plus, Trash2, Edit2, FileText, TrendingUp, CheckCircle, XCircle,
  Calendar, BarChart3, Sparkles, UserPlus, Save, X, Search, Filter
} from 'lucide-react';
import {
  getStudentsByClass,
  createStudent,
  updateStudent,
  deleteStudent,
  getClassAnalytics,
  getAIAnalysis,
  checkTodaySubmission,
  getAllClasses
} from '../utils/api';
import jsPDF from 'jspdf';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const [studentForm, setStudentForm] = useState({
    studentId: '',
    name: '',
    password: ''
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadAnalytics();
      checkStudentSubmissions();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const allClasses = await getAllClasses();
      const teacherClasses = allClasses.filter(c => 
        user.classIds.includes(c._id)
      );
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0]._id);
      }
    } catch (error) {
      console.error('Không thể tải danh sách lớp:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await getStudentsByClass(selectedClass);
      setStudents(data);
    } catch (error) {
      console.error('Không thể tải học sinh:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getClassAnalytics(selectedClass);
      setAnalytics(data);
    } catch (error) {
      console.error('Không thể tải phân tích:', error);
    }
  };

  const checkStudentSubmissions = async () => {
    try {
      const data = await getStudentsByClass(selectedClass);
      const status = {};
      
      for (const student of data) {
        const result = await checkTodaySubmission(student._id);
        status[student._id] = result.submitted;
      }
      
      setSubmissionStatus(status);
    } catch (error) {
      console.error('Không thể kiểm tra trạng thái:', error);
    }
  };

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const data = await getAIAnalysis(selectedClass);
      setAiAnalysis(data);
    } catch (error) {
      console.error('Lỗi phân tích AI:', error);
      alert('Không thể phân tích AI. Vui lòng kiểm tra OpenAI API key.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await createStudent({
        ...studentForm,
        classId: selectedClass
      });
      setShowStudentForm(false);
      setStudentForm({ studentId: '', name: '', password: '' });
      loadStudents();
      alert('Tạo học sinh thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể tạo học sinh');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await updateStudent(editingStudent._id, {
        name: studentForm.name,
        password: studentForm.password || undefined
      });
      setEditingStudent(null);
      setStudentForm({ studentId: '', name: '', password: '' });
      loadStudents();
      alert('Cập nhật học sinh thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật học sinh');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa học sinh này?')) {
      try {
        await deleteStudent(id);
        loadStudents();
        alert('Xóa học sinh thành công!');
      } catch (error) {
        alert(error.response?.data?.message || 'Không thể xóa học sinh');
      }
    }
  };

  const startEdit = (student) => {
    setEditingStudent(student);
    setStudentForm({
      studentId: student.studentId,
      name: student.name,
      password: ''
    });
    setShowStudentForm(true);
  };

  const cancelForm = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    setStudentForm({ studentId: '', name: '', password: '' });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Báo Cáo Cảm Xúc Học Sinh', 20, 20);
    
    doc.setFontSize(12);
    const className = classes.find(c => c._id === selectedClass)?.name || 'Lớp';
    doc.text(`Lớp: ${className}`, 20, 35);
    doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`, 20, 42);
    
    if (analytics) {
      doc.setFontSize(14);
      doc.text('Phân Bố Cảm Xúc:', 20, 55);
      doc.setFontSize(10);
      let y = 65;
      Object.entries(analytics.emotionDistribution).forEach(([emotion, count]) => {
        const emotionLabels = {
          happy: 'Vui vẻ',
          neutral: 'Bình thường',
          sad: 'Buồn',
          angry: 'Giận dữ',
          tired: 'Mệt mỏi'
        };
        doc.text(`${emotionLabels[emotion]}: ${count} lượt gửi`, 25, y);
        y += 7;
      });
    }
    
    if (aiAnalysis) {
      doc.setFontSize(14);
      doc.text('Nhận Định AI:', 20, y + 10);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(aiAnalysis.summary, 170);
      doc.text(lines, 20, y + 20);
    }
    
    doc.save(`bao-cao-${Date.now()}.pdf`);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Tổng Quan', icon: BarChart3 },
    { id: 'students', label: 'Học Sinh', icon: Users },
    { id: 'analytics', label: 'Phân Tích', icon: TrendingUp },
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const submittedCount = Object.values(submissionStatus).filter(Boolean).length;
  const submissionRate = students.length > 0 
    ? Math.round((submittedCount / students.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen pb-8">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Bảng Điều Khiển Giáo Viên
          </h1>
          <p className="text-white/70">Quản lý và theo dõi cảm xúc học sinh</p>
        </motion.div>

        {/* Class Selector & Quick Actions */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard className="lg:col-span-2 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-white/80 mb-2 text-sm font-medium">
                  Chọn Lớp
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id} className="bg-gray-800">
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAIAnalysis}
                  disabled={loadingAI}
                  className="btn-primary flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {loadingAI ? 'Đang phân tích...' : 'AI Phân Tích'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportPDF}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Xuất PDF
                </motion.button>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {submissionRate}%
              </div>
              <div className="text-white/70 text-sm">Tỷ lệ gửi hôm nay</div>
              <div className="mt-2 text-white/60 text-xs">
                {submittedCount}/{students.length} học sinh
              </div>
            </div>
          </GlassCard>
        </div>

        {/* AI Insights */}
        <AnimatePresence>
          {(aiAnalysis || loadingAI) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <AIInsightBox analysis={aiAnalysis} loading={loadingAI} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="mb-6">
          <GlassCard className="p-2">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 py-3 px-4 rounded-xl font-semibold transition-all
                      flex items-center justify-center gap-2
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && analytics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-6 text-center bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                  <div className="text-4xl mb-2">😊</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.emotionDistribution.happy}
                  </div>
                  <div className="text-white/70 text-sm">Vui vẻ</div>
                </GlassCard>

                <GlassCard className="p-6 text-center bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                  <div className="text-4xl mb-2">😔</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.emotionDistribution.sad}
                  </div>
                  <div className="text-white/70 text-sm">Buồn</div>
                </GlassCard>

                <GlassCard className="p-6 text-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                  <div className="text-4xl mb-2">😡</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.emotionDistribution.angry}
                  </div>
                  <div className="text-white/70 text-sm">Giận dữ</div>
                </GlassCard>

                <GlassCard className="p-6 text-center bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                  <div className="text-4xl mb-2">😴</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.emotionDistribution.tired}
                  </div>
                  <div className="text-white/70 text-sm">Mệt mỏi</div>
                </GlassCard>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Phân Bố Cảm Xúc
                  </h3>
                  <EmotionPieChart data={analytics.emotionDistribution} />
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Số Lượng Theo Loại
                  </h3>
                  <EmotionBarChart data={analytics.emotionDistribution} />
                </GlassCard>
              </div>

              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Xu Hướng Theo Tuần
                </h3>
                <WeeklyTrendChart data={analytics.dailyTrends} />
              </GlassCard>
            </motion.div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard>
                {/* Header with Search */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-7 h-7" />
                        Học Sinh ({students.length})
                      </h3>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="input-field pl-10 pr-4"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowStudentForm(!showStudentForm)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <UserPlus className="w-5 h-5" />
                        Thêm Học Sinh
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Student Form */}
                <AnimatePresence>
                  {showStudentForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 border-b border-white/10 bg-white/5"
                    >
                      <form
                        onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
                        className="space-y-4"
                      >
                        <h4 className="text-white font-semibold text-lg mb-4">
                          {editingStudent ? 'Sửa Học Sinh' : 'Thêm Học Sinh Mới'}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {!editingStudent && (
                            <input
                              type="text"
                              placeholder="Mã học sinh"
                              value={studentForm.studentId}
                              onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                              className="input-field"
                              required
                            />
                          )}

                          <input
                            type="text"
                            placeholder="Họ tên"
                            value={studentForm.name}
                            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                            className="input-field"
                            required
                          />

                          <input
                            type="password"
                            placeholder={editingStudent ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                            value={studentForm.password}
                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                            className="input-field"
                            required={!editingStudent}
                          />
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                          >
                            <Save className="w-5 h-5" />
                            {editingStudent ? 'Cập Nhật' : 'Tạo'}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={cancelForm}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Hủy
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Student List */}
                <div className="p-6">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70">
                        {searchTerm ? 'Không tìm thấy học sinh' : 'Chưa có học sinh nào'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student) => (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -5 }}
                          className="glass-card p-4 rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {getInitials(student.name)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold truncate">
                                {student.name}
                              </h4>
                              <p className="text-white/60 text-sm">
                                Mã: {student.studentId}
                              </p>

                              {/* Status Badge */}
                              <div className="mt-2">
                                {submissionStatus[student._id] ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                                    <CheckCircle className="w-3 h-3" />
                                    Đã gửi
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs">
                                    <XCircle className="w-3 h-3" />
                                    Chưa gửi
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => startEdit(student)}
                                className="p-2 glass-card hover:bg-white/20 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4 text-white" />
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteStudent(student._id)}
                                className="p-2 glass-card hover:bg-red-500/20 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Thống Kê Chi Tiết
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center glass-card p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">
                      {analytics.totalEmotions}
                    </div>
                    <div className="text-white/70 text-sm mt-1">
                      Tổng lượt gửi
                    </div>
                  </div>

                  <div className="text-center glass-card p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">
                      {students.length}
                    </div>
                    <div className="text-white/70 text-sm mt-1">
                      Học sinh
                    </div>
                  </div>

                  <div className="text-center glass-card p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">
                      {submittedCount}
                    </div>
                    <div className="text-white/70 text-sm mt-1">
                      Đã gửi hôm nay
                    </div>
                  </div>

                  <div className="text-center glass-card p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">
                      {submissionRate}%
                    </div>
                    <div className="text-white/70 text-sm mt-1">
                      Tỷ lệ tham gia
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <h4 className="text-white font-semibold mb-4">
                    Phân Bố Chi Tiết
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.emotionDistribution).map(([emotion, count]) => {
                      const emotionLabels = {
                        happy: { label: 'Vui vẻ', emoji: '😊', color: 'from-yellow-400 to-orange-400' },
                        neutral: { label: 'Bình thường', emoji: '😐', color: 'from-gray-400 to-gray-500' },
                        sad: { label: 'Buồn', emoji: '😔', color: 'from-blue-400 to-blue-600' },
                        angry: { label: 'Giận dữ', emoji: '😡', color: 'from-red-400 to-red-600' },
                        tired: { label: 'Mệt mỏi', emoji: '😴', color: 'from-purple-400 to-indigo-500' },
                      };
                      const info = emotionLabels[emotion];
                      const percentage = analytics.totalEmotions > 0 
                        ? ((count / analytics.totalEmotions) * 100).toFixed(1) 
                        : 0;

                      return (
                        <div key={emotion} className="flex items-center gap-3">
                          <div className="text-2xl">{info.emoji}</div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-white">{info.label}</span>
                              <span className="text-white/70">{count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${info.color}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherDashboard;
