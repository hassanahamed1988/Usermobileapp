
import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { Lock, ArrowLeft, User as UserIcon, ShieldCheck, Users, ChevronDown } from 'lucide-react';

import InputField from '../components/InputField';
import GlobalFullscreenSelect from '../components/GlobalFullscreenSelect';
import { User } from '../types';

const UserPasswordReset: React.FC = () => {
  const { language, users, updateUser, user: currentUser, showFeedback, confirmAction, setView, currentThemeObj } = useStore();
  const t = TRANSLATIONS[language];
  const primaryColor = currentThemeObj?.primary || '#10b981';

  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const handleReset = async () => {
    if (!selectedTargetUser) {
      showFeedback('Please select a user first');
      return;
    }
    if (!adminPassword || !newPassword || !confirmPassword) {
      showFeedback('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showFeedback('New passwords do not match');
      return;
    }

    const bcrypt = await import('bcryptjs');
    const storedAdminPassword = (currentUser?.password || '').toString();
    const isHashed = storedAdminPassword.startsWith('$2a$') || storedAdminPassword.startsWith('$2b$') || storedAdminPassword.startsWith('$2y$');
    
    let isPasswordCorrect = false;
    if (isHashed) {
      isPasswordCorrect = await bcrypt.compare(adminPassword.trim(), storedAdminPassword);
    } else {
      isPasswordCorrect = storedAdminPassword === adminPassword || storedAdminPassword.trim() === adminPassword.trim();
    }

    if (!isPasswordCorrect) {
      showFeedback('Admin password incorrect');
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update in Firebase Auth
      try {
        const response = await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: selectedTargetUser.email,
            password: newPassword
          })
        });
        if (!response.ok) {
          const errData = await response.json();
          console.warn("Failed to sync password to Firebase Auth:", errData);
        }
      } catch (authErr) {
        console.warn("Failed to contact Firebase Auth sync endpoint:", authErr);
      }

      const { saveFirebaseDocMerge } = await import('@/services/firebase');
      const coll = selectedTargetUser.role === 'ADMIN' ? 'admins' : 'users';
      await saveFirebaseDocMerge(coll, selectedTargetUser.id, { password: hashedPassword });

      const updatedUser = { ...selectedTargetUser, password: hashedPassword };
      updateUser(updatedUser);
      showFeedback(`Password for ${selectedTargetUser.name} reset successfully`);
      
      // Reset form
      setSelectedTargetUser(null);
      setAdminPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to update password:', err);
      showFeedback('Failed to reset user password in database');
    }
  };

  const userOptions = users
    .filter(u => u.id !== currentUser?.id)
    .map(u => ({
      label: u.name,
      value: u.id,
      subLabel: `ID: ${u.id}`
    }));

  return (
    <div className="w-full max-w-md mx-auto pb-20">
      <div className="space-y-4">
        {/* User Selection */}
        <div className="p-4 bg-theme-card rounded-xl shadow-sm border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} style={{ color: primaryColor }} />
            <h2 className="text-sm font-black text-text-main uppercase">Select User</h2>
          </div>
          
          <button 
            onClick={() => setIsSelectOpen(true)}
            className="w-full h-14 px-4 rounded-lg border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 transition-all font-bold text-sm text-text-main flex items-center justify-between"
            style={{ backgroundColor: 'transparent', '--tw-ring-color': `${primaryColor}80` } as any}
          >
            <span className={selectedTargetUser ? 'text-text-main' : 'text-text-muted'}>
              {selectedTargetUser ? selectedTargetUser.name : 'Select a user...'}
            </span>
            <ChevronDown size={18} className="text-text-muted" />
          </button>

          <GlobalFullscreenSelect 
            isOpen={isSelectOpen}
            onClose={() => setIsSelectOpen(false)}
            title="Select User"
            options={userOptions}
            selectedValue={selectedTargetUser?.id}
            onSelect={(val) => {
              const target = users.find(u => u.id === val);
              if (target) {
                confirmAction(
                  `Do you want to reset the password for ${target.name}?`,
                  () => setSelectedTargetUser(target)
                );
              }
            }}
          />
        </div>

        {selectedTargetUser && (
          <div 
            
            
            className="p-4 bg-theme-card rounded-xl shadow-sm border border-white/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">User Name</span>
                <span className="text-sm font-black text-text-main" style={{ color: primaryColor }}>{selectedTargetUser.name}</span>
              </div>
              <div className="h-[1px] bg-black/5 dark:bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">User ID</span>
                <span className="text-sm font-black text-text-main">{selectedTargetUser.id}</span>
              </div>
            </div>
          </div>
        )}

        {selectedTargetUser && (
          <div 
            
            
            className="p-4 bg-theme-card rounded-xl shadow-sm border border-white/10 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} style={{ color: primaryColor }} />
              <h2 className="text-sm font-black text-text-main uppercase">Reset Password</h2>
            </div>

            <InputField 
              label="Admin Password (Your Password)" 
              type="password" 
              value={adminPassword} 
              onChange={(e) => setAdminPassword(e.target.value)} 
            />
            
            <div className="grid grid-cols-1 gap-3">
              <InputField 
                label="New Password for User" 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <InputField 
                label="Confirm New Password" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>

            <button
              
              onClick={handleReset}
              className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-primary/20 mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              Reset User Password
            </button>

            <button 
              onClick={() => setSelectedTargetUser(null)}
              className="w-full py-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
            >
              Cancel Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPasswordReset;
