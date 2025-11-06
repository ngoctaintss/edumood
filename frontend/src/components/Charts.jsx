import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

// Beautiful emotion colors with gradients
const EMOTION_COLORS = {
  happy: '#FCD34D',    // Yellow
  neutral: '#94A3B8',  // Gray
  sad: '#60A5FA',      // Blue
  angry: '#EF4444',    // Red
  tired: '#A78BFA'     // Purple
};

const EMOTION_LABELS = {
  happy: { vi: 'Vui vẻ', emoji: '😊' },
  neutral: { vi: 'Bình thường', emoji: '😐' },
  sad: { vi: 'Buồn', emoji: '😔' },
  angry: { vi: 'Giận dữ', emoji: '😡' },
  tired: { vi: 'Mệt mỏi', emoji: '😴' }
};

// Custom label for pie chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if less than 5%

  const emotionData = EMOTION_LABELS[name] || { vi: name, emoji: '❓' };

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold text-sm"
      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
    >
      {emotionData.emoji} {(percent * 100).toFixed(0)}%
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const emotionData = EMOTION_LABELS[data.name] || { vi: data.name, emoji: '❓' };
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4 rounded-xl border border-white/30"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{emotionData.emoji}</span>
          <p className="text-white font-semibold">{emotionData.vi}</p>
        </div>
        <p className="text-white/90 text-lg font-bold">{data.value} học sinh</p>
        <p className="text-white/70 text-sm">
          {((data.value / data.payload.total) * 100).toFixed(1)}% tổng số
        </p>
      </motion.div>
    );
  }
  return null;
};

// Custom Legend
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {payload.map((entry, index) => {
        const emotionData = EMOTION_LABELS[entry.value] || { vi: entry.value, emoji: '❓' };
        return (
          <motion.div
            key={`legend-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 glass-card px-4 py-2 rounded-lg"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white text-sm font-medium">
              {emotionData.emoji} {emotionData.vi}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

// Emotion Pie Chart - UPGRADED
export const EmotionPieChart = ({ data }) => {
  // Transform data
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  const chartData = Object.entries(data)
    .filter(([key, value]) => value > 0) // Only show emotions with data
    .map(([key, value]) => ({
      name: key,
      value: value,
      total: total,
      color: EMOTION_COLORS[key]
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/50">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p>Chưa có dữ liệu cảm xúc</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Emotion Bar Chart - UPGRADED
export const EmotionBarChart = ({ data }) => {
  const chartData = Object.entries(data).map(([key, value]) => {
    const emotionData = EMOTION_LABELS[key] || { vi: key, emoji: '❓' };
    return {
      emotion: `${emotionData.emoji} ${emotionData.vi}`,
      count: value,
      name: key,
      color: EMOTION_COLORS[key]
    };
  });

  const CustomBar = (props) => {
    const { fill, x, y, width, height } = props;
    return (
      <g>
        <defs>
          <linearGradient id={`gradient-${props.name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={1} />
            <stop offset="100%" stopColor={fill} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#gradient-${props.name})`}
          rx={8}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart 
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="emotion" 
          stroke="#fff"
          angle={-15}
          textAnchor="end"
          height={80}
          style={{ fontSize: '13px' }}
        />
        <YAxis 
          stroke="#fff"
          style={{ fontSize: '13px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px'
          }}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar 
          dataKey="count" 
          shape={<CustomBar />}
          animationDuration={1000}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// Weekly Trend Chart - UPGRADED
export const WeeklyTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/50">
        <div className="text-center">
          <div className="text-6xl mb-4">📈</div>
          <p>Chưa có dữ liệu xu hướng</p>
        </div>
      </div>
    );
  }

  // Transform data to Vietnamese labels
  const chartData = data.map(item => {
    const date = new Date(item.date);
    const dayLabel = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    return {
      ...item,
      dateLabel: dayLabel
    };
  });

  const emotions = ['happy', 'neutral', 'sad', 'angry', 'tired'];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart 
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="dateLabel" 
          stroke="#fff"
          angle={-15}
          textAnchor="end"
          height={80}
          style={{ fontSize: '13px' }}
        />
        <YAxis 
          stroke="#fff"
          style={{ fontSize: '13px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px'
          }}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            const emotionData = EMOTION_LABELS[value] || { vi: value, emoji: '❓' };
            return `${emotionData.emoji} ${emotionData.vi}`;
          }}
        />
        
        {emotions.map((emotion) => {
          const emotionData = EMOTION_LABELS[emotion];
          return (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              name={emotion}
              stroke={EMOTION_COLORS[emotion]}
              strokeWidth={3}
              dot={{ fill: EMOTION_COLORS[emotion], r: 5 }}
              activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Stats Card Component (Bonus)
export const EmotionStatsCard = ({ emotion, count, percentage, total }) => {
  const emotionData = EMOTION_LABELS[emotion] || { vi: emotion, emoji: '❓' };
  const color = EMOTION_COLORS[emotion];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card p-6 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-5xl">{emotionData.emoji}</span>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{count}</div>
          <div className="text-white/70 text-sm">học sinh</div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-white/90 text-sm mb-1">
          <span className="font-medium">{emotionData.vi}</span>
          <span className="font-bold">{percentage}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
      
      <div className="text-white/60 text-xs">
        {percentage}% của {total} lượt gửi
      </div>
    </motion.div>
  );
};

export default { EmotionPieChart, EmotionBarChart, WeeklyTrendChart, EmotionStatsCard };
