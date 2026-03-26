import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users, Search, Eye } from 'lucide-react';
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
    text: '', q1: '', q1o1: '', q1o2: '', q1o3: '', q1c: 0,
    q2: '', q2o1: '', q2o2: '', q2o3: '', q2c: 1
  });

  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🐶'); 
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const [hwTopic, setHwTopic] = useState('');
  const [hwLevel, setHwLevel] = useState('1');
  const [isGeneratingHw, setIsGeneratingHw] = useState(false);
  
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

  const [showHeceler, setShowHeceler] = useState(false);
  const [foundWords, setFoundWords] = useState([]);

  // YENİ: Göz Jimnastiği State'leri
  const [eyeGymSpeed, setEyeGymSpeed] = useState(600); // Tavşan hızı varsayılan
  const [eyeGymWords, setEyeGymWords] = useState([]);
  const [eyeGymIndex, setEyeGymIndex] = useState(-1);
  const [isGeneratingEyeGym, setIsGeneratingEyeGym] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error(error); }
    };
    initAuth();
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
      const loadedStats = [];
      snapshot.forEach((docItem) => loadedStats.push({ id: docItem.id, ...docItem.data() }));
      setStats(loadedStats.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));
    });

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
      const loadedStudents = [];
      snapshot.forEach((docItem) => loadedStudents.push({ id: docItem.id, ...docItem.data() }));
      setStudents(loadedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
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
        setSavedProfile(data); setStudentName(data.studentName); setStudentPassword(data.studentPassword);
        setStudentAvatar(data.avatar || '🐶'); setLevel(data.level); setRememberMe(true);
        const topicsArray = (data.interest || '').split(', ').filter(t => t.trim() !== '');
        const cleanPredefined = PREDEFINED_TOPICS.map(t => t.split(' ')[0]);
        setSelectedTopics(topicsArray.filter(t => cleanPredefined.includes(t)));
        setCustomTopic(topicsArray.filter(t => !cleanPredefined.includes(t)).join(', '));
      }
    };
    fetchProfile();
  }, [user]);

  // YENİ: Göz Jimnastiği Zamanlayıcısı
  useEffect(() => {
    if (view === 'eye-gym-active' && eyeGymWords.length > 0 && eyeGymIndex < eyeGymWords.length) {
      const timer = setTimeout(() => {
        setEyeGymIndex(prev => prev + 1);
      }, eyeGymSpeed);
      return () => clearTimeout(timer);
    }
  }, [view, eyeGymWords, eyeGymIndex, eyeGymSpeed]);

  const showTeacherMessage = (msg) => { setTeacherMsg(msg); setTimeout(() => setTeacherMsg(''), 4000); };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPassword) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: newStudentName.trim(), password: newStudentPassword.trim() });
      setNewStudentName(''); setNewStudentPassword('1234'); showTeacherMessage(`✅ ${newStudentName} sınıfa eklendi!`);
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
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id)); showTeacherMessage(`🗑️ ${name} silindi.`);
    } catch (e) { showTeacherMessage(`❌ Silinemedi.`); }
  };

  const handleDeleteStat = async (id) => {
    if (window.confirm('Bu okuma kaydını silmek istediğinize emin misiniz?')) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', id)); showTeacherMessage('🗑️ Kayıt başarıyla silindi.'); } 
      catch (e) { showTeacherMessage('❌ Kayıt silinemedi.'); }
    }
  };

  const handlePublishHomework = async () => {
    if (!hwForm.text || !hwForm.q1 || !hwForm.q2) { showTeacherMessage('⚠️ Lütfen metni ve soruları eksiksiz doldurun.'); return; }
    showTeacherMessage('⏳ Ödev gönderiliyor...');
    try {
      const homeworkData = {
        text: hwForm.text,
        questions: [
          { id: 1, q: hwForm.q1, options: [hwForm.q1o1, hwForm.q1o2, hwForm.q1o3], correct: Number(hwForm.q1c) },
          { id: 2, q: hwForm.q2, options: [hwForm.q2o1, hwForm.q2o2, hwForm.q2o3], correct: Number(hwForm.q2c) }
        ],
        timestamp: serverTimestamp()
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'), homeworkData);
      showTeacherMessage('✅ Ödev sınıfa başarıyla gönderildi!');
    } catch (e) { showTeacherMessage('❌ Ödev gönderilemedi.'); }
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
      const newProfile = { ...savedProfile, avatar: ava }; setSavedProfile(newProfile);
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
    }
  };

  const callGeminiAPI = async (topic, selectedLevel, isEyeGym = false) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY; 
    if (!apiKey) throw new Error("API Anahtarı bulunamadı.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');
    
    let payload;

    if (isEyeGym) {
      // GÖZ JİMNASTİĞİ İÇİN ÖZEL PROMPT
      let wordsCount = selectedLevel === '1' ? "20-30" : selectedLevel === '2' ? "30-50" : "50-80";
      const prompt = `Sen bir hızlı okuma eğitmenisin. Konu: "${topic}". İçinde zor noktalama işaretleri olmayan, çocukların göz egzersizi yapması için akıcı, tek parça ve tam ${wordsCount} kelimelik bir metin yaz. Sadece düz metin ver.
      YALNIZCA JSON formatında dön: { "text": "Metin buraya..." }`;
      payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
    } else {
      // NORMAL HİKAYE PROMPTU
      let levelInstructions = selectedLevel === '1' ? "KOLAY SEVİYE: Kesinlikle 30 ile 50 kelime arasında yaz." : selectedLevel === '2' ? "ORTA SEVİYE: Kesinlikle 50 ile 90 kelime arasında yaz." : "ZOR SEVİYE: Kesinlikle 90 ile 140 kelime arasında yaz.";
      
      const prompt = `Sen Türkçe dilini kusursuz, son derece doğal ve insansı bir şekilde kullanan ödüllü bir çocuk edebiyatı yazarı ve şefkatli bir 1. sınıf öğretmenisin. Konu: "${topic}". 
      Şu kurallara SIKI SIKIYA UYMALISIN:
      ${levelInstructions}
      EDEBI KALİTE: Cümleler birbirini kusursuzca tamamlamalı, sürükleyici ve doğal bir Türkçe ile yazılmalıdır.
      HAZİNE AVI: Hikayenin içine belli bir kategoriye ait (örneğin 3 farklı renk, 3 farklı hayvan ismi veya 3 meyve) gizli kelimeler yerleştir.
      Karakter isimlerini şu listeden seç: ${studentNamesStr || 'Ali, Elif'}.
      
      YALNIZCA JSON formatında cevap ver (targetWords içine kelimenin metinde geçen TAMP TAMINA ek almış halini küçük harfle yaz):
      { 
        "text": "Hikaye metni buraya...", 
        "questions": [ { "id": 1, "q": "Soru 1?", "options": ["A", "B", "C"], "correct": 0 }, { "id": 2, "q": "Soru 2?", "options": ["A", "B", "C"], "correct": 1 } ],
        "treasureHunt": { "task": "Metindeki gizli hayvanları bulup tıkla!", "targetWords": ["kedi", "kuş", "köpek"] }
      }`;
      payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
    }

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

  const handleGenerateHomeworkAI = async () => {
    if (!hwTopic) { showTeacherMessage("⚠️ Lütfen bir ödev konusu yazın."); return; }
    setIsGeneratingHw(true); showTeacherMessage("⏳ Yapay zeka ödevi hazırlıyor, lütfen bekleyin...");
    try {
      const aiData = await callGeminiAPI(hwTopic, hwLevel);
      setHwForm({
        text: aiData.text,
        q1: aiData.questions[0].q, q1o1: aiData.questions[0].options[0], q1o2: aiData.questions[0].options[1], q1o3: aiData.questions[0].options[2], q1c: aiData.questions[0].correct,
        q2: aiData.questions[1].q, q2o1: aiData.questions[1].options[0], q2o2: aiData.questions[1].options[1], q2o3: aiData.questions[1].options[2], q2c: aiData.questions[1].correct
      });
      showTeacherMessage("✨ Ödev başarıyla oluşturuldu! Düzenleyip sınıfa gönderebilirsiniz.");
    } catch (err) {
      showTeacherMessage("❌ Sunucu şuan çok yoğun daha sonra tekrar deneyiniz.");
    } finally { setIsGeneratingHw(false); }
  };

  const evaluateReadingWithAI = async (text, timeSeconds, wpm, compScore, audioDataUrl) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const parts = [{ text: `Sen şefkatli bir öğretmensin. Metin: "${text}". Hız: ${wpm} wpm. Skor: 2/${compScore}. JSON formatında 1-5 arası puanla ve şefkatli geri bildirim yaz: { "akicilik": 4, "telaffuz": 5, "anlama": 5, "okuma_hizi": 4, "geribildirim": "Harika!" }` }];
    if (audioDataUrl) { try { parts.push({ inlineData: { mimeType: "audio/webm", data: audioDataUrl.split(',')[1] } }); } catch (e) {} }
    const payload = { contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } };
    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) { return { akicilik: 5, telaffuz: 5, anlama: 5, okuma_hizi: 5, geribildirim: "Harika bir okuma yaptın! 🌟" }; }
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

  const handleStartEyeGym = async () => {
    if (!validateStudent()) return;
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) { setLoginError('Lütfen bir konu seç.'); return; }
    setIsGeneratingEyeGym(true); setLoginError('');
    try {
      const aiData = await callGeminiAPI(combinedInterest, level, true);
      const words = aiData.text.split(/\s+/).filter(w => w.trim().length > 0);
      setEyeGymWords(words); setEyeGymIndex(0); setView('eye-gym-active');
    } catch (err) {
      setLoginError("Sunucu şuan çok yoğun daha sonra tekrar deneyiniz.");
    } finally { setIsGeneratingEyeGym(false); }
  };

  const startReadingSession = async (currentInterest, currentLevel, isHomework) => {
    setInterest(currentInterest); setLevel(currentLevel); setAnswers({}); setHasRetried(false); setAudioUrl(null); setIsReadingFinished(false); setShowHeceler(false); setFoundWords([]);
    if (isHomework) {
      setStoryData(activeHomework); setView('reading-ready');
    } else {
      setIsGeneratingStory(true);
      try {
        const aiData = await callGeminiAPI(currentInterest, currentLevel);
        setStoryData(aiData); setView('reading-ready');
      } catch (err) {
        setLoginError("Sunucu şuan çok yoğun daha sonra tekrar deneyiniz."); setView('student-setup');
      } finally { setIsGeneratingStory(false); }
    }
  };

  const beginTimer = async (withRecording = false) => {
    if (withRecording) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError("Cihazınız ses kaydını desteklemiyor. Sessiz okumaya geçiliyor...");
        setTimeout(() => { setMicError(''); setStartTime(Date.now()); setView('reading-active'); }, 3000); return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader(); reader.readAsDataURL(audioBlob);
          reader.onloadend = () => setAudioUrl(reader.result);
        };
        mediaRecorder.start(); setIsRecording(true);
      } catch (err) {
        setMicError("Mikrofon izni alınamadı. Sessiz okumaya geçiliyor...");
        setTimeout(() => { setMicError(''); setStartTime(Date.now()); setView('reading-active'); }, 3000); return;
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
    let correctCount = 0; storyData.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
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

    const earnedBadge = (storyData.treasureHunt && foundWords.length === storyData.treasureHunt.targetWords.length) ? '🕵️‍♂️' : '';
    const newResult = { name: studentName, avatar: studentAvatar, interest: interest, level: level, words: tempStats.words, timeSeconds: tempStats.timeSeconds, wpm: tempStats.wpm, compScore: correctCount, badge: earnedBadge, audioUrl: audioUrl || null, aiEvaluation, streakAchieved: currentStreak, date: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }), timestamp: serverTimestamp() };
    setReadingResult(newResult); setIsEvaluating(false); setView('result');
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult); } catch (e) {}
  };

  const renderStoryText = () => {
    if (!storyData || !storyData.text) return null;
    const targetWordsLower = (storyData.treasureHunt?.targetWords || []).map(w => w.toLowerCase('tr-TR'));

    return storyData.text.split(/(\s+)/).map((wordOrSpace, idx) => {
       if (!wordOrSpace.trim()) return <span key={idx}>{wordOrSpace}</span>; 
       const match = wordOrSpace.match(/^([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)([a-zA-ZğüşıöçĞÜŞİÖÇ]+)([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)$/);
       if (!match) return <span key={idx}>{wordOrSpace}</span>; 
       
       const before = match[1]; const cleanWord = match[2]; const after = match[3];
       const lowerCleanWord = cleanWord.toLowerCase('tr-TR');
       
       const isTarget = targetWordsLower.includes(lowerCleanWord);
       const isFound = foundWords.includes(lowerCleanWord);

       // YENİ MANTIK: Tıklama sadece okuma bitince (isReadingFinished = true) çalışır.
       const handleWordClick = () => {
         if (!isReadingFinished) return; 
         if (isTarget && !isFound) { setFoundWords(prev => [...prev, lowerCleanWord]); }
       };

       let wordContainerClass = "";
       if (isReadingFinished && storyData.treasureHunt) {
          if (isFound) {
             wordContainerClass = "bg-amber-300 text-amber-900 rounded-lg px-1 transition-all duration-300 scale-110 inline-block shadow-sm";
          } else {
             wordContainerClass = "cursor-pointer hover:bg-sky-100 transition-all rounded-lg px-1 inline-block";
          }
       }

       let content = <span>{cleanWord}</span>;
       if (showHeceler) {
         const sesliler = 'aeıioöuüAEIİOÖUÜ'; let heceler = []; let kelimeKopya = cleanWord;
         while (kelimeKopya.length > 0) {
           let sesliIndex = -1;
           for (let i = kelimeKopya.length - 1; i >= 0; i--) { if (sesliler.includes(kelimeKopya[i])) { sesliIndex = i; break; } }
           if (sesliIndex === -1) {
             if (heceler.length > 0) heceler[0] = kelimeKopya + heceler[0]; else heceler.unshift(kelimeKopya);
             break;
           }
           let heceBaslangici = sesliIndex;
           if (sesliIndex > 0 && !sesliler.includes(kelimeKopya[sesliIndex - 1])) { heceBaslangici = sesliIndex - 1; }
           heceler.unshift(kelimeKopya.substring(heceBaslangici)); kelimeKopya = kelimeKopya.substring(0, heceBaslangici);
         }
         content = <>{heceler.map((hece, hIdx) => (<span key={hIdx} className={hIdx % 2 === 0 ? "text-rose-500" : "text-slate-800"}>{hece}</span>))}</>;
       }
       return (
         <span key={idx} onClick={handleWordClick} className={wordContainerClass}>
           {before}{content}{after}
         </span>
       );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative pt-8 pb-12">
      {!['teacher-login', 'teacher'].includes(view) && (
        <button onClick={() => setShowProfileModal(true)} className="absolute top-4 left-4 flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white z-50">
           <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl">
             {savedProfile?.avatar?.startsWith('data') ? <img src={savedProfile.avatar} className="w-full h-full object-cover"/> : (savedProfile?.avatar || studentAvatar)}
           </div>
           <span className="font-black text-sky-800 text-xl">{savedProfile ? savedProfile.studentName.split(' ')[0] : 'Giriş'}</span>
        </button>
      )}

      <div className="flex-1 w-full px-4">
        
        {view === 'student-setup' && !isGeneratingStory && !isGeneratingEyeGym && (
          <div className="max-w-xl mx-auto bg-white/95 p-8 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-20 relative text-center">
             <button onClick={()=>setView('teacher-login')} className="absolute top-4 right-4 w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg z-10"><BarChart3 /></button>
             
             <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-fuchsia-400 to-amber-400 rounded-full blur opacity-70 animate-pulse"></div>
                  <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white mb-4">
                     <Rocket className="text-sky-500 w-14 h-14" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 drop-shadow-sm tracking-tight text-center">
                  Okuma Maceram
                </h1>
             </div>
             
             <div className="space-y-6">
                <div className="bg-sky-50 p-6 rounded-2xl border-4 border-sky-100 text-left">
                   <label className="block text-lg font-black text-sky-800 mb-2">Ad Soyad:</label>
                   <select value={studentName} onChange={e=>setStudentName(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl font-bold mb-4 bg-white outline-none text-sky-800">
                     <option value="">İsmini Seç...</option>
                     {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                   </select>
                   <label className="block text-lg font-black text-sky-800 mb-2 mt-4">Şifre:</label>
                   <input type="password" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl text-center text-2xl tracking-[1em] outline-none font-bold" placeholder="••••" maxLength={4} />
                   {loginError && <p className="text-rose-500 font-bold mt-3 text-center">{loginError}</p>}
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
                   
                   <label className="block text-lg font-black text-sky-800 mb-2">Okuma Seviyesi:</label>
                   <div className="flex gap-2">
                      {[{id:'1', l:'Kolay'}, {id:'2', l:'Orta'}, {id:'3', l:'Zor'}].map(lvl => (
                        <button key={lvl.id} onClick={() => setLevel(lvl.id)} className={`flex-1 py-3 rounded-xl font-black ${level === lvl.id ? 'bg-amber-400 text-amber-900' : 'bg-white text-sky-700'}`}>{lvl.l}</button>
                      ))}
                   </div>
                </div>

                <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-3 bg-white p-3 rounded-xl border-4 border-sky-100 cursor-pointer justify-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-4 ${rememberMe ? 'bg-fuchsia-500 border-fuchsia-500' : 'bg-white border-sky-300'}`}>{rememberMe && <Check className="text-white" />}</div>
                  <span className="text-sky-800 font-black">Beni bu cihazda hatırla</span>
                </div>

                <div className="space-y-4">
                   <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-2xl font-black border-b-8 border-sky-700 shadow-xl">HİKAYEMİ OLUŞTUR ✨</button>
                   {/* YENİ: Göz Jimnastiği Odası Girişi */}
                   <button onClick={() => { setLoginError(''); setView('eye-gym-setup'); }} className="w-full bg-indigo-500 text-white py-4 rounded-2xl text-xl font-black border-b-8 border-indigo-700 shadow-xl flex items-center justify-center gap-3"><Eye /> GÖZ JİMNASTİĞİ YAP</button>
                </div>
             </div>
          </div>
        )}

        {/* YENİ: Göz Jimnastiği Hazırlık Ekranı */}
        {view === 'eye-gym-setup' && !isGeneratingEyeGym && (
           <div className="max-w-xl mx-auto bg-white/95 p-8 rounded-[3rem] shadow-2xl border-8 border-indigo-300 mt-20 text-center">
              <h2 className="text-4xl font-black text-indigo-600 mb-8 flex items-center justify-center gap-3"><Eye /> Göz Jimnastiği</h2>
              <div className="bg-indigo-50 p-6 rounded-2xl border-4 border-indigo-100 text-left space-y-6">
                 <div>
                    <label className="block text-lg font-black text-indigo-800 mb-2">Hızını Seç:</label>
                    <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => setEyeGymSpeed(1000)} className={`p-4 rounded-xl font-black flex flex-col items-center gap-2 ${eyeGymSpeed === 1000 ? 'bg-emerald-400 text-emerald-900' : 'bg-white text-indigo-700'}`}>
                         <span className="text-3xl">🐢</span> Yavaş
                       </button>
                       <button onClick={() => setEyeGymSpeed(600)} className={`p-4 rounded-xl font-black flex flex-col items-center gap-2 ${eyeGymSpeed === 600 ? 'bg-amber-400 text-amber-900' : 'bg-white text-indigo-700'}`}>
                         <span className="text-3xl">🐇</span> Normal
                       </button>
                       <button onClick={() => setEyeGymSpeed(300)} className={`p-4 rounded-xl font-black flex flex-col items-center gap-2 ${eyeGymSpeed === 300 ? 'bg-rose-400 text-rose-900' : 'bg-white text-indigo-700'}`}>
                         <span className="text-3xl">🐆</span> Hızlı
                       </button>
                    </div>
                 </div>
                 {loginError && <p className="text-rose-500 font-bold mt-3 text-center">{loginError}</p>}
              </div>
              <button onClick={handleStartEyeGym} className="w-full bg-indigo-500 text-white py-6 rounded-2xl text-2xl font-black border-b-8 border-indigo-700 shadow-xl mt-8">EGZERSİZE BAŞLA 🚀</button>
              <button onClick={() => setView('student-setup')} className="mt-6 text-indigo-400 font-bold">Vazgeç ve Geri Dön</button>
           </div>
        )}

        {(isGeneratingStory || isGeneratingEyeGym) && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center">
             <Loader2 className="w-20 h-20 text-sky-500 animate-spin mx-auto mb-6" />
             <h2 className="text-3xl font-black text-sky-600">Hazırlanıyor...</h2>
          </div>
        )}

        {/* YENİ: Göz Jimnastiği Aktif Ekranı */}
        {view === 'eye-gym-active' && (
          <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center min-h-[50vh]">
             {eyeGymIndex < eyeGymWords.length ? (
               <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border-8 border-indigo-200 w-full flex items-center justify-center h-64 md:h-96">
                  <span className="text-5xl md:text-8xl font-black text-indigo-700 tracking-tight transition-all duration-100">{eyeGymWords[eyeGymIndex]}</span>
               </div>
             ) : (
               <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-emerald-300 w-full space-y-6">
                  <h2 className="text-4xl font-black text-emerald-600">Harika İş Çıkardın! 🎉</h2>
                  <p className="text-2xl font-bold text-emerald-800">Göz kasların artık çok daha güçlü.</p>
                  <button onClick={() => setView('student-setup')} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl text-2xl font-black shadow-lg">Ana Menüye Dön</button>
               </div>
             )}
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
             <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative mt-8">
                <div className="absolute -top-6 right-6">
                    <button onClick={() => setShowHeceler(!showHeceler)} className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-black flex items-center gap-2 shadow-lg transition-colors ${showHeceler ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <Sparkles size={20} />
                      HECEMATİK {showHeceler ? 'AÇIK' : 'KAPALI'}
                    </button>
                </div>
                <p className="text-xl md:text-3xl leading-relaxed md:leading-[4rem] font-bold text-slate-800 whitespace-pre-wrap mt-4 cursor-default">
                   {renderStoryText()}
                </p>
             </div>

             {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-6 rounded-full text-4xl font-black shadow-lg">BİTİRDİM! 🎉</button>}
             
             {isReadingFinished && (
               <div className="space-y-8">
                 {/* YENİ: BİTİRDİKTEN SONRA AÇILAN HAZİNE AVI KARTI */}
                 {storyData?.treasureHunt && (
                   <div className="bg-amber-100 border-4 border-amber-300 p-8 rounded-[2rem] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                      <div className="flex items-center gap-6">
                         <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-inner">
                            <Search className="text-amber-500 w-12 h-12" />
                         </div>
                         <div>
                            <h4 className="font-black text-amber-900 text-3xl mb-2">Dedektif Olma Zamanı!</h4>
                            <p className="font-bold text-amber-700 text-xl">{storyData.treasureHunt.task} Tıklayarak bul!</p>
                         </div>
                      </div>
                      <div className="bg-white px-8 py-4 rounded-3xl border-4 border-amber-200 font-black text-amber-600 text-5xl text-center">
                         {foundWords.length} / {storyData.treasureHunt.targetWords.length}
                         {foundWords.length === storyData.treasureHunt.targetWords.length && <div className="text-sm mt-2 text-emerald-600">Rozet Açıldı!</div>}
                      </div>
                   </div>
                 )}

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
             {readingResult.badge && (
                <div className="text-8xl animate-bounce mb-4 text-center">{readingResult.badge}</div>
             )}
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

                {selectedStudentForProgress && (
                  <div className="bg-white p-6 rounded-2xl border-4 border-emerald-100 mb-6 shadow-sm">
                    <h4 className="font-black text-emerald-800 mb-6 text-center">Okuma Hızı Gelişim Grafiği (WPM)</h4>
                    <div className="flex items-end justify-center gap-4 h-48 mt-4">
                       {[...stats].filter(r => r.name === selectedStudentForProgress).reverse().map((row, idx) => {
                          const studentStats = stats.filter(r => r.name === selectedStudentForProgress);
                          const allWpm = studentStats.map(s => Number(s.wpm) || 0);
                          const maxWpm = Math.max(...allWpm, 50);
                          const currentWpm = Number(row.wpm) || 0;
                          const heightPct = Math.min((currentWpm / maxWpm) * 100, 100);
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 w-16 group relative">
                               <span className="font-bold text-sm text-emerald-600 opacity-0 group-hover:opacity-100 absolute -top-8 bg-emerald-100 px-2 py-1 rounded transition-opacity">{currentWpm}</span>
                               <div className="w-full bg-emerald-400 rounded-t-md transition-all hover:bg-emerald-500 cursor-pointer" style={{ height: `${heightPct}%`, minHeight: '10%' }}></div>
                               <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">{row.date?.split(' ')[0]}</span>
                            </div>
                          )
                       })}
                       {stats.filter(r => r.name === selectedStudentForProgress).length === 0 && (
                         <div className="flex items-center justify-center w-full h-full text-emerald-600 font-bold">Grafik oluşturulacak veri yok.</div>
                       )}
                    </div>
                  </div>
                )}

                {selectedStudentForProgress ? (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-emerald-600 mb-4">📈 {selectedStudentForProgress} - Geçmiş Okumaları</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-emerald-50 rounded-2xl">
                        <thead>
                           <tr className="border-b-4 border-emerald-100">
                             <th className="p-4">Tarih</th>
                             <th className="p-4">Konu</th>
                             <th className="p-4 text-center">Hız (wpm)</th>
                             <th className="p-4 text-center">Skor</th>
                             <th className="p-4 text-center">Ses Kaydı</th>
                             <th className="p-4 text-center">İşlem</th>
                           </tr>
                        </thead>
                        <tbody>
                          {stats.filter(r => r.name === selectedStudentForProgress).map(row => (
                            <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900">
                              <td className="p-4">{row.date || 'Belirtilmedi'}</td>
                              <td className="p-4">{row.interest}</td>
                              <td className="p-4 text-center">{row.wpm}</td>
                              <td className="p-4 text-center">{row.compScore}/2 {row.badge}</td>
                              <td className="p-4 text-center">
                                {row.audioUrl ? <audio src={row.audioUrl} controls className="h-8 w-full max-w-[150px] mx-auto" /> : <span className="text-slate-400 text-sm">Yok</span>}
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => handleDeleteStat(row.id)} className="bg-rose-100 text-rose-600 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Kaydı Sil">
                                  <X size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {stats.filter(r => r.name === selectedStudentForProgress).length === 0 && (
                            <tr><td colSpan="6" className="p-4 text-center text-emerald-600 font-bold">Henüz okuma kaydı yok.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left bg-emerald-50 rounded-2xl">
                       <thead>
                         <tr className="border-b-4 border-emerald-100">
                           <th className="p-4">İsim</th>
                           <th className="p-4">Konu</th>
                           <th className="p-4 text-center">Hız (wpm)</th>
                           <th className="p-4 text-center">Skor</th>
                           <th className="p-4 text-center">Ses Kaydı</th>
                           <th className="p-4 text-center">İşlem</th>
                         </tr>
                       </thead>
                       <tbody>
                         {stats.map(row => (
                           <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900">
                             <td className="p-4">{row.name}</td>
                             <td className="p-4">{row.interest}</td>
                             <td className="p-4 text-center">{row.wpm}</td>
                             <td className="p-4 text-center">{row.compScore}/2 {row.badge}</td>
                             <td className="p-4 text-center">
                               {row.audioUrl ? <audio src={row.audioUrl} controls className="h-8 w-full max-w-[150px] mx-auto" /> : <span className="text-slate-400 text-sm">Yok</span>}
                             </td>
                             <td className="p-4 text-center">
                               <button onClick={() => handleDeleteStat(row.id)} className="bg-rose-100 text-rose-600 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Kaydı Sil">
                                 <X size={18} />
                               </button>
                             </td>
                           </tr>
                         ))}
                         {stats.length === 0 && (
                            <tr><td colSpan="6" className="p-4 text-center text-emerald-600 font-bold">Henüz hiç okuma yapılmadı.</td></tr>
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
                      <span className="flex-1 text-lg">{s.name}</span>
                      <div className="flex items-center gap-3">
                        {editingPasswords[s.id] !== undefined ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={editingPasswords[s.id]} 
                              onChange={(e) => setEditingPasswords({...editingPasswords, [s.id]: e.target.value})}
                              className="w-24 p-2 border-2 border-emerald-300 rounded-lg text-center font-bold outline-none"
                              maxLength={4}
                            />
                            <button onClick={() => handleUpdatePassword(s.id, editingPasswords[s.id])} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold">Kaydet</button>
                            <button onClick={() => { const newEd = {...editingPasswords}; delete newEd[s.id]; setEditingPasswords(newEd); }} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">İptal</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="bg-white px-4 py-2 rounded-lg border-2 border-emerald-200 text-emerald-700 tracking-widest font-bold">{s.password}</span>
                            <button onClick={() => setEditingPasswords({...editingPasswords, [s.id]: s.password})} className="bg-sky-500 text-white px-4 py-2 rounded-lg font-bold">Şifre Değiştir</button>
                          </div>
                        )}
                        <button onClick={() => handleDeleteStudent(s.id, s.name)} className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold">Sil</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teacherTab === 'homework' && (
              <div className="space-y-6">
                <div className="bg-fuchsia-50 p-6 rounded-2xl border-4 border-fuchsia-100 flex flex-wrap gap-4 items-center">
                   <h3 className="w-full text-xl font-black text-fuchsia-800 mb-2">🤖 Yapay Zeka ile Ödev Üret</h3>
                   <input type="text" placeholder="Ödev Konusu (Örn: Uzaylı Dostlar)" value={hwTopic} onChange={e=>setHwTopic(e.target.value)} className="flex-1 p-3 border-4 border-fuchsia-200 rounded-xl font-bold" />
                   <select value={hwLevel} onChange={e=>setHwLevel(e.target.value)} className="p-3 border-4 border-fuchsia-200 rounded-xl font-bold bg-white text-fuchsia-900">
                     <option value="1">Kolay Seviye</option>
                     <option value="2">Orta Seviye</option>
                     <option value="3">Zor Seviye</option>
                   </select>
                   <button onClick={handleGenerateHomeworkAI} disabled={isGeneratingHw} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
                     {isGeneratingHw ? <Loader2 className="animate-spin" /> : <Sparkles />} Üret
                   </button>
                </div>

                <div>
                   <label className="block text-lg font-black text-emerald-800 mb-2">Okuma Metni:</label>
                   <textarea value={hwForm.text} onChange={e => setHwForm({...hwForm, text: e.target.value})} className="w-full p-4 border-4 border-emerald-200 rounded-2xl h-40 font-bold" placeholder="Okuma metnini buraya yazın veya yapay zekaya ürettirin..." />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100 space-y-3">
                      <label className="font-black text-emerald-800">Soru 1:</label>
                      <input type="text" value={hwForm.q1} onChange={e=>setHwForm({...hwForm, q1: e.target.value})} className="w-full p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="Soru cümlesi..." />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" value={hwForm.q1o1} onChange={e=>setHwForm({...hwForm, q1o1: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="A Şıkkı" />
                        <input type="text" value={hwForm.q1o2} onChange={e=>setHwForm({...hwForm, q1o2: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="B Şıkkı" />
                        <input type="text" value={hwForm.q1o3} onChange={e=>setHwForm({...hwForm, q1o3: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="C Şıkkı" />
                      </div>
                      <label className="font-bold text-emerald-700 text-sm">Doğru Cevap:</label>
                      <select value={hwForm.q1c} onChange={e=>setHwForm({...hwForm, q1c: Number(e.target.value)})} className="w-full p-2 border-2 border-emerald-200 rounded-lg font-bold">
                         <option value={0}>A Şıkkı</option>
                         <option value={1}>B Şıkkı</option>
                         <option value={2}>C Şıkkı</option>
                      </select>
                   </div>
                   
                   <div className="bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100 space-y-3">
                      <label className="font-black text-emerald-800">Soru 2:</label>
                      <input type="text" value={hwForm.q2} onChange={e=>setHwForm({...hwForm, q2: e.target.value})} className="w-full p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="Soru cümlesi..." />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" value={hwForm.q2o1} onChange={e=>setHwForm({...hwForm, q2o1: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="A Şıkkı" />
                        <input type="text" value={hwForm.q2o2} onChange={e=>setHwForm({...hwForm, q2o2: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="B Şıkkı" />
                        <input type="text" value={hwForm.q2o3} onChange={e=>setHwForm({...hwForm, q2o3: e.target.value})} className="p-2 border-2 border-emerald-200 rounded-lg font-bold" placeholder="C Şıkkı" />
                      </div>
                      <label className="font-bold text-emerald-700 text-sm">Doğru Cevap:</label>
                      <select value={hwForm.q2c} onChange={e=>setHwForm({...hwForm, q2c: Number(e.target.value)})} className="w-full p-2 border-2 border-emerald-200 rounded-lg font-bold">
                         <option value={0}>A Şıkkı</option>
                         <option value={1}>B Şıkkı</option>
                         <option value={2}>C Şıkkı</option>
                      </select>
                   </div>
                </div>

                <button onClick={handlePublishHomework} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-2xl border-b-8 border-emerald-700 shadow-xl active:translate-y-2 active:border-b-0 transition-all mt-4">Sınıfa Gönder 🚀</button>
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
