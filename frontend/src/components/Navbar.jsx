import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card mx-4 my-4 p-4 flex justify-between items-center"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">{user.name}</h2>
          <p className="text-white/60 text-sm capitalize">{user.role}</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-white/20 rounded-lg transition-all"
      >
        <LogOut className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Logout</span>
      </button>
    </motion.nav>
  );
};

export default Navbar;
