import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const RewardCard = ({ reward, onRedeem, userPoints, disabled = false }) => {
  const canAfford = userPoints >= reward.cost;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className={`glass-card p-4 flex flex-col items-center gap-3 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="w-full h-32 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-6xl">
        {reward.imageUrl ? (
          <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          '🎁'
        )}
      </div>

      <h3 className="text-white font-semibold text-center">{reward.name}</h3>
      
      {reward.description && (
        <p className="text-white/70 text-sm text-center">{reward.description}</p>
      )}

      <div className="flex items-center gap-1 text-yellow-400">
        <Star className="w-5 h-5 fill-current" />
        <span className="font-bold text-lg">{reward.cost}</span>
      </div>

      <button
        onClick={() => onRedeem(reward)}
        disabled={!canAfford || disabled}
        className={`
          w-full py-2 rounded-lg font-semibold transition-all
          ${canAfford && !disabled
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            : 'bg-gray-500 cursor-not-allowed text-white/50'
          }
        `}
      >
        {canAfford ? 'Redeem' : 'Not Enough Points'}
      </button>
    </motion.div>
  );
};

export default RewardCard;
