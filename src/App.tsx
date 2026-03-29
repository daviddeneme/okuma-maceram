import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users, Search, Eye, Lock, Unlock } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app); 
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
    text: '', q1: '', q1o1: '', q1o2: '', q1o3: '', q1c: 0, q2: '', q2o1: '', q2o2: '', q2o3: '', q2c: 1
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
  const [isUploading, setIsUploading] = useState(false);
  
  const [hwTopic, setHwTopic] = useState('');
  const [hwLevel, setHwLevel] = useState('1');
  const [isGeneratingHw, setIsGeneratingHw] = useState(false);
  
  const [loginError, setLoginError] = useState(''); 
  const [micError, setMicError] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [academyLevel, setAcademyLevel] = useState(1); // 1:Isınma, 2:Schulte, 3:Flaş, 4:Metronom

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

  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [badgeInCorner, setBadgeInCorner] = useState(false);

  // --- AKADEMİ STATE'LERİ ---
  const [warmupTime, setWarmupTime] = useState(30);
  const [schulteGrid, setSchulteGrid] = useState([]);
  const [schulteExpected, setSchulteExpected] = useState(1);
  
  const flashWordsData = [{w:"Elma", o:["Armut","Elma","Muz"]}, {w:"Kalem", o:["Silgi","Defter","Kalem"]}, {w:"Kedi", o:["Kedi","Köpek","Kuş"]}];
  const [flashStage, setFlashStage] = useState(0);
  const [isFlashShowing, setIsFlashShowing] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  
  const [metronomeBPM, setMetronomeBPM] = useState(60); // 60 BPM = 1 sn
  const [metronomeIndex, setMetronomeIndex] = useState(-1);
  const metronomeText = "Bir varmış bir yokmuş. Küçük bir çocuk ormanda gezerken kocaman bir ağaç görmüş. Ağacın dallarında kırmızı elmalar parlıyormuş. Çocuk elmalardan birini alıp afiyetle yemiş.";
  const [metronomeChunks, setMetronomeChunks] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error(error); }
    };
    initAuth();
    
    const localProfileData = localStorage.getItem('okumaMaceramProfile');
    if (localProfileData) {
      try {
        const data = JSON.parse(localProfileData);
        setStudentName(data.studentName);
        setStudentPassword(data.studentPassword);
        setStudentAvatar(data.avatar || '🐶');
        setLevel(data.level || '1');
        setAcademyLevel(data.academyLevel || 1);
        setRememberMe(true);
      } catch (e) { console.error("Local profil okunamadı", e); }
    }

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
        setStudentAvatar(data.avatar || '🐶'); setLevel(data.level); setAcademyLevel(data.academyLevel || 1); setRememberMe(true);
        const topicsArray = (data.interest || '').split(', ').filter(t => t.trim() !== '');
        const cleanPredefined = PREDEFINED_TOPICS.map(t => t.split(' ')[0]);
        setSelectedTopics(topicsArray.filter(t => cleanPredefined.includes(t)));
        setCustomTopic(topicsArray.filter(t => !cleanPredefined.includes(t)).join(', '));
      }
    };
    fetchProfile();
  }, [user]);

  const showTeacherMessage = (msg) => { setTeacherMsg(msg); setTimeout(() => setTeacherMsg(''), 4000); };

  const updateAcademyLevel = async (newLevel) => {
    if (newLevel > academyLevel) {
      setAcademyLevel(newLevel);
      if (savedProfile) {
        const newProfile = { ...savedProfile, academyLevel: newLevel };
        setSavedProfile(newProfile);
        if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
        localStorage.setItem('okumaMaceramProfile', JSON.stringify(newProfile));
      }
    }
  };

  // --- AKADEMİ MANTIKLARI ---
  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  // Isınma Zamanlayıcı
  useEffect(() => {
    let timer = null;
    if (view === 'academy-warmup' && warmupTime > 0) {
      timer = setTimeout(() => setWarmupTime(p => p - 1), 1000);
    } else if (view === 'academy-warmup' && warmupTime === 0) {
      updateAcademyLevel(2);
      showTeacherMessage("Gözlerin ısındı! Schulte Tablosu açıldı. 🔓");
      setView('academy-menu');
    }
    return () => clearTimeout(timer);
  }, [view, warmupTime]);

  // Metronom Oynatıcı
  useEffect(() => {
    let interval = null;
    if (view === 'academy-metronome' && metronomeIndex < metronomeChunks.length) {
      interval = setInterval(() => {
        playTick();
        setMetronomeIndex((prev) => prev + 1);
      }, (60 / metronomeBPM) * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, metronomeChunks, metronomeBPM, metronomeIndex]);


  const startSchulte = () => {
    setSchulteGrid([...Array(9)].map((_,i)=>i+1).sort(()=>Math.random()-0.5));
    setSchulteExpected(1);
    setView('academy-schulte');
  };

  const handleSchulteClick = (num) => {
    if(num === schulteExpected) {
      if(num === 9) {
        updateAcademyLevel(3);
        showTeacherMessage("Harika! Çevresel görüşün harika. Flaş modu açıldı. 🔓");
        setView('academy-menu');
      } else {
        setSchulteExpected(p => p + 1);
      }
    }
  };

  const startFlash = () => {
    setFlashStage(0); setFlashMessage(''); setView('academy-flash');
    triggerFlashWord();
  };

  const triggerFlashWord = () => {
    setIsFlashShowing(true);
    setTimeout(() => { setIsFlashShowing(false); }, 300); // 300ms yanıp sönme
  };

  const handleFlashAnswer = (opt, correctOpt) => {
    if(opt === correctOpt) {
      if(flashStage === 2) {
        updateAcademyLevel(4);
        showTeacherMessage("Fotoğrafik hafızan süper! Metronom açıldı. 🔓");
        setView('academy-menu');
      } else {
        setFlashMessage("Doğru! Hazırlan...");
        setTimeout(() => {
          setFlashMessage(''); setFlashStage(p => p+1); triggerFlashWord();
        }, 1500);
      }
    } else {
      setFlashMessage("Yanlış kelime. Baştan başlıyoruz...");
      setTimeout(() => { setFlashStage(0); setFlashMessage(''); triggerFlashWord(); }, 2000);
    }
  };

  const startMetronome = () => {
    const words = metronomeText.split(/\s+/);
    const chunks = [];
    for(let i=0; i<words.length; i+=2) chunks.push(words.slice(i, i+2).join(' ')); // İkili bloklar
    setMetronomeChunks(chunks); setMetronomeIndex(0); setView('academy-metronome');
  };
  // -------------------------

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

  const handleLoadDefaultClass = async () => {
    showTeacherMessage('⏳ Yükleniyor...');
    try {
      for (const name of DEFAULT_CLASS_LIST) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, password: '1234' });
      }
      showTeacherMessage('✅ 1/A Listesi yüklendi!');
    } catch (e) { showTeacherMessage('❌ Hata oluştu.'); }
  };

  const handlePublishHomework = async () => {
    if (!hwForm.text || !hwForm.q1 || !hwForm.q2) { showTeacherMessage('⚠️ Lütfen metni ve soruları eksiksiz doldurun.'); return; }
    showTeacherMessage('⏳ Ödev gönderiliyor...');
    try {
      const homeworkData = {
        text: hwForm.text.replace(/\*/g, ''), 
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

  const callGeminiAPI = async (topic, selectedLevel) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY; 
    if (!apiKey) throw new Error("API Anahtarı bulunamadı.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');
    const categories = ['renk', 'hayvan', 'meyve', 'aile üyesi', 'giysi', 'oyuncak', 'duygu', 'doğa (ağaç, çiçek, bulut vb.)'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    let levelInstructions = selectedLevel === '1' ? "KOLAY SEVİYE: Kesinlikle 30 ile 50 kelime arasında yaz." : selectedLevel === '2' ? "ORTA SEVİYE: Kesinlikle 50 ile 90 kelime arasında yaz." : "ZOR SEVİYE: Kesinlikle 90 ile 140 kelime arasında yaz.";
    
    const prompt = `Sen Türkçe dilini kusursuz, son derece doğal ve insansı bir şekilde kullanan ödüllü bir çocuk edebiyatı yazarı ve şefkatli bir 1. sınıf öğretmenisin. Konu: "${topic}". 
    Şu kurallara SIKI SIKIYA UYMALISIN:
    ${levelInstructions}
    EDEBI KALİTE: Cümleler birbirini kusursuzca tamamlamalı, sürükleyici ve doğal bir Türkçe ile yazılmalıdır.
    HAZİNE AVI: Hikayenin içine kesinlikle "${randomCategory}" kategorisine ait 3 farklı kelimeyi zorlama olmadan, çok doğal bir şekilde kurguya yedirerek yerleştir.
    DİKKAT KESİNLİKLE YASAK: Gizli kelimeleri veya metindeki herhangi bir kelimeyi ** (yıldız) veya başka bir işaretle ASLA VURGULAMA! Metin tamamen düz yazı olsun.
    Karakter isimlerini şu listeden seç: ${studentNamesStr || 'Ali, Elif'}.
    
    YALNIZCA JSON formatında cevap ver (targetWords içine kelimenin metinde geçen TAMP TAMINA ek almış halini küçük harfle yaz):
    { 
      "text": "Hikaye metni buraya...", 
      "questions": [ { "id": 1, "q": "Soru 1?", "options": ["A", "B", "C"], "correct": 0 }, { "id": 2, "q": "Soru 2?", "options": ["A", "B", "C"], "correct": 1 } ],
      "treasureHunt": { "task": "Metindeki gizli ${randomCategory.split(' (')[0]} isimlerini bulup tıkla!", "targetWords": ["kelime1", "kelime2", "kelime3"] }
    }`;

    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };

    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
      const data = await response.json();
      const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
      if(parsedData.text) parsedData.text = parsedData.text.replace(/\*/g, '');
      return parsedData;
    } catch (err) {
      console.error("❌ YAPAY ZEKA FONKSİYON HATASI:", err);
      throw err;
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
    if (!rememberMe) {
      localStorage.removeItem('okumaMaceramProfile');
      return;
    }
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    const profileData = { studentName, studentPassword, avatar: studentAvatar, interest: combinedInterest || 'Uzay', level, academyLevel: academyLevel, streak: savedProfile?.streak || 0, lastReadingDate: savedProfile?.lastReadingDate || null };
    localStorage.setItem('okumaMaceramProfile', JSON.stringify(profileData));
    
    if (user) {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), profileData);
      setSavedProfile(profileData);
    }
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
    setInterest(currentInterest); setLevel(currentLevel); setAnswers({}); setHasRetried(false); setAudioUrl(null); setIsReadingFinished(false); setShowHeceler(false); setFoundWords([]);
    setShowBadgeAnimation(false); setBadgeInCorner(false);
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

    let firebaseAudioUrl = null;
    if (audioChunksRef.current && audioChunksRef.current.length > 0) {
        setIsUploading(true);
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const fileName = `audio_${studentName.replace(/\s+/g, '_')}_${Date.now()}.webm`;
            const storageRef = ref(storage, `artifacts/${appId}/audio/${fileName}`);
            
            const uploadPromise = uploadBytes(storageRef, audioBlob);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Zaman Aşımı")), 10000));
            
            await Promise.race([uploadPromise, timeoutPromise]);
            firebaseAudioUrl = await getDownloadURL(storageRef);
        } catch(e) { console.error("Ses yükleme hatası", e); }
        setIsUploading(false);
    }

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
      localStorage.setItem('okumaMaceramProfile', JSON.stringify(newProfile));
    }

    const earnedBadge = (storyData.treasureHunt && foundWords.length === storyData.treasureHunt.targetWords.length) ? '🕵️‍♂️' : '';
    
    const now = new Date();
    const dateString = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeString = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const fullDateTime = `${dateString} - ${timeString}`;

    const newResult = { name: studentName, avatar: studentAvatar, interest: interest, level: level, words: tempStats.words, timeSeconds: tempStats.timeSeconds, wpm: tempStats.wpm, compScore: correctCount, badge: earnedBadge, audioUrl: firebaseAudioUrl || null, aiEvaluation, streakAchieved: currentStreak, date: fullDateTime, timestamp: serverTimestamp() };
    
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

       const handleWordClick = () => {
         if (!isReadingFinished) return; 
         if (isTarget && !isFound) { 
            const newFoundWords = [...foundWords, lowerCleanWord];
            setFoundWords(newFoundWords); 
            
            if (storyData.treasureHunt && newFoundWords.length === storyData.treasureHunt.targetWords.length) {
               setShowBadgeAnimation(true);
               setTimeout(() => {
                 setShowBadgeAnimation(false);
                 setBadgeInCorner(true);
                 setTimeout(() => setBadgeInCorner(false), 5000); 
               }, 3000);
            }
         }
       };

       let wordContainerClass = "";
       if (isReadingFinished && storyData.treasureHunt) {
          if (isFound) wordContainerClass = "bg-amber-300 text-amber-900 rounded-lg px-1 transition-all duration-300 scale-110 inline-block shadow-sm";
          else wordContainerClass = "cursor-pointer hover:bg-sky-100 transition-all rounded-lg px-1 inline-block";
       }

       let content = <span>{cleanWord}</span>;
       if (showHeceler) {
         const sesliler = 'aeıioöuüAEIİOÖUÜ'; let heceler = []; let kelimeKopya = cleanWord;
         while (kelimeKopya.length > 0) {
           let sesliIndex = -1;
           for (let i = kelimeKopya.length - 1; i >= 0; i--) { if (sesliler.includes(kelimeKopya[i])) { sesliIndex = i; break; } }
           if (sesliIndex === -1) {
             if (heceler.length > 0) heceler[0] = kelimeKopya + heceler[0]; else heceler.unshift(kelimeKopya); break;
           }
           let heceBaslangici = sesliIndex;
           if (sesliIndex > 0 && !sesliler.includes(kelimeKopya[sesliIndex - 1])) { heceBaslangici = sesliIndex - 1; }
           heceler.unshift(kelimeKopya.substring(heceBaslangici)); kelimeKopya = kelimeKopya.substring(0, heceBaslangici);
         }
         content = <>{heceler.map((hece, hIdx) => (<span key={hIdx} className={hIdx % 2 === 0 ? "text-rose-500" : "text-slate-800"}>{hece}</span>))}</>;
       }
       return <span key={idx} onClick={handleWordClick} className={wordContainerClass}>{before}{content}{after}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative pt-8 pb-12 overflow-x-hidden">
      
      {/* Sarkaç CSS Animasyonu (GPU Destekli) */}
      <style>{`
        @keyframes pendulum { 0% { transform: translateX(-35vw); } 50% { transform: translateX(35vw); } 100% { transform: translateX(-35vw); } }
        .animate-pendulum { animation: pendulum 3s infinite ease-in-out; }
      `}</style>

      {!['teacher-login', 'teacher'].includes(view) && (
        <div className="absolute top-4 left-4 flex items-center gap-4 z-50">
           <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white hover:scale-105 transition-transform cursor-pointer">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl">
                {savedProfile?.avatar?.startsWith('data') ? <img src={savedProfile.avatar} className="w-full h-full object-cover"/> : (savedProfile?.avatar || studentAvatar)}
              </div>
              <span className="font-black text-sky-800 text-xl">{savedProfile ? savedProfile.studentName.split(' ')[0] : 'Giriş'}</span>
           </button>
           {badgeInCorner && <div className="animate-pulse drop-shadow-2xl transition-all"><span className="text-5xl">🕵️‍♂️</span></div>}
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sky-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative border-8 border-sky-200">
              <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 bg-sky-100 p-2 rounded-full text-sky-600 hover:bg-sky-200"><X /></button>
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full bg-sky-100 text-5xl flex items-center justify-center mb-4 shadow-inner">
                    {savedProfile?.avatar?.startsWith('data') ? <img src={savedProfile.avatar} className="w-full h-full object-cover rounded-full"/> : (savedProfile?.avatar || studentAvatar || '👤')}
                 </div>
                 <h2 className="text-3xl font-black text-sky-800">{savedProfile ? savedProfile.studentName : (studentName || 'Misafir Öğrenci')}</h2>
                 <div className="flex gap-2 mt-2">
                    <span className="bg-amber-100 text-amber-600 px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-sm">
                       <Flame size={18}/> {savedProfile?.streak || 0} Gün Ateş Serisi
                    </span>
                 </div>
              </div>
              <div className="mt-8 space-y-4">
                 <div className="bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100 flex items-center justify-between">
                    <div className="font-black text-emerald-800 text-lg">Toplam Okunan Kelime</div>
                    <div className="text-3xl font-black text-emerald-600">
                       {stats.filter(s => s.name === (savedProfile?.studentName || studentName)).reduce((acc, curr) => acc + (Number(curr.words) || 0), 0)}
                    </div>
                 </div>
                 <div className="bg-fuchsia-50 p-4 rounded-2xl border-4 border-fuchsia-100 min-h-[120px]">
                    <div className="font-black text-fuchsia-800 text-lg mb-3">Başarı Vitrini 🏆</div>
                    <div className="flex flex-wrap gap-3">
                       <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm border-2 border-fuchsia-200">
                          <span className="text-3xl drop-shadow-md">🕵️‍♂️</span>
                          <span className="font-black text-fuchsia-700 text-2xl">x {stats.filter(s => s.name === (savedProfile?.studentName || studentName) && s.badge).length}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showBadgeAnimation && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-sm">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center animate-bounce border-8 border-amber-300 text-center max-w-xl">
               <span className="text-9xl mb-4 drop-shadow-2xl">🕵️‍♂️</span>
               <h2 className="text-4xl font-black text-amber-600 leading-tight">İnanılmaz Bir Dikkat!</h2>
               <p className="text-2xl font-bold text-amber-800 mt-2">Gerçek bir Okuma Dedektifi olduğunu kanıtladın! 🌟</p>
            </div>
         </div>
      )}

      <div className="flex-1 w-full px-4">
        
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="max-w-xl mx-auto bg-white/95 p-8 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-20 relative text-center">
             <button onClick={()=>setView('teacher-login')} className="absolute top-4 right-4 w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg z-10"><BarChart3 /></button>
             
             <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-fuchsia-400 to-amber-400 rounded-full blur opacity-70 animate-pulse"></div>
                  <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white mb-4">
                     <Rocket className="text-sky-500 w-14 h-14" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 drop-shadow-sm tracking-tight text-center">Okuma Maceram</h1>
             </div>
             
             <div className="space-y-6">
                {savedProfile && rememberMe ? (
                   <div className="bg-sky-50 p-6 rounded-2xl border-4 border-sky-100 flex flex-col items-center">
                      <div className="text-4xl mb-2">👋</div>
                      <h2 className="text-2xl font-black text-sky-800">Hoş geldin, {savedProfile.studentName.split(' ')[0]}!</h2>
                      <button onClick={() => { setRememberMe(false); localStorage.removeItem('okumaMaceramProfile'); setStudentName(''); }} className="text-sm font-bold text-sky-500 mt-2 hover:underline">Farklı bir öğrenci misin? Çıkış yap.</button>
                   </div>
                ) : (
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
                )}

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
                   <input type="text" value={customTopic} onChange={e=>setCustomTopic(e.target.value)} className="w-full p-4 border-4 border-sky-200 rounded-xl mb-4 font-bold" placeholder="Veya başka bir konu yaz..." />
                   
                   <label className="block text-lg font-black text-sky-800 mb-2">Okuma Seviyesi:</label>
                   <div className="flex gap-2">
                      {[{id:'1', l:'Kolay'}, {id:'2', l:'Orta'}, {id:'3', l:'Zor'}].map(lvl => (
                        <button key={lvl.id} onClick={() => setLevel(lvl.id)} className={`flex-1 py-3 rounded-xl font-black ${level === lvl.id ? 'bg-amber-400 text-amber-900' : 'bg-white text-sky-700'}`}>{lvl.l}</button>
                      ))}
                   </div>
                </div>

                {!savedProfile && (
                  <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-3 bg-white p-3 rounded-xl border-4 border-sky-100 cursor-pointer justify-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-4 ${rememberMe ? 'bg-fuchsia-500 border-fuchsia-500' : 'bg-white border-sky-300'}`}>{rememberMe && <Check className="text-white" />}</div>
                    <span className="text-sky-800 font-black">Beni bu cihazda hatırla</span>
                  </div>
                )}

                <div className="space-y-4">
                   <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-2xl font-black border-b-8 border-sky-700 shadow-xl">HİKAYEMİ OLUŞTUR ✨</button>
                   {/* YENİ HIZLI OKUMA AKADEMİSİ GİRİŞİ */}
                   <button onClick={() => { if (!validateStudent()) return; setLoginError(''); setView('academy-menu'); }} className="w-full bg-indigo-500 text-white py-4 rounded-2xl text-xl font-black border-b-8 border-indigo-700 shadow-xl flex items-center justify-center gap-3">
                     <Eye /> HIZLI OKUMA AKADEMİSİ
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- YENİ AKADEMİ EKRANLARI --- */}
        {view === 'academy-menu' && (
          <div className="max-w-4xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-indigo-300 mt-20 text-center">
             <button onClick={() => setView('student-setup')} className="absolute top-8 right-8 bg-slate-100 p-3 rounded-full text-slate-600 hover:bg-slate-200"><X /></button>
             <h2 className="text-4xl font-black text-indigo-600 mb-4 flex items-center justify-center gap-3"><Eye /> Hızlı Okuma Akademisi</h2>
             <p className="text-xl font-bold text-slate-500 mb-10">Profesyonel göz eğitim simülatörü. Aşama aşama ilerle!</p>
             
             <div className="grid md:grid-cols-2 gap-6">
                <button onClick={() => { setWarmupTime(30); setView('academy-warmup'); }} className="p-8 bg-sky-50 border-4 border-sky-200 rounded-[2rem] hover:bg-sky-100 transition-all text-left relative overflow-hidden group">
                   <h3 className="text-2xl font-black text-sky-800 mb-2">1. Isınma (Sarkaç)</h3>
                   <p className="font-bold text-sky-600">Göz kaslarını esnetir. (30sn)</p>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 text-5xl group-hover:scale-110 transition-transform"><Unlock /></div>
                </button>

                <button onClick={() => academyLevel >= 2 ? startSchulte() : null} className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all ${academyLevel >= 2 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                   <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 2 ? 'text-emerald-800' : 'text-slate-500'}`}>2. Schulte Tablosu</h3>
                   <p className={`font-bold ${academyLevel >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>Çevresel görüşünü geliştirir.</p>
                   <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 2 ? 'text-emerald-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 2 ? <Unlock /> : <Lock />}</div>
                </button>

                <button onClick={() => academyLevel >= 3 ? startFlash() : null} className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all ${academyLevel >= 3 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                   <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 3 ? 'text-amber-800' : 'text-slate-500'}`}>3. Flaş Kelimeler</h3>
                   <p className={`font-bold ${academyLevel >= 3 ? 'text-amber-600' : 'text-slate-400'}`}>Fotoğrafik algını hızlandırır.</p>
                   <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 3 ? 'text-amber-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 3 ? <Unlock /> : <Lock />}</div>
                </button>

                <button onClick={() => academyLevel >= 4 ? startMetronome() : null} className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all ${academyLevel >= 4 ? 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                   <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 4 ? 'text-fuchsia-800' : 'text-slate-500'}`}>4. Metronomlu Okuma</h3>
                   <p className={`font-bold ${academyLevel >= 4 ? 'text-fuchsia-600' : 'text-slate-400'}`}>Ritmik blok okuma simülatörü.</p>
                   <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 4 ? 'text-fuchsia-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 4 ? <Unlock /> : <Lock />}</div>
                </button>
             </div>
          </div>
        )}

        {view === 'academy-warmup' && (
          <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center min-h-[50vh] relative">
             <button onClick={() => { setView('academy-menu'); }} className="absolute -top-12 left-0 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg border-4 border-indigo-100 hover:bg-indigo-50">
                <ArrowLeft /> Geri Dön
             </button>
             <h2 className="text-3xl font-black text-white bg-sky-500 px-8 py-3 rounded-full mb-12 shadow-lg">Kafanı çevirme, topu sadece gözünle takip et!</h2>
             <div className="text-5xl font-black text-sky-800 mb-8">{warmupTime}</div>
             
             {/* Sarkaç Animasyon Alanı */}
             <div className="w-full h-32 flex items-center justify-center bg-white/50 rounded-full border-8 border-white shadow-inner overflow-hidden relative">
                <div className="w-16 h-16 bg-rose-500 rounded-full shadow-lg animate-pendulum absolute"></div>
             </div>
          </div>
        )}

        {view === 'academy-schulte' && (
          <div className="max-w-2xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-200">
             <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-emerald-600 p-4 rounded-full shadow-xl border-4 border-emerald-100 hover:bg-emerald-50"><ArrowLeft /></button>
             <h2 className="text-3xl font-black text-emerald-600 mb-4">Schulte Tablosu</h2>
             <p className="text-xl font-bold text-emerald-800 mb-8">Gözünü ortadan ayırmadan sırayla 1'den 9'a kadar tıkla. <br/> Sıradaki: <span className="text-4xl text-rose-500">{schulteExpected}</span></p>
             
             <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto">
                {schulteGrid.map((num, i) => (
                   <button key={i} onClick={() => handleSchulteClick(num)} 
                           className={`h-24 text-4xl font-black rounded-2xl shadow-sm transition-all border-4 ${num < schulteExpected ? 'bg-emerald-100 text-emerald-400 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-95'}`}>
                      {num}
                   </button>
                ))}
             </div>
          </div>
        )}

        {view === 'academy-flash' && (
          <div className="max-w-3xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 min-h-[400px]">
             <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft /></button>
             <h2 className="text-3xl font-black text-amber-600 mb-2">Flaş Kelimeler</h2>
             <p className="text-xl font-bold text-slate-500 mb-8">Ekranda parlayan kelimeyi zihnine kazı!</p>
             
             {flashMessage && <div className="text-2xl font-black text-emerald-500 mb-8">{flashMessage}</div>}

             {isFlashShowing ? (
                <div className="text-7xl font-black text-slate-800 tracking-tight my-10">{flashWordsData[flashStage].w}</div>
             ) : (
                !flashMessage && (
                  <div className="w-full">
                     <p className="text-2xl font-black text-amber-800 mb-8">Az önce ne gördün?</p>
                     <div className="grid grid-cols-3 gap-4">
                        {flashWordsData[flashStage].o.map((opt, i) => (
                           <button key={i} onClick={() => handleFlashAnswer(opt, flashWordsData[flashStage].w)} className="p-6 bg-amber-50 border-4 border-amber-200 rounded-2xl text-2xl font-black text-amber-700 hover:bg-amber-100 active:scale-95 transition-transform">{opt}</button>
                        ))}
                     </div>
                  </div>
                )
             )}
          </div>
        )}

        {view === 'academy-metronome' && (
          <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 min-h-[500px]">
             <button onClick={() => { setView('academy-menu'); setMetronomeIndex(-1); }} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft /></button>
             
             {metronomeIndex < metronomeChunks.length ? (
               <>
                 <div className="w-full max-w-sm mb-12 bg-fuchsia-50 p-4 rounded-2xl border-4 border-fuchsia-100">
                    <label className="block text-lg font-black text-fuchsia-800 mb-2">Metronom Hızı: {metronomeBPM} BPM</label>
                    <input type="range" min="30" max="150" step="10" value={metronomeBPM} onChange={(e) => setMetronomeBPM(Number(e.target.value))} className="w-full accent-fuchsia-600" />
                 </div>
                 <div className="h-64 flex items-center justify-center">
                    <span className="text-6xl md:text-8xl font-black text-fuchsia-800 tracking-tight">{metronomeChunks[metronomeIndex]}</span>
                 </div>
               </>
             ) : (
               <div className="space-y-6">
                  <h2 className="text-4xl font-black text-emerald-600">Mükemmel Odaklanma! 🎉</h2>
                  <p className="text-2xl font-bold text-emerald-800">Metronom ritmi geriye dönüşleri engeller.</p>
                  <button onClick={() => setView('academy-menu')} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl text-2xl font-black shadow-lg hover:scale-105">Akademiye Dön</button>
               </div>
             )}
          </div>
        )}

        {/* --- DİĞER EKRANLAR (HİKAYE OKUMA, SONUÇ VS.) AYNEN KORUNDU --- */}
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
          <div className="max-w-4xl mx-auto mt-12 space-y-8 relative">
             {isReadingFinished && storyData?.treasureHunt && (
               <div className="sticky top-4 z-40 bg-amber-100/95 backdrop-blur-md border-4 border-amber-300 p-4 md:p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-10 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="bg-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-inner">
                        <Search className="text-amber-500 w-8 h-8 md:w-10 md:h-10" />
                     </div>
                     <div>
                        <h4 className="font-black text-amber-900 text-xl md:text-2xl">Dedektif Görevi!</h4>
                        <p className="font-bold text-amber-700 text-md md:text-lg">{storyData.treasureHunt.task}</p>
                     </div>
                  </div>
                  <div className="bg-white px-6 py-2 rounded-2xl border-4 border-amber-200 font-black text-amber-600 text-3xl md:text-4xl text-center shadow-inner">
                     {foundWords.length} / {storyData.treasureHunt.targetWords.length}
                  </div>
               </div>
             )}

             <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative mt-8">
                <div className="absolute -top-6 right-6 z-10">
                    <button onClick={() => setShowHeceler(!showHeceler)} 
                            className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-black flex items-center gap-2 transition-all duration-300 shadow-xl border-4 border-fuchsia-400 ${showHeceler ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)]' : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 animate-pulse'}`}>
                      <Sparkles size={20} />
                      HECEMATİK {showHeceler ? 'AÇIK' : 'KAPALI'}
                    </button>
                </div>
                <p className="text-xl md:text-3xl leading-relaxed md:leading-[4rem] font-bold text-slate-800 whitespace-pre-wrap mt-4 cursor-default">
                   {renderStoryText()}
                </p>
             </div>

             {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-6 rounded-full text-4xl font-black shadow-lg hover:bg-emerald-400 active:scale-95 transition-all">BİTİRDİM! 🎉</button>}
             
             {isReadingFinished && (
               <div className="space-y-8">
                 <div className="bg-white p-8 rounded-[2rem] border-8 border-fuchsia-300 space-y-8">
                   <h2 className="text-3xl font-black text-fuchsia-600 text-center">Soruları Cevapla 🧠</h2>
                   {storyData.questions.map((q, idx) => (
                     <div key={q.id} className="bg-fuchsia-50 p-6 rounded-2xl border-4 border-fuchsia-100">
                       <h3 className="text-2xl font-black text-fuchsia-900 mb-4">{idx+1}. {q.q}</h3>
                       <div className="flex flex-col gap-3">
                          {q.options.map((opt, optIdx) => (
                            <button key={optIdx} onClick={() => setAnswers({...answers, [q.id]: optIdx})} className={`p-4 rounded-xl font-bold text-lg text-left transition-all ${answers[q.id] === optIdx ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'bg-white text-fuchsia-700 hover:bg-fuchsia-100'}`}>{opt}</button>
                          ))}
                       </div>
                     </div>
                   ))}
                   <button onClick={checkAnswers} disabled={Object.keys(answers).length < 2} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black border-b-8 border-sky-700 disabled:opacity-50 disabled:border-b-0 disabled:translate-y-2 hover:bg-sky-400 transition-all">KARNEMİ GÖSTER 🏆</button>
                 </div>
               </div>
             )}
          </div>
        )}

        {view === 'evaluating' && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center">
             {isUploading ? (
               <>
                 <Loader2 className="w-24 h-24 text-sky-500 animate-spin mx-auto mb-6" />
                 <h2 className="text-3xl font-black text-sky-600">Sesin Öğretmenine Uçuyor... 🚀</h2>
               </>
             ) : (
               <>
                 <Loader2 className="w-20 h-20 text-emerald-500 animate-spin mx-auto mb-6" />
                 <h2 className="text-3xl font-black text-emerald-600">Okuman Değerlendiriliyor... 🌟</h2>
               </>
             )}
          </div>
        )}

        {view === 'result' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-12 text-center space-y-8">
             <h2 className="text-4xl font-black text-sky-600">Tebrikler {readingResult.name.split(' ')[0]}!</h2>
             <div className="bg-indigo-50 p-8 rounded-3xl font-bold text-indigo-900 text-xl relative shadow-inner">
                "{readingResult.aiEvaluation.geribildirim}"
                <button onClick={() => {
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const msg = new SpeechSynthesisUtterance(readingResult.aiEvaluation.geribildirim);
                        msg.lang = 'tr-TR';
                        msg.rate = 0.9;
                        window.speechSynthesis.speak(msg);
                    } else { alert("Tarayıcınız sesli okumayı desteklemiyor."); }
                }} className="absolute -top-6 -right-6 bg-amber-400 text-amber-900 p-4 rounded-full shadow-xl hover:bg-amber-300 transition-transform active:scale-95 animate-bounce" title="Sesli Dinle">
                    <Volume2 size={28} />
                </button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm font-bold"><span className="text-amber-500 text-3xl block">{readingResult.wpm}</span> Hız (wpm)</div>
                <div className="bg-white p-4 rounded-xl shadow-sm font-bold"><span className="text-emerald-500 text-3xl block">{readingResult.compScore}/2</span> Doğru</div>
             </div>
             <button onClick={()=>{setView('student-setup')}} className="w-full bg-sky-500 text-white py-5 rounded-2xl text-2xl font-black shadow-lg">YENİDEN OYNA 🎮</button>
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
                  <div className="bg-white p-6 rounded-2xl border-4 border-emerald-100 mb-6 shadow-sm overflow-x-auto">
                    <h4 className="font-black text-emerald-800 mb-8 text-center">Okuma Hızı Gelişim Grafiği (WPM)</h4>
                    {(() => {
                      const studentStats = [...stats].filter(r => r.name === selectedStudentForProgress).reverse();
                      if (studentStats.length === 0) return <div className="text-center text-emerald-600 font-bold">Grafik oluşturulacak veri yok.</div>;
                      
                      const allWpm = studentStats.map(s => Number(s.wpm) || 0);
                      const maxWpm = Math.max(...allWpm, 50) + 10; 
                      const chartHeight = 200;
                      const pointWidth = 80; 
                      const chartWidth = Math.max(studentStats.length * pointWidth, 600);
                      
                      const points = studentStats.map((row, idx) => {
                         const x = idx * pointWidth + 40; 
                         const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight;
                         return `${x},${y}`;
                      }).join(" ");

                      return (
                         <div className="w-full overflow-x-auto pb-4">
                           <svg width={chartWidth} height={chartHeight + 40} className="mx-auto block">
                             <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="2" />
                             <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="5,5" />
                             <polyline points={points} fill="none" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" className="drop-shadow-sm" />
                             {studentStats.map((row, idx) => {
                                const x = idx * pointWidth + 40;
                                const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight;
                                return (
                                  <g key={idx} className="group">
                                    <circle cx={x} cy={y} r="20" fill="transparent" className="cursor-pointer" />
                                    <circle cx={x} cy={y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" className="group-hover:r-[8px] transition-all cursor-pointer shadow-sm" />
                                    <text x={x} y={y - 15} textAnchor="middle" className="text-[14px] font-black fill-emerald-700">{row.wpm}</text>
                                    <text x={x} y={chartHeight + 25} textAnchor="middle" className="text-[10px] font-bold fill-slate-400">{row.date?.split(' - ')[0]}</text>
                                  </g>
                                );
                             })}
                           </svg>
                         </div>
                       );
                    })()}
                  </div>
                )}

                {selectedStudentForProgress ? (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-emerald-600 mb-4">📈 {selectedStudentForProgress} - Geçmiş Okumaları</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-emerald-50 rounded-2xl">
                        <thead>
                           <tr className="border-b-4 border-emerald-100">
                             <th className="p-4">Tarih - Saat</th>
                             <th className="p-4">Konu</th>
                             <th className="p-4 text-center">Hız (wpm)</th>
                             <th className="p-4 text-center">Skor</th>
                             <th className="p-4 text-center">Ses Kaydı</th>
                             <th className="p-4 text-center">İşlem</th>
                           </tr>
                        </thead>
                        <tbody>
                          {stats.filter(r => r.name === selectedStudentForProgress).map(row => (
                            <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900 hover:bg-emerald-100/50 transition-colors">
                              <td className="p-4">{row.date || 'Belirtilmedi'}</td>
                              <td className="p-4">{row.interest}</td>
                              <td className="p-4 text-center">{row.wpm}</td>
                              <td className="p-4 text-center">{row.compScore}/2 {row.badge}</td>
                              <td className="p-4 text-center">
                                {row.audioUrl ? <audio src={row.audioUrl} controls className="h-10 w-full max-w-[200px] mx-auto shadow-sm rounded-full" /> : <span className="text-slate-400 text-sm bg-slate-100 px-3 py-1 rounded-full">Yok</span>}
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
                           <th className="p-4">Tarih - Saat</th>
                           <th className="p-4">Konu</th>
                           <th className="p-4 text-center">Hız (wpm)</th>
                           <th className="p-4 text-center">Skor</th>
                           <th className="p-4 text-center">Ses Kaydı</th>
                           <th className="p-4 text-center">İşlem</th>
                         </tr>
                       </thead>
                       <tbody>
                         {stats.map(row => (
                           <tr key={row.id} className="border-b-2 border-white font-bold text-emerald-900 hover:bg-emerald-100/50 transition-colors">
                             <td className="p-4">{row.name}</td>
                             <td className="p-4 text-sm text-emerald-700">{row.date || 'Belirtilmedi'}</td>
                             <td className="p-4">{row.interest}</td>
                             <td className="p-4 text-center">{row.wpm}</td>
                             <td className="p-4 text-center">{row.compScore}/2 {row.badge}</td>
                             <td className="p-4 text-center">
                               {row.audioUrl ? <audio src={row.audioUrl} controls className="h-10 w-full max-w-[200px] mx-auto shadow-sm rounded-full" /> : <span className="text-slate-400 text-sm bg-slate-100 px-3 py-1 rounded-full">Yok</span>}
                             </td>
                             <td className="p-4 text-center">
                               <button onClick={() => handleDeleteStat(row.id)} className="bg-rose-100 text-rose-600 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Kaydı Sil">
                                 <X size={18} />
                               </button>
                             </td>
                           </tr>
                         ))}
                         {stats.length === 0 && (
                            <tr><td colSpan="7" className="p-4 text-center text-emerald-600 font-bold">Henüz hiç okuma yapılmadı.</td></tr>
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
