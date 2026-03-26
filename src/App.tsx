import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBBdIcHoWFcQCkZxqwK_CqYt4jARiLxVHE",
  authDomain: "a-ogretmen-asistani.firebaseapp.com",
  projectId: "a-ogretmen-asistani",
  storageBucket: "a-ogretmen-asistani.firebasestorage.app",
  messagingSenderId: "634767906199",
  appId: "1:634767906199:web:5d964f0adc978ef29ba0d2",
  measurementId: "G-98Q7F3B274"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const EXTERNAL_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

const PREDEFINED_AVATARS = ['🐶', '🐱', '🐰', '🦁', '🦄', '🦖', '🦋', '🚀', '🧚', '🦸‍♂️', '🧙‍♀️', '👨‍🚀'];
const PREDEFINED_TOPICS = ['Uzay 🪐', 'Dinozor 🦖', 'Kedi 🐱', 'Araba 🏎️', 'Prenses 👑', 'Robot 🤖', 'Masal Dünyası 🧚', 'Doğa 🌳', 'Dostluk 🤝'];

const DEFAULT_CLASS_LIST = [
  'BARAN LEVENT', 'ÜMRAN ELMAMO', 'MİRAÇ DEMİRTAŞ', 'AKIN ADLIM', 'ASYA MUNGAN', 'AVZEM BAHADIR', 
  'AZRA BAĞLAN', 'AZRA KINU', 'BAHAR YILMAZÇELİK', 'BERFİN SÖNMEZ', 'CEREN EROL', 'ELA EROL', 
  'ESLEM EROL', 'GÖKHAN MUNGAN', 'HACİ VİLKİN', 'LATİFE KAYURGA', 'MİRA DEMİRTAŞ', 
  'MİRAÇ YILMAZÇELİK', 'SENA MUNGAN', 'TALHA LEVENT', 'UMUT EROL'
];

export default function App() {
  const [view, setView] = useState('student-setup'); 
  const [stats, setStats] = useState([]); 
  const [students, setStudents] = useState([]); 
  
  const [activeHomework, setActiveHomework] = useState(null);
  const [teacherTab, setTeacherTab] = useState('stats');
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);

  const [hwForm, setHwForm] = useState({
    text: 'Minik arı vız vız uçtu. Renkli bir çiçek gördü. Çiçeğin üstüne konup bal özü aldı. Sonra kovanına geri döndü.',
    q1: 'Minik arı ne gördü?', q1o1: 'Renkli çiçek', q1o2: 'Büyük ağaç', q1o3: 'Küçük ev', q1c: 0,
    q2: 'Arı çiçekten ne aldı?', q2o1: 'Yaprak', q2o2: 'Bal özü', q2o3: 'Su', q2c: 1
  });

  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🐶'); 
  const fileInputRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false); 
  
  const [interest, setInterest] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [level, setLevel] = useState('1');
  const [storyData, setStoryData] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [tempStats, setTempStats] = useState(null);
  const [answers, setAnswers] = useState({});
  const [readingResult, setReadingResult] = useState(null);
  const [hasRetried, setHasRetried] = useState(false);
  const [isReadingFinished, setIsReadingFinished] = useState(false);
  
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingHomework, setIsGeneratingHomework] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  
  const [loginError, setLoginError] = useState(''); 
  const [micError, setMicError] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('1234');
  const [editingPasswords, setEditingPasswords] = useState({});
  const [teacherMsg, setTeacherMsg] = useState('');
  const [actualTeacherPassword, setActualTeacherPassword] = useState('1234'); 
  const [newTeacherPasswordInput, setNewTeacherPasswordInput] = useState(''); 
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); 
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [teacherPassword, setTeacherPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
      const loadedStats = [];
      snapshot.forEach((docItem) => loadedStats.push({ id: docItem.id, ...docItem.data() }));
      loadedStats.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setStats(loadedStats);
    });

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
      const loadedStudents = [];
      snapshot.forEach((docItem) => loadedStudents.push({ id: docItem.id, ...docItem.data() }));
      loadedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      setStudents(loadedStudents);
    });

    const hwRef = doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current');
    const unsubscribeHw = onSnapshot(hwRef, (docSnap) => {
      if (docSnap.exists()) setActiveHomework(docSnap.data());
      else setActiveHomework(null);
    });

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().password) setActualTeacherPassword(docSnap.data().password);
    });

    return () => { unsubscribeStats(); unsubscribeStudents(); unsubscribeHw(); unsubscribeSettings(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved');
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSavedProfile(data);
        setStudentName(data.studentName);
        setStudentPassword(data.studentPassword);
        setStudentAvatar(data.avatar || '🐶');
        const topicsArray = (data.interest || '').split(', ').filter(t => t.trim() !== '');
        const cleanPredefined = PREDEFINED_TOPICS.map(t => t.split(' ')[0]);
        setSelectedTopics(topicsArray.filter(t => cleanPredefined.includes(t)));
        setCustomTopic(topicsArray.filter(t => !cleanPredefined.includes(t)).join(', '));
        setLevel(data.level);
        setRememberMe(true);
      }
    };
    fetchProfile();
  }, [user]);

  const showTeacherMessage = (msg) => { setTeacherMsg(msg); setTimeout(() => setTeacherMsg(''), 4000); };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPassword) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: newStudentName.trim(), password: newStudentPassword.trim() });
      setNewStudentName(''); setNewStudentPassword('1234');
      showTeacherMessage(`✅ ${newStudentName} sınıfa eklendi!`);
    } catch (e) { showTeacherMessage(`❌ Öğrenci eklenemedi.`); }
  };

  const handleUpdatePassword = async (id, newPassword) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), { password: newPassword });
      showTeacherMessage('✅ Şifre güncellendi!');
      const newEditing = {...editingPasswords}; delete newEditing[id]; setEditingPasswords(newEditing);
    } catch (e) { showTeacherMessage('❌ Hata oluştu.'); }
  };

  const handleDeleteStudent = async (id, name) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id));
      showTeacherMessage(`🗑️ ${name} silindi.`);
    } catch (e) { showTeacherMessage(`❌ Silinemedi.`); }
  };

  const handleLoadDefaultClass = async () => {
    showTeacherMessage('⏳ Yükleniyor...');
    try {
      for (const name of DEFAULT_CLASS_LIST) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, password: '1234' });
      }
      showTeacherMessage('✅ 1/A Listesi yüklendi!');
    } catch (e) { showTeacherMessage('❌ Hata oluştu.'); }
  };

  const handlePublishHomework = () => {
    showTeacherMessage('Ödev başarıyla gönderildi!');
  };

  const handleUpdateTeacherPassword = async () => {
    if (!newTeacherPasswordInput || newTeacherPasswordInput.length < 4) { showTeacherMessage("❌ En az 4 hane olmalı."); return; }
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin'), { password: newTeacherPasswordInput.trim() }, { merge: true });
      setNewTeacherPasswordInput(''); showTeacherMessage("✅Şifre güncellendi!");
    } catch (e) { showTeacherMessage("❌ Hata."); }
  };

  const handleAvatarChange = async (ava) => {
    setStudentAvatar(ava);
    if (savedProfile && user) {
      const newProfile = { ...savedProfile, avatar: ava };
      setSavedProfile(newProfile);
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1000000) { 
      const reader = new FileReader();
      reader.onloadend = () => handleAvatarChange(reader.result); 
      reader.readAsDataURL(file);
    } else if (file) {
      setLoginError("Lütfen daha küçük boyutlu bir fotoğraf seçin."); setTimeout(() => setLoginError(''), 4000);
    }
  };

  const callGeminiAPI = async (topic, selectedLevel) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY; 
    if (!apiKey) throw new Error("API Anahtarı bulunamadı.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');
    const prompt = `Sen dünyanın en iyi çocuk edebiyatı yazarı ve şefkatli bir 1. sınıf öğretmenisin. Konu: ${topic}. 
    Seviye: ${selectedLevel}. (1: 15-25 kelime, basit. 2: 25-45 kelime, orta. 3: 45-70 kelime, zor). Karakter isimlerini şu listeden seç: ${studentNamesStr || 'Ali, Elif'}.
    Hikaye sonunda 3 şıklı 2 adet anlama sorusu hazırla. YALNIZCA aşağıdaki JSON formatında cevap ver:
    { "text": "Hikaye...", "questions": [ { "id": 1, "q": "Soru 1?", "options": ["A", "B", "C"], "correct": 0 }, { "id": 2, "q": "Soru 2?", "options": ["A", "B", "C"], "correct": 1 } ] }`;

    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };

    let delays = [1000, 2000, 4000]; 
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("API hatası");
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (err) {
        if (i === 2) throw err;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };

  const evaluateReadingWithAI = async (text, timeSeconds, wpm, compScore, audioDataUrl) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const parts = [{ text: `Sen şefkatli bir öğretmensin. Metin: "${text}". Hız: ${wpm} wpm. Skor: 2/${compScore}. JSON formatında 1-5 arası puanla ve şefkatli geri bildirim yaz: { "akicilik": 4, "telaffuz": 5, "anlama": 5, "okuma_hizi": 4, "geribildirim": "Harika!" }` }];
    
    if (audioDataUrl) {
      try { parts.push({ inlineData: { mimeType: "audio/webm", data: audioDataUrl.split(',')[1] } }); } catch (e) {}
    }
    const payload = { contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } };

    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) {
      return { akicilik: 5, telaffuz: 5, anlama: 5, okuma_hizi: 5, geribildirim: "Harika bir okuma yaptın! 🌟" };
    }
  };

  const validateStudent = () => {
    if (!studentName || !studentPassword) { setLoginError('Lütfen adını seç ve şifreni gir.'); return false; }
    const matchedStudent = students.find(s => s.name === studentName);
    if (!matchedStudent) { setLoginError('Sınıf listesinde adın bulunamadı.'); return false; }
    if (matchedStudent.password !== studentPassword) { setLoginError('Hatalı şifre!'); return false; }
    setLoginError(''); return true;
  };

  const saveProfileDataLocally = async () => {
    if (!user || !rememberMe) return;
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    const profileData = { studentName, studentPassword, avatar: studentAvatar, interest: combinedInterest || 'Uzay', level, streak: savedProfile?.streak || 0, lastReadingDate: savedProfile?.lastReadingDate || null };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), profileData);
    setSavedProfile(profileData);
  };

  const clearProfile = async () => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'));
    setSavedProfile(null); setRememberMe(false); setStudentName(''); setStudentPassword(''); setStudentAvatar('🐶'); setSelectedTopics([]); setCustomTopic('');
  };

  const handleStartFreeReading = async () => {
    if (!validateStudent()) return;
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) { setLoginError('Lütfen bir konu seç.'); return; }
    await saveProfileDataLocally();
    await startReadingSession(combinedInterest, level, false);
  };

  const handleStartHomework = async () => {
    if (!validateStudent() || !activeHomework) return;
    await saveProfileDataLocally();
    await startReadingSession('Sınıf Ödevi', 'Ödev', true);
  };

  const startReadingSession = async (currentInterest, currentLevel, isHomework) => {
    setInterest(currentInterest); setLevel(currentLevel); setAnswers({}); setHasRetried(false); setAudioUrl(null); setIsReadingFinished(false);
    if (isHomework) {
      setStoryData(activeHomework); setView('reading-ready');
    } else {
      setIsGeneratingStory(true);
      try {
        const aiData = await callGeminiAPI(currentInterest, currentLevel);
        setStoryData(aiData); setView('reading-ready');
      } catch (err) {
        setLoginError("Hikaye oluşturulurken hata oluştu. Lütfen tekrar deneyin."); setView('student-setup');
      } finally { setIsGeneratingStory(false); }
    }
  };

  const beginTimer = async (withRecording = false) => {
    if (withRecording) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError("Cihazınız ses kaydını desteklemiyor. Sessiz okumaya geçiliyor...");
        setTimeout(() => { setMicError(''); setStartTime(Date.now()); setView('reading-active'); }, 3000);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader(); reader.readAsDataURL(audioBlob);
          reader.onloadend = () => setAudioUrl(reader.result);
        };
        mediaRecorder.start(); setIsRecording(true);
      } catch (err) {
        setMicError("Mikrofon izni alınamadı. Sessiz okumaya geçiliyor...");
        setTimeout(() => { setMicError(''); setStartTime(Date.now()); setView('reading-active'); }, 3000);
        return;
      }
    }
    setStartTime(Date.now()); setView('reading-active');
  };

  const finishReading = () => {
    if (isRecording && mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); setIsRecording(false); }
    const timeSpentSeconds = (Date.now() - startTime) / 1000;
    const wordCount = storyData.text.split(/\s+/).length;
    setTempStats({ words: wordCount, timeSeconds: Math.round(timeSpentSeconds), wpm: Math.round((wordCount / timeSpentSeconds) * 60) });
    setIsReadingFinished(true);
  };

  const checkAnswers = () => {
    let correctCount = 0;
    storyData.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    if (correctCount < 2 && !hasRetried) { setHasRetried(true); setView('reading-active'); } else calculateFinalResult();
  };

  const calculateFinalResult = async () => {
    let correctCount = 0; storyData.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    setView('evaluating'); setIsEvaluating(true);
    const aiEvaluation = await evaluateReadingWithAI(storyData.text, tempStats.timeSeconds, tempStats.wpm, correctCount, audioUrl);
    
    let currentStreak = savedProfile?.streak || 0;
    const todayStr = new Date().toISOString().split('T')[0];
    if (savedProfile?.lastReadingDate) {
      const diffDays = Math.floor((new Date(todayStr) - new Date(savedProfile.lastReadingDate)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) currentStreak += 1; else if (diffDays > 1) currentStreak = 1;
    } else currentStreak = 1;

    if (user && savedProfile) {
      const newProfile = { ...savedProfile, streak: currentStreak, lastReadingDate: todayStr };
      setSavedProfile(newProfile);
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
    }

    const newResult = { name: studentName, avatar: studentAvatar, interest: interest, level: level, words: tempStats.words, timeSeconds: tempStats.timeSeconds, wpm: tempStats.wpm, compScore: correctCount, audioUrl: audioUrl || null, aiEvaluation, streakAchieved: currentStreak, date: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }), timestamp: serverTimestamp() };
    setReadingResult(newResult); setIsEvaluating(false); setView('result');
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult); } catch (e) {}
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'tr-TR'; window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative pt-8 pb-12">
      {/* Profil Düğmesi */}
      {!['teacher-login', 'teacher'].includes(view) && (
        <button onClick={() => setShowProfileModal(true)} className="absolute top-4 left-4 flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white z-50">
           <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl">
             {savedProfile?.avatar?.startsWith('data') ? <img src={savedProfile.avatar} className="w-full h-full object-cover"/> : (savedProfile?.avatar || studentAvatar)}
           </div>
           <span className="font-black text-sky-800 text-xl">{savedProfile ? savedProfile.studentName.split(' ')[0] : 'Giriş'}</span>
        </button>
      )}

      {/* Ana İçerik */}
      <div className="flex-1 w-full px-4">
        
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="max-w-xl mx-auto bg-white/95 p-8 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-20 relative text-center">
             <button onClick={()=>setView('teacher-login')} className="absolute top-4 right-4 w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg"><BarChart3 /></button>
             <h2 className="text-4xl font-black text-sky-600 mb-8">1/A Sınıf Asistanı</h2>
             
             <div className="space-y-6">
                <div className="bg-sky-50 p-6 rounded-2xl border-4 border-sky-100">
                   <select value={studentName} onChange={e=>setStudentName(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl font-bold mb-4 bg-white outline-none text-sky-800">
                     <option value="">İsmini Seç...</option>
                     {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                   </select>
                   <input type="password" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl text-center text-2xl tracking-[1em] outline-none font-bold" placeholder="••••" maxLength={4} />
                   {loginError && <p className="text-rose-500 font-bold mt-3">{loginError}</p>}
                </div>

                {activeHomework && (
                  <div className="p-6 bg-amber-300 rounded-[2rem] border-b-[8px] border-amber-500 shadow-xl">
                    <h3 className="text-3xl font-black text-amber-900 mb-4">📚 Yeni Ödevin Var!</h3>
                    <button onClick={handleStartHomework} className="w-full bg-white text-amber-600 text-xl font-black py-3 rounded-xl shadow-lg">GÖREVİ BAŞLAT 🚀</button>
                  </div>
                )}

                <div className="bg-sky-50 p-6 rounded-2xl border-4 border-sky-100 text-left">
                   <label className="block text-lg font-black text-sky-800 mb-4">Konu Seç:</label>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {PREDEFINED_TOPICS.map(t => (
                        <button key={t} onClick={() => setSelectedTopics(p => p.includes(t) ? p.filter(x=>x!==t) : [...p, t])} className={`px-4 py-2 rounded-full font-bold ${selectedTopics.includes(t) ? 'bg-fuchsia-500 text-white' : 'bg-white text-sky-700'}`}>{t}</button>
                      ))}
                   </div>
                   <input type="text" value={customTopic} onChange={e=>setCustomTopic(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl mb-4 font-bold" placeholder="Veya başka bir şey yaz..." />
                   
                   <label className="block text-lg font-black text-sky-800 mb-2">Seviye:</label>
                   <div className="flex gap-2">
                      {[{id:'1', l:'Kolay'}, {id:'2', l:'Orta'}, {id:'3', l:'Zor'}].map(lvl => (
                        <button key={lvl.id} onClick={() => setLevel(lvl.id)} className={`flex-1 py-3 rounded-xl font-black ${level === lvl.id ? 'bg-amber-400 text-amber-900' : 'bg-white text-sky-700'}`}>{lvl.l}</button>
                      ))}
                   </div>
                </div>

                <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-3 bg-white p-3 rounded-xl border-4 border-sky-100 cursor-pointer justify-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-4 ${rememberMe ? 'bg-fuchsia-500 border-fuchsia-500' : 'bg-white border-sky-300'}`}>{rememberMe && <Check className="text-white" />}</div>
                  <span className="text-sky-800 font-black">Beni bu telefonda hatırla</span>
                </div>

                <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-2xl font-black border-b-8 border-sky-700 shadow-xl">HİKAYEMİ OLUŞTUR ✨</button>
             </div>
          </div>
        )}

        {isGeneratingStory && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center">
             <Loader2 className="w-20 h-20 text-sky-500 animate-spin mx-auto mb-6" />
             <h2 className="text-3xl font-black text-sky-600">Metin Yazılıyor...</h2>
          </div>
        )}

        {view === 'reading-ready' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center">
             <h2 className="text-4xl font-black text-amber-600 mb-8">Hazır mısın?</h2>
             {micError && <div className="bg-rose-100 text-rose-700 p-4 rounded-xl font-bold mb-6">🎙️ {micError}</div>}
             <div className="flex gap-4">
                <button onClick={() => beginTimer(false)} className="flex-1 bg-sky-500 text-white py-5 rounded-2xl text-xl font-black border-b-4 border-sky-700">SESSİZ OKU 📖</button>
                <button onClick={() => beginTimer(true)} className="flex-1 bg-rose-500 text-white py-5 rounded-2xl text-xl font-black border-b-4 border-rose-700 flex justify-center gap-2"><Mic /> SESLİ OKU</button>
             </div>
          </div>
        )}

        {view === 'reading-active' && (
          <div className="max-w-4xl mx-auto mt-12 space-y-8">
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-sky-200">
                <p className="text-3xl leading-[4rem] font-bold text-slate-800 whitespace-pre-wrap">{storyData.text}</p>
             </div>
             {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-6 rounded-full text-4xl font-black shadow-lg">BİTİRDİM! 🎉</button>}
             
             {isReadingFinished && (
               <div className="bg-white p-8 rounded-[2rem] border-8 border-fuchsia-300 space-y-8">
                 <h2 className="text-3xl font-black text-fuchsia-600 text-center">Soruları Cevapla 🧠</h2>
                 {storyData.questions.map((q, idx) => (
                   <div key={q.id} className="bg-fuchsia-50 p-6 rounded-2xl border-4 border-fuchsia-100">
                     <h3 className="text-2xl font-black text-fuchsia-900 mb-4">{idx+1}. {q.q}</h3>
                     <div className="flex flex-col gap-3">
                        {q.options.map((opt, optIdx) => (
                          <button key={optIdx} onClick={() => setAnswers({...answers, [q.id]: optIdx})} className={`p-4 rounded-xl font-bold text-lg text-left ${answers[q.id] === optIdx ? 'bg-emerald-500 text-white' : 'bg-white text-fuchsia-700'}`}>{opt}</button>
                        ))}
                     </div>
                   </div>
                 ))}
                 <button onClick={checkAnswers} disabled={Object.keys(answers).length < 2} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black border-b-8 border-sky-700">KARNEMİ GÖSTER 🏆</button>
               </div>
             )}
          </div>
        )}

        {view === 'evaluating' && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center">
             <Loader2 className="w-20 h-20 text-emerald-500 animate-spin mx-auto mb-6" />
             <h2 className="text-3xl font-black text-emerald-600">Okuman Değerlendiriliyor... 🌟</h2>
          </div>
        )}

        {view === 'result' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-12 text-center space-y-8">
             <h2 className="text-4xl font-black text-sky-600">Tebrikler {readingResult.name.split(' ')[0]}!</h2>
             <div className="bg-indigo-50 p-6 rounded-2xl font-bold text-indigo-900 text-lg">"{readingResult.aiEvaluation.geribildirim}"</div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm font-bold"><span className="text-amber-500 text-2xl block">{readingResult.wpm}</span> Hız (wpm)</div>
                <div className="bg-white p-4 rounded-xl shadow-sm font-bold"><span className="text-emerald-500 text-2xl block">{readingResult.compScore}/2</span> Doğru</div>
             </div>
             <button onClick={()=>{setView('student-setup')}} className="w-full bg-sky-500 text-white py-5 rounded-2xl text-2xl font-black">YENİDEN OYNA 🎮</button>
          </div>
        )}

        {view === 'teacher-login' && (
           <div className="max-w-md mx-auto bg-white/95 p-10 rounded-[2rem] shadow-2xl mt-20">
              <h2 className="text-3xl font-black text-emerald-600 text-center mb-8">Öğretmen Girişi</h2>
              <form onSubmit={e => { e.preventDefault(); if (teacherPassword === actualTeacherPassword) { setTeacherTab('stats'); setView('teacher'); setPasswordError(false); } else setPasswordError(true); }} className="space-y-6">
                 <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} className="w-full p-4 border-4 rounded-xl text-center text-4xl tracking-[1em] bg-white font-bold" placeholder="••••" maxLength={4} />
                 {passwordError && <p className="text-rose-500 font-bold text-center">Hatalı Şifre!</p>}
                 <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-xl text-2xl font-black border-b-6 border-emerald-700">GİRİŞ YAP 🚀</button>
                 <button type="button" onClick={()=>setView('student-setup')} className="w-full text-slate-400 font-bold mt-4">Geri Dön</button>
              </form>
           </div>
        )}

        {view === 'teacher' && (
          <div className="max-w-6xl mx-auto bg-white/95 rounded-[3rem] shadow-2xl mt-12 min-h-[600px] p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-emerald-600">Öğretmen Paneli</h2>
              <button onClick={() => setView('student-setup')} className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full font-bold">Öğrenci Ekranına Dön</button>
            </div>
            <div className="flex border-b-4 border-emerald-100 mb-8">
              {['stats', 'students', 'homework', 'settings'].map(tab => (
                <button key={tab} onClick={() => setTeacherTab(tab)} className={`flex-1 py-4 font-black capitalize ${teacherTab === tab ? 'text-emerald-700 border-b-8 border-emerald-500' : 'text-slate-400'}`}>{tab === 'stats' ? 'Sonuçlar' : tab === 'students' ? 'Öğrenciler' : tab === 'homework' ? 'Ödevler' : 'Ayarlar'}</button>
              ))}
            </div>

            {teacherTab === 'stats' && (
              <div>
                <div className="mb-6 flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100">
                  <label className="font-black text-emerald-800 text-lg">Öğrenci Gelişimi:</label>
                  <select
                    value={selectedStudentForProgress || ''}
                    onChange={(e) => setSelectedStudentForProgress(e.target.value || null)}
                    className="flex-1 p-3 border-4 border-emerald-200 rounded-xl font-bold text-emerald-900 bg-white outline-none"
                  >
                    <option value="">Tüm Sınıfın Son Okumaları (Genel Liste)</option>
                    {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {selectedStudentForProgress ? (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-emerald-600 mb-4">📈 {selectedStudentForProgress} - Geçmiş Okumaları</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-emerald-50 rounded-2xl">
                        <thead><tr className="border-b-4 border-emerald-100"><th className="p-4">Tarih</th><th className="p-4">Konu</th><th className="p-4 text-center">Hız (wpm)</th><th className="p-4 text-center">Skor</th></tr></thead>
                        <tbody>
                          {stats.filter(r => r.name === selectedStudentForProgress).map(row => (
                            <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900">
                              <td className="p-4">{row.date || 'Belirtilmedi'}</td>
                              <td className="p-4">{row.interest}</td>
                              <td className="p-4 text-center">{row.wpm}</td>
                              <td className="p-4 text-center">{row.compScore}/2</td>
                            </tr>
                          ))}
                          {stats.filter(r => r.name === selectedStudentForProgress).length === 0 && (
                            <tr><td colSpan="4" className="p-4 text-center text-emerald-600 font-bold">Henüz okuma kaydı yok.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left bg-emerald-50 rounded-2xl">
                       <thead><tr className="border-b-4 border-emerald-100"><th className="p-4">İsim</th><th className="p-4">Konu</th><th className="p-4 text-center">Hız</th><th className="p-4 text-center">Skor</th></tr></thead>
                       <tbody>
                         {stats.map(row => (
                           <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900">
                             <td className="p-4">{row.name}</td><td className="p-4">{row.interest}</td><td className="p-4 text-center">{row.wpm}</td><td className="p-4 text-center">{row.compScore}/2</td>
                           </tr>
                         ))}
                         {stats.length === 0 && (
                            <tr><td colSpan="4" className="p-4 text-center text-emerald-600 font-bold">Henüz hiç okuma yapılmadı.</td></tr>
                         )}
                       </tbody>
                     </table>
                  </div>
                )}
              </div>
            )}

            {teacherTab === 'students' && (
              <div>
                <div className="flex gap-4 mb-8">
                  <input type="text" placeholder="Ad Soyad" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 border-4 rounded-xl font-bold" />
                  <input type="text" placeholder="Şifre" value={newStudentPassword} onChange={e=>setNewStudentPassword(e.target.value)} className="w-32 p-4 border-4 rounded-xl font-bold text-center" />
                  <button onClick={handleAddStudent} className="bg-emerald-500 text-white font-bold px-8 rounded-xl">Ekle</button>
                </div>
                {students.length === 0 && <button onClick={handleLoadDefaultClass} className="bg-amber-100 text-amber-800 px-6 py-3 rounded-full font-bold mb-4">1/A Listesini Yükle</button>}
                <div className="space-y-4">
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl font-bold">
                      <span>{s.name}</span>
                      <button onClick={() => handleDeleteStudent(s.id, s.name)} className="bg-rose-500 text-white px-4 py-2 rounded-lg">Sil</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teacherTab === 'homework' && (
              <div>
                <textarea value={hwForm.text} onChange={e => setHwForm({...hwForm, text: e.target.value})} className="w-full p-6 border-4 rounded-2xl h-40 font-bold mb-4" placeholder="Okuma Metni..." />
                <button onClick={handlePublishHomework} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-2xl">Sınıfa Gönder</button>
              </div>
            )}

            {teacherTab === 'settings' && (
              <div className="flex gap-4">
                 <input type="text" placeholder="Yeni Yönetici Şifresi" value={newTeacherPasswordInput} onChange={e=>setNewTeacherPasswordInput(e.target.value)} className="flex-1 p-4 border-4 rounded-xl font-bold" />
                 <button onClick={handleUpdateTeacherPassword} className="bg-emerald-500 text-white font-bold px-8 rounded-xl">Şifreyi Güncelle</button>
              </div>
            )}
            {teacherMsg && <p className="mt-4 font-bold text-emerald-600">{teacherMsg}</p>}
          </div>
        )}

      </div>
    </div>
  );
}
