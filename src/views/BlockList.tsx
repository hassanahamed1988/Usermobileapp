import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { ChevronLeft, Search, UserX, Ban } from 'lucide-react';
import InputField from '../components/InputField';


const BlockList: React.FC = () => {
  const { language, setView, users } = useStore();
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');

  const blockedUsers = (users || []).filter(u => u.status === 'BLOCKED');
  const filteredUsers = blockedUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'tween', duration: 0,
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div 
      
      
      
      className="h-full flex flex-col"
    >
      <div  className="mb-6">
        <InputField
          label="Search blocked users..."
          name="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} />}
          className="h-14"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                
                className="bg-white dark:bg-white/5 p-4 rounded-[8px] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <UserX size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main">{user.name}</h3>
                    <p className="text-xs text-text-muted">{user.email}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">ID: {user.id}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-[8px] bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  BLOCKED
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div  className="h-full flex flex-col items-center justify-center text-text-muted opacity-60">
            <Ban size={64} className="mb-4" />
            <p className="text-lg font-medium">No blocked users found</p>
            {searchTerm && <p className="text-sm mt-2">Try a different search term</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockList;
