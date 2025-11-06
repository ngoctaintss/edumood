import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { 
  Users, GraduationCap, Gift, Plus, Trash2, Edit2, TrendingUp 
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
  getGlobalAnalytics
} from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' });
  const [classForm, setClassForm] = useState({ name: '', teacherId: '' });
  const [rewardForm, setRewardForm] = useState({ name: '', cost: 0, imageUrl: '', description: '' });
  
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingReward, setEditingReward] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [teachersData, classesData, rewardsData, statsData] = await Promise.all([
        getAllTeachers(),
        getAllClasses(),
        getAllRewards(),
        getGlobalAnalytics()
      ]);
      
      setTeachers(teachersData);
      setClasses(classesData);
      setRewards(rewardsData);
      setGlobalStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Teacher Management
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      await createTeacher(teacherForm);
      setTeacherForm({ name: '', email: '', password: '' });
      loadAllData();
      alert('Teacher created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      await updateTeacher(editingTeacher._id, teacherForm);
      setEditingTeacher(null);
      setTeacherForm({ name: '', email: '', password: '' });
      loadAllData();
      alert('Teacher updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteTeacher(id);
        loadAllData();
        alert('Teacher deleted successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete teacher');
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
      alert('Class created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create class');
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
      alert('Class updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure? This will remove the class from all teachers.')) {
      try {
        await deleteClass(id);
        loadAllData();
        alert('Class deleted successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete class');
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
      alert('Reward created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create reward');
    }
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();
    try {
      await updateReward(editingReward._id, rewardForm);
      setEditingReward(null);
      setRewardForm({ name: '', cost: 0, imageUrl: '', description: '' });
      loadAllData();
      alert('Reward updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update reward');
    }
  };

  const handleDeleteReward = async (id) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      try {
        await deleteReward(id);
        loadAllData();
        alert('Reward deleted successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete reward');
      }
    }
  };

  const tabs = [
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'classes', label: 'Classes', icon: Users },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'stats', label: 'Statistics', icon: TrendingUp }
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
          Admin Dashboard
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
              Manage Teachers
            </h2>

            <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <input
                type="text"
                placeholder="Name"
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
                placeholder={editingTeacher ? 'New Password (leave blank to keep current)' : 'Password'}
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                className="input-field"
                required={!editingTeacher}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingTeacher ? 'Update' : 'Create'}
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
                    Cancel
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
                    <p className="text-white/60 text-sm">{teacher.classIds?.length || 0} classes assigned</p>
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
              Manage Classes
            </h2>

            <form onSubmit={editingClass ? handleUpdateClass : handleCreateClass} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <input
                type="text"
                placeholder="Class Name"
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
                <option value="">Select Teacher (Optional)</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id} className="bg-gray-800">
                    {teacher.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Update' : 'Create'}
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
                    Cancel
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
                      Teacher: {cls.teacherId?.name || 'Not assigned'}
                    </p>
                    <p className="text-white/60 text-sm">
                      Students: {cls.studentIds?.length || 0}
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
              Manage Rewards
            </h2>

            <form onSubmit={editingReward ? handleUpdateReward : handleCreateReward} className="glass-card p-4 mb-6 space-y-4">
              <h3 className="text-white font-semibold">{editingReward ? 'Edit Reward' : 'Add New Reward'}</h3>
              <input
                type="text"
                placeholder="Reward Name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Cost (points)"
                value={rewardForm.cost}
                onChange={(e) => setRewardForm({ ...rewardForm, cost: parseInt(e.target.value) })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={rewardForm.imageUrl}
                onChange={(e) => setRewardForm({ ...rewardForm, imageUrl: e.target.value })}
                className="input-field"
              />
              <textarea
                placeholder="Description (optional)"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                className="input-field resize-none"
                rows="2"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingReward ? 'Update' : 'Create'}
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
                    Cancel
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
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward._id)}
                      className="flex-1 py-2 glass-card hover:bg-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && globalStats && (
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Global Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{globalStats.totalStudents}</p>
                <p className="text-white/70">Total Students</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{globalStats.totalEmotions}</p>
                <p className="text-white/70">Total Submissions</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-4xl font-bold text-white mb-2">{classes.length}</p>
                <p className="text-white/70">Total Classes</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Emotion Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(globalStats.emotionDistribution).map(([emotion, count]) => (
                  <div key={emotion} className="text-center glass-card p-4 rounded-xl">
                    <p className="text-3xl font-bold text-white mb-1">{count}</p>
                    <p className="text-white/70 capitalize">{emotion}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
