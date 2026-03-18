import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import EditorLayout from './components/Editor/EditorLayout';

function App() {
  const [view, setView] = useState('landing'); // landing, selection, login, editor
  const [userData, setUserData] = useState({ lotNo: '', lotName: '', collegeName: '', category: '' });
  const [category, setCategory] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Auto-login check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem('qmaze_user_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.lotNo) {
            const res = await fetch(`${API_URL}/api/me/${parsed.lotNo}`);
            const data = await res.json();

            if (data.success && data.user) {
              setUserData({
                lotNo: data.user.lot_number,
                lotName: data.user.lot_name,
                collegeName: data.user.college_name || '',
                dbStartTime: data.user.start_time,
                dbPatternsCompleted: data.user.patterns_completed,
                dbStatus: data.user.status,
                dbCodeData: data.user.code_data,
                category: data.user.category
              });
            }
          }
        }
      } catch (err) {
        console.error('Error verifying session data', err);
      }
    };
    checkSession();
  }, [API_URL]);

  const handleStart = () => {
    setView('selection');
  };

  const handleSectorSelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setView('login');
  };

  const handleLogin = async (lotNo, lotName, collegeName, department, year) => {
    try {
      const initRes = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotNumber: lotNo, lotName, collegeName: collegeName || '', category, department: department || '', year: year || '' })
      });
      const initData = await initRes.json();

      if (initData.success && initData.user) {
        setUserData({
          lotNo: initData.user.lot_number,
          lotName: initData.user.lot_name,
          collegeName: initData.user.college_name || '',
          dbStartTime: initData.user.start_time,
          dbPatternsCompleted: initData.user.patterns_completed,
          dbStatus: initData.user.status,
          dbCodeData: initData.user.code_data,
          category: initData.user.category,
          department: initData.user.department || department || '',
          year: initData.user.year || year || '',
        });
        setView('editor');
      } else {
        setUserData({ lotNo, lotName, collegeName, department, year });
        setView('editor');
      }
    } catch (err) {
      console.error("Login sync failed", err);
      setUserData({ lotNo, lotName, collegeName, department, year });
      setView('editor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qmaze_user_session');
    setUserData({ lotNo: '', lotName: '', collegeName: '' });
    setCategory('');
    setView('landing');
  };

  return (
    <div className="app-container">
      {view === 'landing' && <LandingPage onStart={handleStart} />}
      {view === 'selection' && (
        <LandingPage 
            onStart={handleSectorSelect} 
            forceSelection={true} 
            onBack={() => setView('landing')} 
        />
      )}
      {view === 'login' && (
        <LoginModal 
          onLogin={handleLogin} 
          onBack={() => setView('selection')} 
          category={category} 
        />
      )}
      {view === 'editor' && (
        <EditorLayout userData={userData} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
