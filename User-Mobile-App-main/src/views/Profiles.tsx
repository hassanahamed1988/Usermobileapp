import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { TRANSLATIONS } from '@/constants';
import { Phone, Calendar, Hash, Globe, User, ChevronLeft, Plus, Download } from 'lucide-react';
import { Profile } from '@/types';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import FloatingInput from '@/components/FloatingInput';
import FormWindow from '@/components/FormWindow';
import { createPortal } from 'react-dom';

const Profiles: React.FC = () => {
  const { language, profiles, addProfile, nationalities, showFeedback, activeDetailView, setActiveDetailView, goBack, wallpaper, backgroundColor, theme, appThemeMode, isDarkMode: storeIsDarkMode } = useStore();
  const t = TRANSLATIONS[language];
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || appThemeMode === 'dark';
  const selectedProfileId = typeof activeDetailView === 'string' && activeDetailView !== 'NEW' ? activeDetailView : null;
  const isAdding = activeDetailView === 'NEW';
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;
  const [showNationalitySelect, setShowNationalitySelect] = useState(false);

  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    idNumber: '',
    mobile: '',
    nationality: '',
    joiningDate: new Date().toISOString().split('T')[0],
    type: 'EMPLOYEE'
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: Profile = {
      ...formData as Profile,
      id: Math.random().toString(36).substr(2, 9),
    };
    addProfile(newProfile);
    goBack();
  };

  const renderForm = () => (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className={`space-y-6 flex-1 ${isDesktop ? 'p-0' : 'p-6'}`}>
        <FloatingInput label="NAME" value={formData.name || ''} onChange={v => setFormData({...formData, name: v.toUpperCase()})} />
        <FloatingInput label={t.ID_NUMBER} value={formData.idNumber || ''} onChange={v => setFormData({...formData, idNumber: v.toUpperCase()})} />
        <FloatingInput label={t.MOBILE} value={formData.mobile || ''} onChange={v => setFormData({...formData, mobile: v.toUpperCase()})} />
        
        <div onClick={() => setShowNationalitySelect(true)}>
          <FloatingInput label={t.NATIONALITY} value={formData.nationality || ''} onChange={() => {}} />
        </div>

        <div className={isDesktop ? "mt-8" : "fixed bottom-[calc(85px+env(safe-area-inset-bottom))] left-0 right-0 px-6 z-50"}>
          <button type="submit" className="w-full h-14 flex items-center justify-center bg-cyan-500 text-white font-black rounded-[8px] shadow-lg active:scale-95 transition-all uppercase">
            {t.SAVE}
          </button>
        </div>
        
        {!isDesktop && <div className="h-32" />}
      </form>

      <GlobalFullscreenSelect 
        isOpen={showNationalitySelect}
        onClose={() => setShowNationalitySelect(false)}
        title={t.NATIONALITY}
        options={nationalities.map(n => n.name)}
        onSelect={v => setFormData({...formData, nationality: v})}
      />
    </div>
  );

  return (
    <div className="pb-[60px]">
      <div className="flex gap-4 mb-6">
        <button 
          className="flex-1 py-3 bg-white rounded-[8px] font-bold text-xs uppercase shadow-sm border border-app-border text-cyan-500 border-b-4 border-b-cyan-500"
        >
          EMPLOYEES
        </button>
        <button 
          className="flex-1 py-3 bg-white rounded-[8px] font-bold text-xs uppercase shadow-sm border border-app-border text-text-muted"
        >
          COMPANIES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {profiles.map((profile) => (
        <div 
          key={profile.id}
          onClick={() => {
            setActiveDetailView(profile.id);
          }}
          className="bg-white h-20 px-4 rounded-[8px] flex items-center gap-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
        >
          <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-[8px] flex items-center justify-center text-cyan-500 text-2xl">
            {nationalities.find(n => n.name === profile.nationality)?.flag || <User />}
          </div>
          <div className="flex-1">
            <p className="font-black dark:text-white uppercase leading-none mb-1">{profile.name}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">{profile.idNumber}</p>
          </div>
        </div>
      ))}
      </div>

      {profiles.length === 0 && !isAdding && (
        <div className="text-center py-20 text-gray-400 uppercase font-bold text-xs">NO PROFILES FOUND</div>
      )}

      {/* Profile Detail Window */}
      {activeDetailView && selectedProfile && (
        <div className="fixed top-16 right-0 bottom-32 lg:bottom-0 z-[60] bg-app-bg flex flex-col px-6 py-8 uppercase overflow-y-auto w-full lg:w-[450px] lg:border-l border-app-border shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => goBack()}
              className="p-2 rounded-full transition-colors text-text-main"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => showFeedback('Download started')}
                className="p-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-full hover:bg-cyan-100 transition-colors"
                title="Download Information"
              >
                <Download size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-cyan-500 rounded-[8px] flex items-center justify-center text-white text-5xl mb-4 shadow-xl">
              {nationalities.find(n => n.name === selectedProfile.nationality)?.flag || <User size={40} />}
            </div>
            <h3 className="text-xl font-black dark:text-white mb-1 uppercase">{selectedProfile.name}</h3>
            <span className="px-4 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-[8px] text-[10px] font-bold">
              {selectedProfile.type}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DetailItem icon={<Hash />} label={t.ID_NUMBER} value={selectedProfile.idNumber} />
            <DetailItem icon={<Phone />} label={t.MOBILE} value={selectedProfile.mobile} />
            <DetailItem icon={<Globe />} label={t.NATIONALITY} value={selectedProfile.nationality} />
            <DetailItem icon={<Calendar />} label={t.JOIN_DATE} value={selectedProfile.joiningDate} />
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {isDesktop ? (
        isAdding && (
          <FormWindow title="Add Profile" onClose={() => goBack()}>
            {renderForm()}
          </FormWindow>
        )
      ) : (
        createPortal(
          isAdding && (
            <div 
              className="fixed inset-0 z-[9000] flex flex-col overflow-hidden"
              style={{ background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)') }}
            >
              <div className="flex flex-col h-full overflow-hidden">
                <div 
                  className="h-16 flex items-center px-4 shrink-0 shadow-sm border-b border-black/5 dark:border-white/10"
                  style={{ 
                    background: 'var(--header-bg)',
                    color: '#ffffff'
                  }}
                >
                  <button 
                    onClick={() => goBack()} 
                    className="p-2 rounded-full transition-colors mr-2 text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h3 className="text-sm font-black uppercase tracking-widest">Add Profile</h3>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderForm()}
                </div>
              </div>
            </div>
          ),
          document.body
        )
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value }: any) => (
  <div className="bg-white p-3 rounded-[8px] flex items-center gap-4 border border-gray-100 dark:border-gray-700 shadow-sm">
    <div className="text-cyan-500">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <p className="font-bold dark:text-white uppercase">{value}</p>
    </div>
  </div>
);

export default Profiles;
