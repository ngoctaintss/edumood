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
    const { startDate, endDate, period = 'week' } = req.query;

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    // Get all students in class
    const students = await Student.find({ classId }).select('_id name');
    const studentIds = students.map(s => s._id);

    // Build date query
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateQuery = { $gte: sevenDaysAgo };
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
    const { classId, startDate, endDate } = req.body;

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
    const students = await Student.find({ classId }).select('_id name');
    const studentIds = students.map(s => s._id);

    // Build date query
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateQuery = { $gte: sevenDaysAgo };
    }

    // Get emotions with messages
    const emotions = await Emotion.find({
      studentId: { $in: studentIds },
      date: dateQuery
    }).populate('studentId', 'name');

    if (emotions.length === 0) {
      return res.json({
        summary: 'Không có dữ liệu cảm xúc để phân tích.',
        suggestions: ['Khuyến khích học sinh chia sẻ cảm xúc hàng ngày.']
      });
    }

    // Prepare data for AI
    const emotionData = emotions.map(e => ({
      emotion: e.emotion,
      message: e.message,
      date: e.date.toISOString().split('T')[0]
    }));

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

    // Collect messages for context
    const messages = emotions
      .filter(e => e.message && e.message.trim().length > 0)
      .map(e => `${e.emotion}: "${e.message}"`)
      .slice(0, 20); // Limit to 20 messages

    // Create prompt for OpenAI (Vietnamese)
    const dateRangeText = startDate && endDate 
      ? `từ ${new Date(startDate).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString('vi-VN')}`
      : '7 ngày qua';

    const prompt = `Bạn là một nhà tâm lý học giáo dục chuyên phân tích dữ liệu cảm xúc của học sinh tiểu học.

Phân bố cảm xúc:
- Vui vẻ: ${percentages.happy}% (${emotionCounts.happy} lượt)
- Bình thường: ${percentages.neutral}% (${emotionCounts.neutral} lượt)
- Buồn: ${percentages.sad}% (${emotionCounts.sad} lượt)
- Giận dữ: ${percentages.angry}% (${emotionCounts.angry} lượt)
- Mệt mỏi: ${percentages.tired}% (${emotionCounts.tired} lượt)

Tổng số lượt gửi: ${total}
Khoảng thời gian: ${dateRangeText}

${messages.length > 0 ? `Một số tin nhắn của học sinh:\n${messages.join('\n')}` : ''}

Vui lòng cung cấp phân tích bằng tiếng Việt với định dạng rõ ràng:
1. Tóm tắt ngắn gọn (2-3 câu) về bầu không khí cảm xúc tổng thể
2. Các insights và mẫu hành vi bạn nhận thấy
3. 3-4 gợi ý cụ thể và thực tế cho giáo viên để cải thiện sức khỏe tinh thần của học sinh

Hãy trình bày chuyên nghiệp, đồng cảm và thực tế cho giáo viên tiểu học. Sử dụng tiếng Việt tự nhiên và dễ hiểu.`;

    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Bạn là một chuyên gia tâm lý học giáo dục chuyên về sức khỏe tinh thần của học sinh tiểu học. Bạn luôn trả lời bằng tiếng Việt một cách tự nhiên và chuyên nghiệp."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      summary: aiResponse,
      emotionDistribution: percentages,
      totalSubmissions: total,
      dateRange: {
        start: startDate || 'Last 7 days',
        end: endDate || 'Today'
      }
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
