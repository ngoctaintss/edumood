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

    // Collect sample messages for context (10 gần nhất)
    const sampleMessages = emotions
      .filter(e => e.message && e.message.trim().length > 0)
      .slice(0, 10)
      .map(e => ({
        emotion: e.emotion,
        message: e.message,
        date: e.date.toISOString().split('T')[0]
      }));

    // Calculate severity rating (0-10)
    // Negative emotions get higher severity
    const negativePercent = parseFloat(percentages.sad) + parseFloat(percentages.angry);
    const severityRating = Math.min(Math.round(negativePercent / 10 * 8), 10);

    // Identify top concerns
    const topConcerns = identifyTopConcerns(percentages, sampleMessages, total);

    // Create prompt for OpenAI (Vietnamese) - yêu cầu JSON format
    const dateRangeText = startDate && endDate 
      ? `từ ${new Date(startDate).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString('vi-VN')}`
      : '7 ngày qua';

    const prompt = `Bạn là một nhà tâm lý học giáo dục chuyên phân tích dữ liệu cảm xúc của học sinh tiểu học.

THỐNG KÊ (${dateRangeText}):
- Tổng số: ${total} lượt gửi
- 😊 Vui vẻ: ${percentages.happy}% (${emotionCounts.happy} lượt)
- 😐 Bình thường: ${percentages.neutral}% (${emotionCounts.neutral} lượt)
- 😔 Buồn: ${percentages.sad}% (${emotionCounts.sad} lượt)
- 😡 Giận dữ: ${percentages.angry}% (${emotionCounts.angry} lượt)
- 😴 Mệt mỏi: ${percentages.tired}% (${emotionCounts.tired} lượt)
- Mức độ nghiêm trọng ước tính: ${severityRating}/10

TIN NHẮN MẪU (10 gần nhất):
${sampleMessages.length > 0 
  ? sampleMessages.map((m, i) => `${i + 1}. [${m.emotion}] ${m.message}`).join('\n')
  : 'Không có tin nhắn'}

YÊU CẦU:
Trả về ĐÚNG format JSON sau (không thêm text nào khác, chỉ JSON thuần):

{
  "trendSummary": "Mô tả xu hướng cảm xúc tổng thể trong 1-2 câu bằng tiếng Việt",
  "suggestion": "Gợi ý hành động cụ thể 1-2 câu cho giáo viên bằng tiếng Việt",
  "severityRating": ${severityRating},
  "topConcerns": ["Lo ngại 1", "Lo ngại 2", "Lo ngại 3"],
  "positiveAspects": ["Điểm tích cực 1", "Điểm tích cực 2"]
}

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC.`;

    // Call OpenAI API
    let analysis;
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Bạn là chuyên gia tâm lý học đường. Phân tích cảm xúc học sinh và đưa ra gợi ý thiết thực. CHỈ TRẢ VỀ JSON hợp lệ, không thêm text hoặc markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content.trim();
      
      // Parse JSON từ response (xử lý markdown code blocks nếu có)
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.match(/```json\n([\s\S]*?)\n```/)?.[1] || content;
      } else if (content.includes('```')) {
        jsonStr = content.match(/```\n([\s\S]*?)\n```/)?.[1] || content;
      }
      
      analysis = JSON.parse(jsonStr);
      
      // Validate và đảm bảo có đủ fields
      if (!analysis.trendSummary || !analysis.suggestion) {
        throw new Error('AI response thiếu fields bắt buộc');
      }
      
      // Format summary cho frontend (kết hợp các phần)
      const formattedSummary = formatAnalysisSummary(analysis);
      
      res.json({
        summary: formattedSummary,
        trendSummary: analysis.trendSummary,
        suggestion: analysis.suggestion,
        severityRating: analysis.severityRating || severityRating,
        topConcerns: analysis.topConcerns || topConcerns,
        positiveAspects: analysis.positiveAspects || [],
        emotionDistribution: percentages,
        totalSubmissions: total,
        dateRange: {
          start: startDate || '7 ngày qua',
          end: endDate || 'Hôm nay'
        },
        aiUsed: true
      });
      
    } catch (parseError) {
      console.error('AI Parse Error:', parseError);
      // Fallback to rule-based analysis
      analysis = analyzeWithRules(percentages, sampleMessages, total, severityRating);
      
      const formattedSummary = formatAnalysisSummary(analysis);
      
      res.json({
        summary: formattedSummary,
        trendSummary: analysis.trendSummary,
        suggestion: analysis.suggestion,
        severityRating: analysis.severityRating,
        topConcerns: analysis.topConcerns,
        positiveAspects: analysis.positiveAspects || [],
        emotionDistribution: percentages,
        totalSubmissions: total,
        dateRange: {
          start: startDate || '7 ngày qua',
          end: endDate || 'Hôm nay'
        },
        aiUsed: false,
        method: 'rule-based'
      });
    }

  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Fallback to rule-based analysis
    try {
      const students = await Student.find({ classId }).select('_id name');
      const studentIds = students.map(s => s._id);
      
      let dateQuery = {};
      if (startDate && endDate) {
        dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateQuery = { $gte: sevenDaysAgo };
      }
      
      const emotions = await Emotion.find({
        studentId: { $in: studentIds },
        date: dateQuery
      });
      
      const emotionCounts = { happy: 0, neutral: 0, sad: 0, angry: 0, tired: 0 };
      emotions.forEach(e => emotionCounts[e.emotion]++);
      
      const total = emotions.length;
      const percentages = {};
      Object.keys(emotionCounts).forEach(key => {
        percentages[key] = total > 0 ? ((emotionCounts[key] / total) * 100).toFixed(1) : 0;
      });
      
      const sampleMessages = emotions
        .filter(e => e.message && e.message.trim().length > 0)
        .slice(0, 10)
        .map(e => ({ emotion: e.emotion, message: e.message }));
      
      const negativePercent = parseFloat(percentages.sad) + parseFloat(percentages.angry);
      const severityRating = Math.min(Math.round(negativePercent / 10 * 8), 10);
      
      const analysis = analyzeWithRules(percentages, sampleMessages, total, severityRating);
      const formattedSummary = formatAnalysisSummary(analysis);
      
      res.json({
        summary: formattedSummary,
        trendSummary: analysis.trendSummary,
        suggestion: analysis.suggestion,
        severityRating: analysis.severityRating,
        topConcerns: analysis.topConcerns,
        positiveAspects: analysis.positiveAspects || [],
        emotionDistribution: percentages,
        totalSubmissions: total,
        dateRange: {
          start: startDate || '7 ngày qua',
          end: endDate || 'Hôm nay'
        },
        aiUsed: false,
        method: 'rule-based',
        error: 'AI không khả dụng, sử dụng phân tích cơ bản'
      });
    } catch (fallbackError) {
      console.error('Fallback Error:', fallbackError);
      res.status(200).json({
        summary: 'Phân tích tạm thời không khả dụng. Vui lòng thử lại sau.',
        trendSummary: 'Không có dữ liệu để phân tích',
        suggestion: 'Vui lòng thử lại sau',
        severityRating: 0,
        topConcerns: [],
        positiveAspects: [],
        emotionDistribution: {},
        error: 'Lỗi hệ thống'
      });
    }
  }
};

// Helper function: Format analysis summary from structured data
function formatAnalysisSummary(analysis) {
  let summary = '';
  
  // Add trend summary
  if (analysis.trendSummary) {
    summary += `### ${analysis.trendSummary}\n\n`;
  }
  
  // Add top concerns
  if (analysis.topConcerns && analysis.topConcerns.length > 0) {
    summary += `### Các mối quan tâm:\n`;
    analysis.topConcerns.forEach((concern, index) => {
      summary += `${index + 1}. ${concern}\n`;
    });
    summary += '\n';
  }
  
  // Add positive aspects
  if (analysis.positiveAspects && analysis.positiveAspects.length > 0) {
    summary += `### Điểm tích cực:\n`;
    analysis.positiveAspects.forEach((aspect, index) => {
      summary += `${index + 1}. ${aspect}\n`;
    });
    summary += '\n';
  }
  
  // Add suggestion
  if (analysis.suggestion) {
    summary += `### Gợi ý hành động:\n${analysis.suggestion}`;
  }
  
  return summary.trim();
}

// Helper function: Identify top concerns
function identifyTopConcerns(percentages, sampleMessages, total) {
  const concerns = [];
  
  if (parseFloat(percentages.sad) > 20) {
    concerns.push(`${percentages.sad}% học sinh cảm thấy buồn`);
  }
  
  if (parseFloat(percentages.angry) > 10) {
    concerns.push(`${percentages.angry}% học sinh có cảm xúc giận dữ`);
  }
  
  if (parseFloat(percentages.tired) > 25) {
    concerns.push(`${percentages.tired}% học sinh mệt mỏi`);
  }
  
  // Phân tích keywords trong messages
  const keywords = {
    stress: ['stress', 'áp lực', 'căng thẳng', 'lo lắng'],
    bullying: ['bắt nạt', 'trêu chọc', 'chửi', 'đánh'],
    family: ['nhà', 'bố mẹ', 'gia đình', 'ba mẹ'],
    study: ['học', 'thi', 'bài tập', 'điểm', 'kiểm tra']
  };
  
  Object.entries(keywords).forEach(([category, words]) => {
    const count = sampleMessages.filter(m => 
      words.some(w => m.message.toLowerCase().includes(w))
    ).length;
    
    if (count >= 2) {
      const labels = {
        stress: 'Nhiều em đề cập đến căng thẳng và áp lực',
        bullying: 'Có dấu hiệu bắt nạt hoặc trêu chọc',
        family: 'Vấn đề liên quan đến gia đình',
        study: 'Áp lực học tập cao'
      };
      
      concerns.push(labels[category]);
    }
  });
  
  return concerns.slice(0, 3); // Chỉ lấy top 3
}

// Helper function: Rule-based analysis (fallback)
function analyzeWithRules(percentages, sampleMessages, total, severityRating) {
  const negative = parseFloat(percentages.sad) + parseFloat(percentages.angry);
  const positive = parseFloat(percentages.happy);
  const tired = parseFloat(percentages.tired);
  
  // Trend summary
  let trendSummary = '';
  if (negative > 40) {
    trendSummary = `Có ${negative}% học sinh có cảm xúc tiêu cực (buồn/giận dữ). Cần chú ý đặc biệt đến các em này.`;
  } else if (tired > 30) {
    trendSummary = `${tired}% học sinh cảm thấy mệt mỏi. Có thể do lịch học quá tải hoặc thiếu ngủ.`;
  } else if (positive > 60) {
    trendSummary = `Lớp học có tâm trạng tích cực với ${positive}% học sinh vui vẻ. Đây là dấu hiệu tốt cho môi trường học tập.`;
  } else {
    trendSummary = `Tâm trạng lớp học ổn định với cảm xúc đa dạng. Cần duy trì và theo dõi tiếp tục.`;
  }
  
  // Suggestion
  let suggestion = '';
  if (negative > 40) {
    suggestion = '**Tổ chức hoạt động tâm lý nhóm**: Tạo không gian để học sinh chia sẻ cảm xúc. Gặp riêng các em có cảm xúc tiêu cực để lắng nghe và hỗ trợ.';
  } else if (tired > 30) {
    suggestion = '**Kiểm tra lịch học**: Xem xét lịch học và bài tập về nhà có quá tải không. Tổ chức 5-10 phút thư giãn đầu buổi học.';
  } else if (positive > 60) {
    suggestion = '**Duy trì không khí tích cực**: Tiếp tục khen ngợi và động viên các em. Tổ chức các hoạt động vui chơi để duy trì tinh thần.';
  } else {
    suggestion = '**Theo dõi và hỗ trợ**: Duy trì môi trường học tập tích cực. Quan tâm đến từng học sinh và tạo cơ hội để các em chia sẻ.';
  }
  
  // Top concerns
  const topConcerns = identifyTopConcerns(percentages, sampleMessages, total);
  
  // Positive aspects
  const positiveAspects = [];
  if (positive > 50) {
    positiveAspects.push(`${positive}% học sinh vui vẻ cho thấy môi trường học tập tích cực`);
  }
  if (parseFloat(percentages.neutral) > 30) {
    positiveAspects.push('Nhiều học sinh có cảm xúc ổn định');
  }
  if (total > 20) {
    positiveAspects.push('Học sinh tích cực tham gia chia sẻ cảm xúc');
  }
  
  return {
    trendSummary,
    suggestion,
    severityRating,
    topConcerns,
    positiveAspects: positiveAspects.length > 0 ? positiveAspects : ['Cần thêm dữ liệu để đánh giá'],
    method: 'rule-based'
  };
}

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
