import Emotion from '../models/Emotion.js';
import Student from '../models/Student.js';

// Lazy load OpenAI only when needed, after env is loaded
let openai = null;
const getOpenAI = async () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

// @desc    Get analytics for a class
// @route   GET /api/analytics/class/:classId
// @access  Private (Teacher)
export const getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { days = 7 } = req.query;

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    // Get all students in class
    const students = await Student.find({ classId }).select('_id name');
    const studentIds = students.map(s => s._id);

    // Build date query based on days
    let dateQuery = {};
    const daysAgo = new Date();
    
    if (parseInt(days) === 1) {
      // Today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateQuery = { $gte: today, $lt: tomorrow };
    } else {
      // Last N days
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      daysAgo.setHours(0, 0, 0, 0);
      dateQuery = { $gte: daysAgo };
    }

    // Get emotions
    const emotions = await Emotion.find({
      studentId: { $in: studentIds },
      date: dateQuery
    }).populate('studentId', 'name studentId');

    // Calculate emotion distribution
    const emotionCounts = {
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
      tired: 0
    };

    emotions.forEach(e => {
      emotionCounts[e.emotion]++;
    });

    // Calculate daily trends
    const dailyTrends = {};
    emotions.forEach(e => {
      const date = e.date.toISOString().split('T')[0];
      if (!dailyTrends[date]) {
        dailyTrends[date] = { happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0 };
      }
      dailyTrends[date][e.emotion]++;
    });

    // Check who submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySubmissions = await Emotion.find({
      studentId: { $in: studentIds },
      date: { $gte: today, $lt: tomorrow }
    }).distinct('studentId');

    const submissionStatus = students.map(student => ({
      studentId: student._id,
      name: student.name,
      submitted: todaySubmissions.some(id => id.toString() === student._id.toString())
    }));

    res.json({
      totalEmotions: emotions.length,
      emotionDistribution: emotionCounts,
      dailyTrends: Object.entries(dailyTrends).map(([date, counts]) => ({
        date,
        ...counts
      })),
      submissionStatus,
      emotions: emotions.slice(0, 50) // Return latest 50 for display
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get AI analysis of class emotions
// @route   POST /api/analytics/ai
// @access  Private (Teacher)
export const getAIAnalysis = async (req, res) => {
  try {
    const { classId, days = 7 } = req.body;

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        summary: 'Phân tích AI chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào biến môi trường để kích hoạt tính năng này.',
        suggestions: ['Cấu hình OpenAI API key trong file .env'],
        emotionDistribution: {}
      });
    }

    // Get OpenAI instance
    const openaiClient = await getOpenAI();
    if (!openaiClient) {
      return res.json({
        summary: 'Phân tích AI tạm thời không khả dụng.',
        suggestions: ['Vui lòng thử lại sau'],
        emotionDistribution: {}
      });
    }

    // Get all students in class
    const students = await Student.find({ classId }).select('_id name studentId');
    const studentIds = students.map(s => s._id);

    // Build date query based on days
    let dateQuery = {};
    const daysAgo = new Date();
    
    if (parseInt(days) === 1) {
      // Today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateQuery = { $gte: today, $lt: tomorrow };
    } else {
      // Last N days
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      daysAgo.setHours(0, 0, 0, 0);
      dateQuery = { $gte: daysAgo };
    }

    // Get emotions with messages
    const emotions = await Emotion.find({
      studentId: { $in: studentIds },
      date: dateQuery
    }).populate('studentId', 'name studentId').sort({ date: -1 });

    if (emotions.length === 0) {
      return res.json({
        summary: 'Không có dữ liệu cảm xúc để phân tích.',
        suggestions: ['Khuyến khích học sinh chia sẻ cảm xúc hàng ngày.']
      });
    }

    // Dangerous keywords
    const DANGER_KEYWORDS = [
      'tự tử', 'tự hại', 'không muốn sống', 'muốn chết', 'tự sát', 
      'giết mình', 'chán sống', 'bỏ học', 'bỏ đi', 'ghét bản thân'
    ];

    // Analyze each student for concerning patterns
    const studentAnalysis = students.map(student => {
      const studentEmotions = emotions.filter(e => 
        e.studentId._id.toString() === student._id.toString()
      );
      
      const negativeEmotions = studentEmotions.filter(e => 
        ['sad', 'angry', 'tired'].includes(e.emotion)
      );
      
      const negativeRatio = studentEmotions.length > 0 
        ? (negativeEmotions.length / studentEmotions.length) * 100 
        : 0;
      
      // Check for dangerous keywords
      const dangerousMessages = studentEmotions.filter(e => {
        if (!e.message) return false;
        const messageLower = e.message.toLowerCase();
        return DANGER_KEYWORDS.some(keyword => messageLower.includes(keyword));
      });
      
      // Check consecutive negative days
      const dates = [...new Set(studentEmotions.map(e => 
        e.date.toISOString().split('T')[0]
      ))].sort().reverse();
      
      let consecutiveNegative = 0;
      let currentConsecutive = 0;
      for (const date of dates) {
        const dayEmotions = studentEmotions.filter(e => 
          e.date.toISOString().split('T')[0] === date
        );
        const hasNegative = dayEmotions.some(e => 
          ['sad', 'angry', 'tired'].includes(e.emotion)
        );
        
        if (hasNegative) {
          currentConsecutive++;
          consecutiveNegative = Math.max(consecutiveNegative, currentConsecutive);
        } else {
          currentConsecutive = 0;
        }
      }
      
      // Calculate risk level
      let riskLevel = 'low';
      let riskScore = 0;
      
      if (dangerousMessages.length > 0) {
        riskLevel = 'critical';
        riskScore = 100;
      } else if (consecutiveNegative >= 3 || negativeRatio >= 60) {
        riskLevel = 'high';
        riskScore = 70 + (consecutiveNegative * 5);
      } else if (negativeRatio >= 40 || consecutiveNegative >= 2) {
        riskLevel = 'medium';
        riskScore = 40 + (negativeRatio * 0.5);
      }
      
      return {
        studentId: student._id,
        name: student.name || student.studentId,
        totalEmotions: studentEmotions.length,
        negativeCount: negativeEmotions.length,
        negativeRatio: parseFloat(negativeRatio.toFixed(1)),
        consecutiveNegativeDays: consecutiveNegative,
        hasDangerousKeywords: dangerousMessages.length > 0,
        dangerousMessages: dangerousMessages.map(e => e.message),
        riskLevel,
        riskScore
      };
    });

    // Filter concerning students
    const concerningStudents = studentAnalysis
      .filter(s => s.riskLevel !== 'low')
      .sort((a, b) => b.riskScore - a.riskScore);

    // Calculate statistics
    const emotionCounts = {
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
      tired: 0
    };

    emotions.forEach(e => {
      emotionCounts[e.emotion]++;
    });

    const total = emotions.length;
    const percentages = {};
    Object.keys(emotionCounts).forEach(key => {
      percentages[key] = ((emotionCounts[key] / total) * 100).toFixed(1);
    });

    // Collect messages for context (prioritize concerning students)
    const concerningStudentIds = new Set(concerningStudents.map(s => s.studentId.toString()));
    const concerningMessages = emotions
      .filter(e => concerningStudentIds.has(e.studentId._id.toString()) && e.message && e.message.trim().length > 0)
      .slice(0, 10);
    
    const otherMessages = emotions
      .filter(e => !concerningStudentIds.has(e.studentId._id.toString()) && e.message && e.message.trim().length > 0)
      .slice(0, 10);
    
    const messages = [...concerningMessages, ...otherMessages]
      .map(e => {
        const studentName = e.studentId.name || e.studentId.studentId;
        return `${studentName} (${e.emotion}): "${e.message}"`;
      })
      .slice(0, 20);

    // Create prompt for OpenAI (Vietnamese)
    const dateRangeText = parseInt(days) === 1 
      ? 'hôm nay'
      : `${parseInt(days)} ngày qua`;

    // Build concerning students text
    let concerningStudentsText = '';
    if (concerningStudents.length > 0) {
      const criticalStudents = concerningStudents.filter(s => s.riskLevel === 'critical');
      const highRiskStudents = concerningStudents.filter(s => s.riskLevel === 'high');
      const mediumRiskStudents = concerningStudents.filter(s => s.riskLevel === 'medium');
      
      concerningStudentsText = '\n\n🚨 HỌC SINH CẦN QUAN TÂM ĐẶC BIỆT:\n';
      
      if (criticalStudents.length > 0) {
        concerningStudentsText += '\n⚠️ MỨC ĐỘ NGHIÊM TRỌNG (CRITICAL):\n';
        criticalStudents.forEach(s => {
          concerningStudentsText += `- ${s.name}: Có từ nguy hiểm trong tin nhắn. Cần can thiệp ngay lập tức!\n`;
          if (s.dangerousMessages.length > 0) {
            concerningStudentsText += `  Tin nhắn: "${s.dangerousMessages[0]}"\n`;
          }
        });
      }
      
      if (highRiskStudents.length > 0) {
        concerningStudentsText += '\n🔴 MỨC ĐỘ CAO (HIGH RISK):\n';
        highRiskStudents.forEach(s => {
          concerningStudentsText += `- ${s.name}: ${s.consecutiveNegativeDays} ngày liên tiếp cảm xúc tiêu cực, ${s.negativeRatio}% cảm xúc tiêu cực\n`;
        });
      }
      
      if (mediumRiskStudents.length > 0) {
        concerningStudentsText += '\n🟡 MỨC ĐỘ TRUNG BÌNH (MEDIUM RISK):\n';
        mediumRiskStudents.forEach(s => {
          concerningStudentsText += `- ${s.name}: ${s.negativeRatio}% cảm xúc tiêu cực, ${s.consecutiveNegativeDays} ngày liên tiếp\n`;
        });
      }
    } else {
      concerningStudentsText = '\n\n✅ Không có học sinh nào cần quan tâm đặc biệt. Tình hình lớp học ổn định.';
    }

    const prompt = `Bạn là một chuyên gia tâm lý học đường với 20 năm kinh nghiệm, chuyên phân tích cảm xúc học sinh trung học cơ sở tại Việt Nam.

📊 DỮ LIỆU PHÂN TÍCH (${dateRangeText}):
- Tổng số lượt gửi cảm xúc: ${total}
- Phân bố cảm xúc:
  • Vui vẻ: ${percentages.happy}% (${emotionCounts.happy} lượt)
  • Bình thường: ${percentages.neutral}% (${emotionCounts.neutral} lượt)
  • Buồn: ${percentages.sad}% (${emotionCounts.sad} lượt)
  • Giận dữ: ${percentages.angry}% (${emotionCounts.angry} lượt)
  • Mệt mỏi: ${percentages.tired}% (${emotionCounts.tired} lượt)

${concerningStudentsText}

${messages.length > 0 ? `💬 MỘT SỐ TIN NHẮN CỦA HỌC SINH:\n${messages.join('\n')}\n` : ''}

📝 YÊU CẦU PHÂN TÍCH:
Hãy cung cấp phân tích CHI TIẾT và CHUYÊN NGHIỆP bằng tiếng Việt với cấu trúc sau:

### 1. Tóm tắt ngắn gọn
(2-3 câu về bầu không khí cảm xúc tổng thể của lớp)

### 2. Các insights và mẫu hành vi
(Phân tích các pattern, xu hướng, điểm đáng chú ý - ít nhất 3-4 điểm)

### 3. Gợi ý cụ thể cho giáo viên
(3-4 hành động CỤ THỂ, THỰC TẾ có thể làm ngay - mỗi gợi ý nên có: hành động, lý do, thời gian thực hiện)

${concerningStudents.length > 0 ? `\n⚠️ LƯU Ý ĐẶC BIỆT: Hãy nhấn mạnh và đưa ra gợi ý CỤ THỂ cho các học sinh cần quan tâm được liệt kê ở trên.` : ''}

Hãy trình bày chuyên nghiệp, đồng cảm, tích cực nhưng thực tế. Sử dụng tiếng Việt tự nhiên, dễ hiểu cho giáo viên.`;

    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Bạn là một chuyên gia tâm lý học đường với 20 năm kinh nghiệm, chuyên về sức khỏe tinh thần của học sinh trung học cơ sở tại Việt Nam. Bạn luôn trả lời bằng tiếng Việt một cách tự nhiên, chuyên nghiệp, đồng cảm và thực tế."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      summary: aiResponse,
      emotionDistribution: percentages,
      totalSubmissions: total,
      period: parseInt(days),
      dateRange: {
        start: parseInt(days) === 1 ? 'Hôm nay' : `${parseInt(days)} ngày qua`,
        end: 'Hôm nay'
      },
      concerningStudents: concerningStudents.map(s => ({
        name: s.name,
        riskLevel: s.riskLevel,
        riskScore: s.riskScore,
        negativeRatio: s.negativeRatio,
        consecutiveNegativeDays: s.consecutiveNegativeDays,
        hasDangerousKeywords: s.hasDangerousKeywords,
        dangerousMessages: s.dangerousMessages
      }))
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Fallback response if OpenAI fails
    res.status(200).json({
      summary: 'Phân tích AI tạm thời không khả dụng. Vui lòng kiểm tra OpenAI API key và thử lại. Lỗi: ' + error.message,
      emotionDistribution: {},
      error: 'Lỗi OpenAI API'
    });
  }
};

// @desc    Get global statistics (Admin)
// @route   GET /api/analytics/global
// @access  Private (Admin)
export const getGlobalAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalEmotions = await Emotion.countDocuments();

    // Get emotion distribution across all students
    const emotions = await Emotion.find();
    const emotionCounts = {
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
      tired: 0
    };

    emotions.forEach(e => {
      emotionCounts[e.emotion]++;
    });

    res.json({
      totalStudents,
      totalEmotions,
      emotionDistribution: emotionCounts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get AI analysis for a specific student
// @route   POST /api/analytics/student/:studentId
// @access  Private (Teacher/Admin)
export const getStudentAIAnalysis = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 7 } = req.query;

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        summary: 'Phân tích AI chưa được cấu hình.',
        suggestions: []
      });
    }

    // Get OpenAI instance
    const openaiClient = await getOpenAI();
    if (!openaiClient) {
      return res.json({
        summary: 'Phân tích AI tạm thời không khả dụng.',
        suggestions: []
      });
    }

    // Get student info
    const student = await Student.findById(studentId).populate('classId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === student.classId._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get emotions for the specified period
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);

    const emotions = await Emotion.find({
      studentId: studentId,
      date: { $gte: daysAgo }
    }).sort({ date: -1 });

    if (emotions.length === 0) {
      return res.json({
        summary: `Học sinh ${student.name} chưa có dữ liệu cảm xúc trong ${days} ngày qua.`,
        suggestions: ['Khuyến khích học sinh chia sẻ cảm xúc thường xuyên hơn.']
      });
    }

    // Calculate statistics
    const emotionCounts = {
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
      tired: 0
    };

    emotions.forEach(e => {
      emotionCounts[e.emotion]++;
    });

    const total = emotions.length;
    const percentages = {};
    Object.keys(emotionCounts).forEach(key => {
      percentages[key] = ((emotionCounts[key] / total) * 100).toFixed(1);
    });

    // Get messages
    const messages = emotions
      .filter(e => e.message && e.message.trim().length > 0)
      .map(e => `"${e.message}"`)
      .slice(0, 15);

    // Daily breakdown
    const dailyBreakdown = {};
    emotions.forEach(e => {
      const dateStr = e.date.toISOString().split('T')[0];
      if (!dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr] = { happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0 };
      }
      dailyBreakdown[dateStr][e.emotion]++;
    });

    // Create prompt
    const prompt = `Bạn là chuyên gia tâm lý học đường. Phân tích cảm xúc của học sinh ${student.name} trong ${days} ngày qua:

THỐNG KÊ:
- Tổng lượt gửi: ${total}
- Vui vẻ: ${percentages.happy}% (${emotionCounts.happy} lượt)
- Bình thường: ${percentages.neutral}% (${emotionCounts.neutral} lượt)
- Buồn: ${percentages.sad}% (${emotionCounts.sad} lượt)
- Giận dữ: ${percentages.angry}% (${emotionCounts.angry} lượt)
- Mệt mỏi: ${percentages.tired}% (${emotionCounts.tired} lượt)

${messages.length > 0 ? `MỘT SỐ TIN NHẮN:\n${messages.join('\n')}` : ''}

Hãy phân tích và đưa ra:
1. Tóm tắt tình hình cảm xúc của học sinh (2-3 câu)
2. Nhận xét về xu hướng cảm xúc
3. 3-4 gợi ý cụ thể để hỗ trợ học sinh

Trả lời bằng tiếng Việt, ngắn gọn và thực tế.`;

    // Call OpenAI
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tâm lý học đường. Bạn luôn trả lời bằng tiếng Việt tự nhiên và chuyên nghiệp."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      summary: aiResponse,
      emotionDistribution: percentages,
      totalSubmissions: total,
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, counts]) => ({
        date,
        ...counts
      })),
      period: `${days} ngày`
    });

  } catch (error) {
    console.error('Student AI Analysis Error:', error);
    res.status(200).json({
      summary: 'Phân tích AI tạm thời không khả dụng.',
      suggestions: []
    });
  }
};
