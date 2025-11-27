import Setting from '../models/Setting.js';

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Private (Admin)
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    let setting = await Setting.findOne({ key });
    
    // If setting doesn't exist, create default
    if (!setting) {
      const defaults = {
        'emotion_submission_limit_enabled': true,
        'emotion_submission_limit_hours': 24
      };
      
      if (defaults[key] !== undefined) {
        setting = await Setting.create({
          key,
          value: defaults[key],
          description: key === 'emotion_submission_limit_enabled' 
            ? 'Bật/tắt giới hạn thời gian gửi cảm xúc (24h)'
            : 'Số giờ giới hạn giữa các lần gửi cảm xúc'
        });
      } else {
        return res.status(404).json({ message: 'Setting not found' });
      }
    }
    
    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin)
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update setting
// @route   PUT /api/settings/:key
// @access  Private (Admin)
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );
    
    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

