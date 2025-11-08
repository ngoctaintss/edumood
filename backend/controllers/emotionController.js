import Emotion from '../models/Emotion.js';
import Student from '../models/Student.js';

// Lazy load OpenAI only when needed
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

// @desc    Submit emotion
// @route   POST /api/emotions
// @access  Private (Student)
export const submitEmotion = async (req, res) => {
  try {
    const { emotion, message } = req.body;

    if (!emotion) {
      return res.status(400).json({ message: 'Vui lòng chọn cảm xúc' });
    }

    // Check if student has already submitted in the last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentSubmission = await Emotion.findOne({
      studentId: req.user._id,
      date: { $gte: twentyFourHoursAgo }
    }).sort({ date: -1 });

    if (recentSubmission) {
      const timeUntilNext = new Date(recentSubmission.date.getTime() + 24 * 60 * 60 * 1000);
      const hoursLeft = Math.ceil((timeUntilNext - now) / (1000 * 60 * 60));
      
      return res.status(429).json({ 
        message: `Bạn đã gửi cảm xúc trong 24 giờ qua. Vui lòng đợi ${hoursLeft} giờ nữa để gửi lại.`,
        canSubmitAt: timeUntilNext,
        hoursLeft: hoursLeft
      });
    }

    // Create emotion record
    const emotionRecord = await Emotion.create({
      studentId: req.user._id,
      emotion,
      message: message || '',
      date: new Date()
    });

    // Award points to student (e.g., 10 points per submission)
    await Student.findByIdAndUpdate(req.user._id, {
      $inc: { points: 10 }
    });

    const populatedEmotion = await Emotion.findById(emotionRecord._id)
      .populate('studentId', 'name studentId');

    res.status(201).json({
      emotion: populatedEmotion,
      message: 'Gửi cảm xúc thành công! Bạn nhận được 10 điểm! 🌟'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Get emotions for a class
// @route   GET /api/emotions/class/:classId
// @access  Private (Teacher)
export const getEmotionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    // Get all students in class
    const students = await Student.find({ classId }).select('_id');
    const studentIds = students.map(s => s._id);

    // Build query
    let query = { studentId: { $in: studentIds } };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const emotions = await Emotion.find(query)
      .populate('studentId', 'name studentId')
      .sort({ date: -1 });

    res.json(emotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if student submitted emotion today
// @route   GET /api/emotions/check/:studentId
// @access  Private (Teacher/Student)
export const checkTodaySubmission = async (req, res) => {
  try {
    const { studentId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const emotion = await Emotion.findOne({
      studentId,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({ submitted: !!emotion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's emotion history
// @route   GET /api/emotions/student/:studentId
// @access  Private (Student/Teacher)
export const getStudentEmotions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;

    const emotions = await Emotion.find({ studentId })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(emotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's emotion history for last 7 days
// @route   GET /api/emotions/student/:studentId/7days
// @access  Private (Student)
export const getStudentEmotions7Days = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Only allow students to access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const emotions = await Emotion.find({
      studentId,
      date: { $gte: sevenDaysAgo }
    })
      .sort({ date: -1 });

    res.json(emotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get AI encouragement based on emotion and message
// @route   POST /api/emotions/encouragement
// @access  Private (Student)
export const getEncouragement = async (req, res) => {
  try {
    const { emotion, message } = req.body;

    if (!emotion) {
      return res.status(400).json({ message: 'Vui lòng chọn cảm xúc' });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        encouragement: 'Tính năng lời động viên từ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Get OpenAI instance
    const openaiClient = await getOpenAI();
    if (!openaiClient) {
      return res.json({
        encouragement: 'Tính năng AI tạm thời không khả dụng. Vui lòng thử lại sau.'
      });
    }

    // Map emotion values to Vietnamese labels
    const emotionLabels = {
      happy: 'Vui vẻ 😊',
      neutral: 'Bình thường 😐',
      sad: 'Buồn 😔',
      angry: 'Giận dữ 😡',
      tired: 'Mệt mỏi 😴'
    };

    const emotionLabel = emotionLabels[emotion] || emotion;

    // Create prompt for OpenAI
    const prompt = `Bạn là một người bạn thân thiện và đồng cảm với học sinh tiểu học. Một học sinh đã chia sẻ cảm xúc của mình:

Cảm xúc: ${emotionLabel}
${message ? `Tin nhắn: "${message}"` : 'Học sinh không chia sẻ thêm gì.'}

Hãy đưa ra một lời động viên ngắn gọn, tích cực và phù hợp với lứa tuổi tiểu học (khoảng 2-3 câu). Lời động viên nên:
- Thể hiện sự đồng cảm và hiểu biết
- Mang tính tích cực và khích lệ
- Dễ hiểu, phù hợp với trẻ em
- Tránh những lời khuyên phức tạp hoặc quá dài

Hãy trả lời bằng tiếng Việt một cách tự nhiên và thân thiện.`;

    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Bạn là một người bạn thân thiện, đồng cảm và tích cực với học sinh tiểu học. Bạn luôn đưa ra những lời động viên ngắn gọn, dễ hiểu và phù hợp với lứa tuổi. Bạn luôn trả lời bằng tiếng Việt một cách tự nhiên."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const encouragement = completion.choices[0].message.content;

    res.json({
      encouragement: encouragement.trim()
    });

  } catch (error) {
    console.error('AI Encouragement Error:', error);
    
    // Fallback response if OpenAI fails
    res.status(200).json({
      encouragement: 'Xin lỗi, tôi không thể tạo lời động viên lúc này. Nhưng hãy nhớ rằng mỗi ngày đều là cơ hội mới để cảm thấy tốt hơn! 🌟'
    });
  }
};
