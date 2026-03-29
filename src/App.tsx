import React, { useState, useEffect, useRef } from 'react';
import { 
  User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, 
  Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, 
  Loader2, Sparkles, Settings, Camera, TrendingUp, Award, 
  X, Flame, Users, Search, Eye, Lock, Unlock, Trash2, Plus, 
  Activity, Calendar, Printer, Gift 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, deleteDoc, collection, 
  addDoc, updateDoc, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- FİREBASE YAPILANDIRMASI (Cıvıl Cıvıl ve Pofuduk Tasarım İçin) ---
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

const PREDEFINED_TOPICS = [
  'Uzay 🪐', 'Dinozor 🦖', 'Kedi 🐱', 'Araba 🏎️', 'Prenses 👑', 
  'Robot 🤖', 'Masal Dünyası 🧚', 'Doğa 🌳', 'Dostluk 🤝'
];

// --- DİNAMİK AKADEMİ KELİME HAVUZU (Pofuduk Kartlar İçin) ---
const WORD_POOL = {
  level1: ["Ali", "Top", "Bak", "Al", "Oya", "Işık", "Nil", "Ece", "Baba", "Anne", "Kedi", "Süt", "Elma", "Okul", "Su", "Et"],
  level2: ["Kalem", "Kitap", "Silgi", "Defter", "Sınıf", "Sıra", "Çanta", "Oyun", "Park", "Bahçe", "Çiçek", "Ağaç", "Limon", "Balon"],
  level3: ["Gözlük", "Bisiklet", "Dondurma", "Kırmızı", "Gökyüzü", "Arkadaş", "Öğrenci", "Öğretmen", "Eğlence", "Kelebek", "Gökkuşağı"]
};

const DEFAULT_CLASS_LIST = [
  'BARAN LEVENT', 'ÜMRAN ELMAMO', 'MİRAÇ DEMİRTAŞ', 'AKIN ADLIM', 'ASYA MUNGAN', 'AVZEM BAHADIR', 
  'AZRA BAĞLAN', 'AZRA KINU', 'BAHAR YILMAZÇELİK', 'BERFİN SÖNMEZ', 'CEREN EROL', 'ELA EROL', 
  'ESLEM EROL', 'GÖKHAN MUNGAN', 'HACİ VİLKİN', 'LATİFE KAYURGA', 'MİRA DEMİRTAŞ', 
  'MİRAÇ YILMAZÇELİK', 'SENA MUNGAN', 'TALHA LEVENT', 'UMUT EROL'
];

export default function App() {
  // --- TEMEL DURUMLAR (STATES) ---
  const [view, setView] = useState('student-setup'); 
  const [stats, setStats] = useState([]); 
  const [students, setStudents] = useState([]); 
  const [activeHomework, setActiveHomework] = useState(null);
  
  // Öğretmen Paneli Durumları (Zümrüt Yeşili Tema)
  const [teacherTab, setTeacherTab] = useState('radar');
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);
  const [hwText, setHwText] = useState('');
  const [hwDeadline, setHwDeadline] = useState('');
  const [hwQuestions, setHwQuestions] = useState([{ q: '', options: ['', '', ''], correct: 0 }]);
  const [hwTopic, setHwTopic] = useState('');
  const [hwLevel, setHwLevel] = useState('1');
  const [isGeneratingHw, setIsGeneratingHw] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState('');
  const [actualTeacherPassword, setActualTeacherPassword] = useState('1234'); 
  const [newTeacherPasswordInput, setNewTeacherPasswordInput] = useState(''); 
  const [teacherPassword, setTeacherPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('1234');
  const [editingPasswords, setEditingPasswords] = useState({});

  // Öğrenci Profil ve Okuma Durumları (Cıvıl Cıvıl Tema)
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🐶'); 
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const [showTeacherStarGift, setShowTeacherStarGift] = useState(false);
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
  const [loginError, setLoginError] = useState(''); 
  const [micError, setMicError] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [academyLevel, setAcademyLevel] = useState(1);
  const [teacherStars, setTeacherStars] = useState(0);
  
  // Ses ve Animasyon Durumları
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); 
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showHeceler, setShowHeceler] = useState(false);
  const [foundWords, setFoundWords] = useState([]);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [badgeInCorner, setBadgeInCorner] = useState(false);

  // --- AKADEMİ DURUMLARI (Dojo Teması) ---
  const [warmupTime, setWarmupTime] = useState(30);
  const [schulteGrid, setSchulteGrid] = useState([]);
  const [schulteExpected, setSchulteExpected] = useState(1);
  const [flashStage, setFlashStage] = useState(0);
  const [isFlashShowing, setIsFlashShowing] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [flashSpeed, setFlashSpeed] = useState(1500); 
  const [currentFlashWord, setCurrentFlashWord] = useState({w:"", o:[]});
  const [metronomeBPM, setMetronomeBPM] = useState(60); 
  const [metronomeIndex, setMetronomeIndex] = useState(-1);
  const [metronomeChunks, setMetronomeChunks] = useState([]);
  const metronomeText = "Bir varmış bir yokmuş. Küçük bir çocuk ormanda gezerken kocaman bir ağaç görmüş. Ağacın dallarında kırmızı elmalar parlıyormuş. Çocuk elmalardan birini alıp afiyetle yemiş.";

  // RÜTBE İSİMLERİ (Konsept 3: Dedektiflik)
  const RANKS = [
    { lvl: 1, name: "Harf İzicisi", icon: "👣" },
    { lvl: 2, name: "Hece Kâşifi", icon: "🛶" },
    { lvl: 3, name: "Kelime Avcısı", icon: "🦅" },
    { lvl: 4, name: "Hikâye Ustası", icon: "📜" }
  ];

  // --- USE EFFECTS (Bileşen Yüklemeleri ve Veritabanı Dinleyicileri) ---
  useEffect(() => {
    const initAuth = async () => {
      try { 
        await signInAnonymously(auth); 
      } catch (error) { 
        console.error(error); 
      }
    };
    initAuth();
    
    const localProfile = localStorage.getItem('okumaMaceramProfile');
    if (localProfile) {
      try {
        const d = JSON.parse(localProfile);
        setStudentName(d.studentName); 
        setStudentPassword(d.studentPassword);
        setAcademyLevel(d.academyLevel || 1); 
        setRememberMe(true);
      } catch (e) {}
    }
    
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // İstatistikleri Dinle
    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snap) => {
      const data = []; 
      snap.forEach(doc => data.push({id: doc.id, ...doc.data()}));
      setStats(data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));
    });

    // Öğrencileri Dinle
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsRef, (snap) => {
      const data = []; 
      snap.forEach(doc => data.push({id: doc.id, ...doc.data()}));
      setStudents(data.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
    });

    // Ödevi Dinle ve Süre Kontrolü Yap
    const hwRef = doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current');
    const unsubscribeHw = onSnapshot(hwRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.deadline && new Date() > new Date(data.deadline)) { 
           deleteDoc(hwRef); 
           setActiveHomework(null); 
        } else { 
           setActiveHomework(data); 
        }
      } else {
        setActiveHomework(null);
      }
    });

    // Öğretmen Ayarlarını Dinle
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin');
    const unsubscribeSettings = onSnapshot(settingsRef, (snap) => { 
      if (snap.exists() && snap.data().password) {
        setActualTeacherPassword(snap.data().password); 
      }
    });

    return () => { 
      unsubscribeStats(); 
      unsubscribeStudents(); 
      unsubscribeHw(); 
      unsubscribeSettings(); 
    };
  }, [user]);

  // Hediye Yıldız Kontrolü (Öğrenci profiline özel)
  useEffect(() => {
    if (studentName) {
      const matched = students.find(s => s.name === studentName);
      if (matched) {
        setTeacherStars(matched.teacherStars || 0);
        if (matched.hasNewGift) {
          setShowTeacherStarGift(true);
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', matched.id), { hasNewGift: false });
        }
      }
    }
  }, [studentName, students]);

  // --- YARDIMCI FONKSİYONLAR ---

  const showTeacherMessageLocal = (msg) => { 
    setTeacherMsg(msg); 
    setTimeout(() => setTeacherMsg(''), 4000); 
  };

  // İnsansı Seslendirme
  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'tr-TR'; 
      msg.rate = 0.85; 
      msg.pitch = 1.3; // Şefkatli, ince ton
      window.speechSynthesis.speak(msg);
    }
  };

  // Seviye Güncelleme (Akademi Rütbesi)
  const updateAcademyLevel = async (newLevel, forceStudentId = null) => {
    if (forceStudentId) {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', forceStudentId), { academyLevel: newLevel });
       showTeacherMessageLocal('✅ Seviye güncellendi!'); 
       return;
    }
    if (newLevel > academyLevel) {
      setAcademyLevel(newLevel);
      const matched = students.find(s => s.name === studentName);
      if (matched) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', matched.id), { academyLevel: newLevel });
      }
      const localData = JSON.parse(localStorage.getItem('okumaMaceramProfile') || '{}');
      localData.academyLevel = newLevel; 
      localStorage.setItem('okumaMaceramProfile', JSON.stringify(localData));
    }
  };

  // Flaş Kelime Havuzundan Seçim
  const triggerFlashWord = () => {
    const pool = flashStage === 0 ? WORD_POOL.level1 : flashStage === 1 ? WORD_POOL.level2 : WORD_POOL.level3;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const options = [
      target, 
      pool[Math.floor(Math.random() * pool.length)], 
      pool[Math.floor(Math.random() * pool.length)]
    ].sort(() => Math.random() - 0.5);
    
    setCurrentFlashWord({w: target, o: options});
    setIsFlashShowing(true);
    setTimeout(() => setIsFlashShowing(false), flashSpeed); 
  };

  // Adaptif Gemini Motoru (Metin Üretimi)
  const callGeminiAPI = async (topic, selectedLevel, avgWpm, avgScore) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const prompt = `Konu: "${topic}". Seviye: ${selectedLevel}. Öğrenci hızı ${avgWpm} WPM, skor ${avgScore}/2. 1. sınıf pedagojisine uygun hikaye, sorular ve gizli kelime bulmacası üret. JSON formatında cevap ver.`;
    
    const res = await fetch(url, { 
      method: 'POST', 
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { responseMimeType: "application/json" } 
      }) 
    });
    
    const data = await res.json(); 
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  // Adaptif Gemini Motoru (Değerlendirme)
  const evaluateReadingWithAI = async (text, time, wpm, score, max, audio) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const prompt = `Metin: "${text}". Hız: ${wpm}. Skor: ${score}/${max}. Şefkatli geri bildirim yaz. JSON: { geribildirim: "..." }`;
    try {
      const res = await fetch(url, { 
        method: 'POST', 
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          generationConfig: { responseMimeType: "application/json" } 
        }) 
      });
      const data = await res.json(); 
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch(e) { 
      return { geribildirim: "Harika bir okuma! 🌟" }; 
    }
  };

  // Okuma Başlatma
  const startReadingSession = async (currentInterest, currentLevel, isHomework) => {
    setInterest(currentInterest); 
    setLevel(currentLevel); 
    setAnswers({}); 
    setFoundWords([]); 
    setView('reading-ready');
    
    const studentPastStats = stats.filter(s => s.name === studentName);
    const avgW = studentPastStats.length > 0 ? Math.round(studentPastStats.reduce((a, c) => a + (Number(c.wpm) || 0), 0) / studentPastStats.length) : 0;
    const avgS = studentPastStats.length > 0 ? studentPastStats.reduce((a, c) => a + (Number(c.compScore) || 0), 0) / studentPastStats.length : 0;
    
    if (isHomework) {
      setStoryData(activeHomework);
    } else {
      setIsGeneratingStory(true);
      try { 
        const aiData = await callGeminiAPI(currentInterest, currentLevel, avgW, avgS); 
        setStoryData(aiData); 
      } catch (err) { 
        setLoginError("Sunucu yoğun, sonra deneyin."); 
        setView('student-setup'); 
      } finally { 
        setIsGeneratingStory(false); 
      }
    }
  };

  // Zamanlayıcı ve Kayıt Başlatma
  const beginTimer = async (withRecording = false) => {
    if (withRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream); 
        mediaRecorderRef.current = mediaRecorder; 
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => { 
          if (e.data.size > 0) audioChunksRef.current.push(e.data); 
        };
        
        mediaRecorder.onstop = () => { 
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
          const reader = new FileReader(); 
          reader.readAsDataURL(audioBlob); 
          reader.onloadend = () => setAudioUrl(reader.result); 
        };
        
        mediaRecorder.start(); 
        setIsRecording(true);
      } catch (err) { 
        setMicError("Mikrofon hatası."); 
      }
    }
    setStartTime(Date.now()); 
    setView('reading-active');
  };

  // Okumayı Bitirme
  const finishReading = () => {
    if (isRecording && mediaRecorderRef.current) { 
      mediaRecorderRef.current.stop(); 
      setIsRecording(false); 
    }
    const timeSpentSeconds = (Date.now() - startTime) / 1000; 
    const wordCount = storyData.text.split(/\s+/).length;
    setTempStats({ 
      words: wordCount, 
      timeSeconds: Math.round(timeSpentSeconds), 
      wpm: Math.round((wordCount / timeSpentSeconds) * 60) 
    });
    setIsReadingFinished(true); 
  };

  // Cevapları Kontrol Etme
  const checkAnswers = () => {
    let correctCount = 0; 
    storyData.questions.forEach(q => { 
      if (answers[q.id] === q.correct) correctCount++; 
    });
    
    if (correctCount < storyData.questions.length && !hasRetried) { 
      setHasRetried(true); 
      setView('reading-active'); 
    } else {
      calculateFinalResultFull();
    }
  };

  // Nihai Sonucu ve Firebase Kaydını Hesaplama
  const calculateFinalResultFull = async () => {
    let correctCount = 0; 
    storyData.questions.forEach(q => { 
      if (answers[q.id] === q.correct) correctCount++; 
    });
    
    setView('evaluating'); 
    setIsEvaluating(true);
    let firebaseAudioUrl = null;
    
    if (audioChunksRef.current.length > 0) {
      setIsUploading(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const storageRefParam = ref(storage, `artifacts/${appId}/audio/${Date.now()}.webm`);
        await uploadBytes(storageRefParam, audioBlob); 
        firebaseAudioUrl = await getDownloadURL(storageRefParam);
      } catch(e) {} 
      setIsUploading(false);
    }
    
    const aiFeedback = await evaluateReadingWithAI(
      storyData.text, tempStats.timeSeconds, tempStats.wpm, correctCount, storyData.questions.length, audioUrl
    );
    
    const newResult = { 
      name: studentName, 
      interest: interest, 
      level: level, 
      words: tempStats.words, 
      wpm: tempStats.wpm, 
      compScore: correctCount, 
      maxScore: storyData.questions.length, 
      badge: (storyData.treasureHunt && foundWords.length === storyData.treasureHunt.targetWords.length) ? '🕵️‍♂️' : '', 
      audioUrl: firebaseAudioUrl, 
      aiEvaluation: aiFeedback, 
      date: new Date().toLocaleString('tr-TR'), 
      timestamp: serverTimestamp() 
    };
    
    setReadingResult(newResult); 
    setIsEvaluating(false); 
    setView('result');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult);
  };

  // Öğretmen İşlemleri
  const handleUpdatePassword = async (id, newPass) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), { password: newPass });
    showTeacherMessageLocal('✅ Şifre güncellendi!');
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`${name} silinsin mi?`)) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id));
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { 
      name: newStudentName, password: newStudentPassword, academyLevel: 1, teacherStars: 0 
    });
    setNewStudentName('');
  };

  const handleRemoveHomework = async () => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'));
    setActiveHomework(null);
  };

  const handlePublishHomework = async () => {
    const homeworkData = { 
      text: hwText, 
      questions: hwQuestions.map((q, i) => ({ id: i + 1, q: q.q, options: q.options, correct: q.correct })), 
      deadline: hwDeadline, 
      timestamp: serverTimestamp() 
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'), homeworkData);
    showTeacherMessageLocal("✅ Ödev gönderildi!");
  };

  // Metin Renderlama (Hazine Avı ve Hecematik)
  const renderStoryTextLocal = () => {
    if (!storyData || !storyData.text) return null;
    const targetWordsLower = (storyData.treasureHunt?.targetWords || []).map(w => w.toLowerCase('tr-TR'));
    
    return storyData.text.split(/(\s+)/).map((wordOrSpace, idx) => {
       if (!wordOrSpace.trim()) return <span key={idx}>{wordOrSpace}</span>; 
       
       const match = wordOrSpace.match(/^([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)([a-zA-ZğüşıöçĞÜŞİÖÇ]+)([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)$/);
       if (!match) return <span key={idx}>{wordOrSpace}</span>; 
       
       const before = match[1]; 
       const cleanWord = match[2]; 
       const after = match[3];
       const lowerCleanWord = cleanWord.toLowerCase('tr-TR');
       
       const isTarget = targetWordsLower.includes(lowerCleanWord);
       const isFound = foundWords.includes(lowerCleanWord);
       
       const handleWordClick = () => {
         if (!isReadingFinished || !isTarget || isFound) return; 
         
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
       };
       
       let textClass = (isReadingFinished && storyData.treasureHunt) 
         ? (isFound ? "bg-amber-300 text-amber-900 rounded-lg px-1 scale-110 shadow-sm transition-all inline-block" : "cursor-pointer hover:bg-sky-100 rounded-lg px-1 transition-all inline-block") 
         : "";
         
       let content = <span>{cleanWord}</span>;
       
       if (showHeceler) {
         const sesliler = 'aeıioöuüAEIİOÖUÜ'; 
         let heceler = []; 
         let kelimeKopya = cleanWord;
         
         while (kelimeKopya.length > 0) {
           let sesliIndex = -1; 
           for (let i = kelimeKopya.length - 1; i >= 0; i--) { 
             if (sesliler.includes(kelimeKopya[i])) { sesliIndex = i; break; } 
           }
           if (sesliIndex === -1) { 
             if (heceler.length > 0) heceler[0] = kelimeKopya + heceler[0]; 
             else heceler.unshift(kelimeKopya); 
             break; 
           }
           let heceBaslangici = sesliIndex; 
           if (sesliIndex > 0 && !sesliler.includes(kelimeKopya[sesliIndex - 1])) { heceBaslangici = sesliIndex - 1; }
           heceler.unshift(kelimeKopya.substring(heceBaslangici)); 
           kelimeKopya = kelimeKopya.substring(0, heceBaslangici);
         }
         content = <>{heceler.map((h, hi) => (<span key={hi} className={hi % 2 === 0 ? "text-rose-500" : "text-slate-800"}>{h}</span>))}</>;
       }
       return <span key={idx} onClick={handleWordClick} className={textClass}>{before}{content}{after}</span>;
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative pt-8 pb-12 overflow-x-hidden">
      
      {/* --- ANİMASYONLAR VE YAZDIRMA (PDF) STİLLERİ --- */}
      <style>{`
        @keyframes pendulum { 
          0% { transform: translateX(-35vw); } 
          50% { transform: translateX(35vw); } 
          100% { transform: translateX(-35vw); } 
        } 
        .animate-pendulum { 
          animation: pendulum 3s infinite ease-in-out; 
        } 
        @media print { 
          body * { visibility: hidden; } 
          #print-section, #print-section * { visibility: visible; } 
          #print-section { position: absolute; left: 0; top: 0; width: 100%; } 
        }
      `}</style>

      {/* --- ÜST PANEL: ÖĞRENCİ PROFİLİ TETİKLEYİCİ --- */}
      {!['teacher-login', 'teacher'].includes(view) && (
        <div className="absolute top-4 left-4 flex items-center gap-4 z-50">
           <button 
             onClick={() => setShowProfileModal(true)} 
             className="flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white hover:scale-105 transition-transform cursor-pointer"
           >
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl shadow-inner ring-2 ring-sky-200">
                {studentAvatar}
              </div>
              <span className="font-black text-sky-800 text-xl">
                {studentName ? studentName.split(' ')[0] : 'Giriş'}
              </span>
           </button>
           
           {badgeInCorner && (
             <div className="animate-pulse drop-shadow-2xl transition-all">
               <span className="text-5xl">🕵️‍♂️</span>
             </div>
           )}
        </div>
      )}

      {/* --- OYUNLAŞTIRILMIŞ ÖĞRENCİ PROFİL MODALI --- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sky-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative border-8 border-sky-200 animate-in zoom-in duration-300">
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="absolute top-4 right-4 bg-sky-100 p-2 rounded-full text-sky-600 hover:bg-sky-200 transition-colors"
              >
                <X />
              </button>
              
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full bg-sky-100 text-5xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-white">
                    {studentAvatar}
                 </div>
                 <h2 className="text-3xl font-black text-sky-800">
                   {studentName || 'Misafir Öğrenci'}
                 </h2>
                 
                 {/* MEVCUT RÜTBE KEMERİ */}
                 <div className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg flex items-center gap-2">
                    {RANKS[academyLevel-1].icon} {RANKS[academyLevel-1].name}
                 </div>
              </div>

              {/* RÜTBE VİTRİNİ (GÖLGELİ/KİLİTLİ) */}
              <div className="mt-8 grid grid-cols-4 gap-2">
                 {RANKS.map(r => (
                    <div 
                      key={r.lvl} 
                      className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                        academyLevel >= r.lvl 
                          ? 'bg-emerald-50 border-emerald-300 shadow-md' 
                          : 'bg-slate-50 border-slate-200 grayscale opacity-40'
                      }`}
                    >
                       <span className="text-2xl">{r.icon}</span>
                       {academyLevel < r.lvl && (
                         <Lock size={12} className="text-slate-400 mt-1" />
                       )}
                    </div>
                 ))}
              </div>

              <div className="mt-8 space-y-4">
                 <div className="bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100 flex items-center justify-between shadow-sm">
                    <div className="font-black text-emerald-800 flex items-center gap-2">
                      <BookOpen size={18}/> Kelime Kumbarası
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                       {stats.filter(s => s.name === studentName).reduce((acc, curr) => acc + (Number(curr.words) || 0), 0)}
                    </div>
                 </div>
                 
                 {teacherStars > 0 && (
                   <div className="bg-amber-50 p-4 rounded-2xl border-4 border-amber-200 flex items-center justify-between animate-pulse">
                      <div className="font-black text-amber-800 flex items-center gap-2">
                        <Star size={18}/> Öğretmen Yıldızları
                      </div>
                      <div className="text-2xl font-black text-amber-600">
                        x{teacherStars}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- ÖĞRETMEN YILDIZ HEDİYE ANİMASYONU --- */}
      {showTeacherStarGift && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-md">
            <div 
              className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-amber-300 text-center animate-bounce cursor-pointer" 
              onClick={() => setShowTeacherStarGift(false)}
            >
               <span className="text-9xl block mb-4">🎁</span>
               <h2 className="text-4xl font-black text-amber-600 leading-tight">Sürpriz Paketin Var!</h2>
               <p className="text-2xl font-bold text-amber-800 mt-2">Arif Öğretmenin sana bir yıldız gönderdi! 🌟</p>
               <button className="mt-8 bg-amber-500 text-white px-8 py-3 rounded-full font-black text-xl shadow-lg">
                 PAKETİ AÇ
               </button>
            </div>
         </div>
      )}

      {/* --- DEDEKTİF ROZETİ KAZANMA ANİMASYONU --- */}
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
        
        {/* ========================================== */}
        {/* 1. ANA GİRİŞ VE "KEŞİF HARİTASI" EKRANI     */}
        {/* ========================================== */}
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="max-w-5xl mx-auto mt-16 relative">
             
             {/* Yönetici Butonu */}
             <button 
               onClick={()=>setView('teacher-login')} 
               className="absolute -top-4 right-0 w-14 h-14 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-xl z-10 hover:bg-emerald-500 transition-colors"
             >
               <BarChart3 size={24} />
             </button>
             
             {/* Başlık */}
             <div className="flex flex-col items-center justify-center mb-12">
                <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] tracking-tight">
                  <span className="text-amber-300">OKUMA</span> MACERAM
                </h1>
             </div>
             
             {/* "Cıvıl Cıvıl" ve "Pofuduk" Harita İstasyonları (Grid Layout) 
                Mobilde alt alta (flex-col), bilgisayarda yan yana (md:grid-cols-3)
             */}
             <div className="grid md:grid-cols-3 gap-8 items-stretch">
                
                {/* İSTASYON 1: SINIF ÖDEVİ */}
                <div className="bg-emerald-50 p-8 rounded-[3rem] shadow-2xl border-8 border-emerald-300 flex flex-col relative transform hover:-translate-y-2 transition-transform duration-300">
                  {/* Saat Kulesi Görseli (Temsili İkonlar) */}
                  <div className="w-24 h-24 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-5xl">
                    🏫
                  </div>
                  <h3 className="text-2xl font-black text-emerald-800 text-center mb-2">BUGÜNÜN GÖREVİ:</h3>
                  <h2 className="text-3xl font-black text-emerald-600 text-center mb-6">SINIF ÖDEVİ</h2>
                  
                  <div className="mt-auto space-y-4">
                    <select 
                      value={studentName} 
                      onChange={e=>setStudentName(e.target.value)} 
                      className="w-full p-4 border-4 border-emerald-200 rounded-2xl font-bold bg-white outline-none text-emerald-900"
                    >
                      <option value="">İsmini Seç...</option>
                      {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    
                    <input 
                      type="password" 
                      value={studentPassword} 
                      onChange={e=>setStudentPassword(e.target.value)} 
                      className="w-full p-4 border-4 border-emerald-200 rounded-2xl text-center text-2xl tracking-[0.5em] font-bold outline-none text-emerald-900" 
                      placeholder="ŞİFRE" 
                      maxLength={4} 
                    />
                    
                    <button 
                      onClick={() => {
                        if (!studentName || !studentPassword) {
                          setLoginError('Sınıf Ödevi için ismini ve şifreni girmelisin.');
                          return;
                        }
                        if (activeHomework) {
                          startReadingSession('Sınıf Ödevi', 'Ödev', true);
                        } else {
                          setLoginError('Şu an aktif bir ödev yok!');
                        }
                      }}
                      className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all"
                    >
                      BAŞLAT 🚀
                    </button>
                    {loginError && <p className="text-rose-500 font-bold text-center mt-2">{loginError}</p>}
                  </div>
                </div>

                {/* İSTASYON 2: HİKAYE KEŞFİ (Merkez - En Belirgin) */}
                <div className="bg-amber-100 p-8 rounded-[3.5rem] shadow-2xl border-8 border-amber-300 flex flex-col relative transform md:-translate-y-6 hover:-translate-y-8 transition-transform duration-300 z-10">
                  {/* Roket ve Gezegenler Görseli */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 bg-white rounded-full shadow-inner"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce">
                      🚀
                    </div>
                    <span className="absolute -left-2 top-2 text-3xl animate-pulse">🦖</span>
                    <span className="absolute -right-2 top-4 text-3xl animate-pulse delay-75">🪐</span>
                    <span className="absolute bottom-0 right-0 text-3xl animate-pulse delay-150">👑</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-amber-800 text-center mb-2">BENİM SEÇİMİM:</h3>
                  <h2 className="text-4xl font-black text-amber-600 text-center mb-6">HİKAYE KEŞFİ</h2>
                  
                  <div className="mt-auto space-y-4">
                    <input 
                      type="text" 
                      value={customTopic} 
                      onChange={e=>setCustomTopic(e.target.value)} 
                      className="w-full p-4 border-4 border-amber-200 rounded-2xl font-bold text-amber-900 bg-white placeholder-amber-400 outline-none" 
                      placeholder="Konuyu buraya yaz..." 
                    />
                    
                    <div className="flex gap-2">
                      {[{id:'1', l:'Kolay'}, {id:'2', l:'Orta'}, {id:'3', l:'Zor'}].map(lvl => (
                        <button 
                          key={lvl.id} 
                          onClick={() => setLevel(lvl.id)} 
                          className={`flex-1 py-3 rounded-xl font-black transition-colors ${
                            level === lvl.id 
                              ? 'bg-amber-400 text-amber-900 border-2 border-amber-500' 
                              : 'bg-white text-amber-600 border-2 border-amber-200'
                          }`}
                        >
                          {lvl.l}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={async () => { 
                        if (!studentName || !studentPassword) { 
                          setLoginError('Hikaye üretmek için soldan ismini ve şifreni seçmelisin.'); 
                          return; 
                        } 
                        if (!customTopic) {
                          setLoginError('Lütfen bir konu yaz.'); 
                          return;
                        }
                        setLoginError('');
                        await startReadingSession(customTopic, level, false); 
                      }} 
                      className="w-full bg-amber-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-[0_0px_0_rgb(180,83,9)] transition-all"
                    >
                      ÜRET & OKU ✨
                    </button>
                  </div>
                </div>

                {/* İSTASYON 3: HIZLI OKUMA AKADEMİSİ */}
                <div className="bg-indigo-50 p-8 rounded-[3rem] shadow-2xl border-8 border-indigo-300 flex flex-col relative transform hover:-translate-y-2 transition-transform duration-300">
                  {/* Akademi Görseli */}
                  <div className="w-24 h-24 bg-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-5xl">
                    👁️
                  </div>
                  
                  <h2 className="text-3xl font-black text-indigo-700 text-center mb-6 leading-tight">
                    HIZLI OKUMA<br/>AKADEMİSİ
                  </h2>
                  
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-4 border-indigo-100 mb-6">
                    <div className="text-center">
                      <div className="text-sm font-bold text-indigo-400">Rütben</div>
                      <div className="text-lg font-black text-indigo-800">{RANKS[academyLevel-1].icon} Lvl {academyLevel}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-indigo-400">Durum</div>
                      <div className="text-lg font-black text-emerald-500">Açık</div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => { 
                        if(!studentName || !studentPassword) { 
                          setLoginError('Akademiye girmek için soldan ismini ve şifreni seçmelisin.'); 
                          return; 
                        } 
                        setLoginError('');
                        setView('academy-menu'); 
                      }} 
                      className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(67,56,202)] active:translate-y-2 active:shadow-[0_0px_0_rgb(67,56,202)] transition-all flex items-center justify-center gap-2"
                    >
                      GİRİŞ YAP 💪
                    </button>
                  </div>
                </div>

             </div>

             {/* Alt Kısım: Sonuç Özeti (Eğer önceden okuma yapıldıysa) */}
             {readingResult && (
               <div className="mt-12 max-w-sm mx-auto bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-lg border-4 border-white flex justify-center gap-8 animate-in slide-in-from-bottom-10">
                 <div className="font-black text-slate-700">WPM: <span className="text-amber-500">{readingResult.wpm}</span> 🔥</div>
                 <div className="font-black text-slate-700">Skor: <span className="text-emerald-500">{readingResult.compScore}/{readingResult.maxScore}</span> ⭐</div>
               </div>
             )}
          </div>
        )}

        {/* ========================================== */}
        {/* 2. AKADEMİ MENÜSÜ EKRANI                   */}
        {/* ========================================== */}
        {view === 'academy-menu' && (
          <div className="max-w-4xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-indigo-300 mt-20 text-center relative">
             <button 
               onClick={() => setView('student-setup')} 
               className="absolute top-6 right-6 bg-slate-100 p-3 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
             >
               <X size={24} />
             </button>
             
             <h2 className="text-4xl font-black text-indigo-600 mb-10 flex items-center justify-center gap-3">
               <Eye /> Hızlı Okuma Akademisi
             </h2>
             
             <div className="grid md:grid-cols-2 gap-6 text-left">
                {/* 1. SEVİYE: SARKAÇ */}
                <button 
                  onClick={() => { 
                    setView('academy-warmup-ready'); 
                    speakInstruction("Göz kaslarımızı esnetelim. Kafanı çevirmeden kırmızı topu takip et."); 
                  }} 
                  className="p-8 bg-sky-50 border-4 border-sky-200 rounded-[2rem] relative group transition-all hover:bg-sky-100 hover:shadow-md"
                >
                   <h3 className="text-2xl font-black text-sky-800 mb-1">1. Harf İzicisi 👣</h3>
                   <p className="font-bold text-sky-600 italic text-sm">Göz kaslarını esnetir. (Sarkaç)</p>
                   <Unlock className="absolute right-6 top-1/2 -translate-y-1/2 text-sky-300 group-hover:scale-110 transition-transform" size={32} />
                </button>

                {/* 2. SEVİYE: SCHULTE */}
                <button 
                  onClick={() => {
                    if (academyLevel >= 2) {
                      setSchulteGrid([...Array(9)].map((_,i)=>i+1).sort(()=>Math.random()-0.5));
                      setSchulteExpected(1); 
                      setView('academy-schulte-ready');
                      speakInstruction("Gözünü merkezden ayırma ve sayıları sırayla bul!");
                    }
                  }} 
                  className={`p-8 border-4 rounded-[2rem] relative transition-all ${
                    academyLevel >= 2 
                      ? 'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 hover:shadow-md group' 
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                   <h3 className={`text-2xl font-black mb-1 ${academyLevel >= 2 ? 'text-emerald-800' : 'text-slate-500'}`}>
                     2. Hece Kâşifi 🛶
                   </h3>
                   <p className={`font-bold italic text-sm ${academyLevel >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                     Geniş açıyla görmeyi öğretir.
                   </p>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl">
                     {academyLevel >= 2 ? <Unlock className="text-emerald-300 group-hover:scale-110 transition-transform" /> : <Lock className="text-slate-300" />}
                   </div>
                </button>

                {/* 3. SEVİYE: FLAŞ KELİMELER */}
                <button 
                  onClick={() => {
                    if (academyLevel >= 3) {
                      setFlashStage(0);
                      setView('academy-flash-ready');
                      speakInstruction("Şimdi flaş kelimeleri fotoğraf gibi çekme vakti!");
                    }
                  }} 
                  className={`p-8 border-4 rounded-[2rem] relative transition-all ${
                    academyLevel >= 3 
                      ? 'bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100 hover:shadow-md group' 
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                   <h3 className={`text-2xl font-black mb-1 ${academyLevel >= 3 ? 'text-amber-800' : 'text-slate-500'}`}>
                     3. Kelime Avcısı 🦅
                   </h3>
                   <p className={`font-bold italic text-sm ${academyLevel >= 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                     Kelimeleri bütün olarak yakalar.
                   </p>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl">
                     {academyLevel >= 3 ? <Unlock className="text-amber-300 group-hover:scale-110 transition-transform" /> : <Lock className="text-slate-300" />}
                   </div>
                </button>

                {/* 4. SEVİYE: METRONOM */}
                <button 
                  onClick={() => {
                    if (academyLevel >= 4) {
                      const wordsArray = metronomeText.split(/\s+/);
                      const chunkArray = []; 
                      for(let i=0; i<wordsArray.length; i+=2) {
                        chunkArray.push(wordsArray.slice(i, i+2).join(' '));
                      }
                      setMetronomeChunks(chunkArray); 
                      setMetronomeIndex(-1); 
                      setView('academy-metronome-ready'); 
                      speakInstruction("Ritmik ve akıcı okuma macerasına başla!");
                    }
                  }} 
                  className={`p-8 border-4 rounded-[2rem] relative transition-all ${
                    academyLevel >= 4 
                      ? 'bg-fuchsia-50 border-fuchsia-200 cursor-pointer hover:bg-fuchsia-100 hover:shadow-md group' 
                      : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                   <h3 className={`text-2xl font-black mb-1 ${academyLevel >= 4 ? 'text-fuchsia-800' : 'text-slate-500'}`}>
                     4. Hikâye Ustası 📜
                   </h3>
                   <p className={`font-bold italic text-sm ${academyLevel >= 4 ? 'text-fuchsia-600' : 'text-slate-400'}`}>
                     Ritmik ve akıcı okuma yapar.
                   </p>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl">
                     {academyLevel >= 4 ? <Unlock className="text-fuchsia-300 group-hover:scale-110 transition-transform" /> : <Lock className="text-slate-300" />}
                   </div>
                </button>
             </div>
          </div>
        )}

        {/* ========================================== */}
        {/* AKADEMİ EĞİTİM EKRANLARI                   */}
        {/* ========================================== */}

        {/* --- 1. SARKAÇ --- */}
        {view === 'academy-warmup-ready' && (
           <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative">
              <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-sky-600 p-4 rounded-full shadow-xl border-4 border-sky-100 hover:bg-sky-50"><ArrowLeft size={24} /></button>
              <h2 className="text-4xl font-black text-sky-600 mb-6">Isınma Zamanı!</h2>
              <p className="text-2xl font-bold text-sky-800 mb-8">Kafanı çevirmeden topu takip et!</p>
              
              <button 
                onClick={() => speakInstruction("Kafanı çevirmeden kırmızı topu takip et.")} 
                className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"
              >
                <Volume2 /> Yönergeyi Dinle
              </button>
              
              <button 
                onClick={() => { setWarmupTime(30); setView('academy-warmup-active'); }} 
                className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(3,105,161)] active:translate-y-2 active:shadow-[0_0px_0_rgb(3,105,161)] transition-all"
              >
                BAŞLA! 🚀
              </button>
           </div>
        )}

        {view === 'academy-warmup-active' && (
          <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center min-h-[50vh] relative">
             <button 
               onClick={() => setView('academy-menu')} 
               className="absolute -top-12 left-0 bg-white text-sky-600 px-6 py-3 rounded-2xl font-black shadow-lg border-4 border-sky-100 hover:bg-sky-50 flex items-center gap-2"
             >
               <ArrowLeft /> Geri Dön
             </button>
             
             <h2 className="text-3xl font-black text-white bg-sky-500 px-8 py-3 rounded-full mb-12 shadow-lg">
               Gözlerini Esnet!
             </h2>
             <div className="text-5xl font-black text-sky-800 mb-8">{warmupTime}</div>
             
             <div className="w-full h-32 flex items-center justify-center bg-white/50 rounded-full border-8 border-white shadow-inner overflow-hidden relative">
                <div className="w-16 h-16 bg-rose-500 rounded-full shadow-lg animate-pendulum absolute"></div>
             </div>
          </div>
        )}

        {/* --- 2. SCHULTE TABLOSU --- */}
        {view === 'academy-schulte-ready' && (
           <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-emerald-200 relative">
              <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-emerald-600 p-4 rounded-full shadow-xl border-4 border-emerald-100 hover:bg-emerald-50"><ArrowLeft size={24}/></button>
              <h2 className="text-4xl font-black text-emerald-600 mb-6">Dedektif Tablosu</h2>
              <p className="text-2xl font-bold text-emerald-800 mb-8">Gözün merkezde, sayıları sırayla bul!</p>
              
              <button 
                onClick={() => speakInstruction("Gözünü merkezden ayırma ve sayıları sırayla bul!")} 
                className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"
              >
                <Volume2 /> Dinle
              </button>
              
              <button 
                onClick={() => setView('academy-schulte-active')} 
                className="w-full bg-emerald-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all"
              >
                BAŞLA! 🚀
              </button>
           </div>
        )}

        {view === 'academy-schulte-active' && (
          <div className="max-w-2xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-200">
             <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-emerald-600 p-4 rounded-full shadow-xl border-4 border-emerald-100 hover:bg-emerald-50"><ArrowLeft size={24}/></button>
             
             <p className="text-xl font-bold text-emerald-800 mb-8">
               Sıradaki Sayı: <span className="text-4xl text-rose-500 bg-rose-100 px-4 py-2 rounded-xl shadow-inner inline-block ml-2">{schulteExpected}</span>
             </p>
             
             <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto">
                {schulteGrid.map((num, i) => (
                   <button 
                     key={i} 
                     onClick={() => {
                        if(num === schulteExpected) {
                          if(num === 9) {
                            updateAcademyLevel(3);
                            showTeacherMessageLocal("Harika! 3. Seviye Açıldı. 🔓");
                            setView('academy-menu');
                          } else {
                            setSchulteExpected(p => p + 1);
                          }
                        }
                     }} 
                     className={`h-24 text-4xl font-black rounded-2xl shadow-sm transition-all border-4 ${
                       num < schulteExpected 
                         ? 'bg-emerald-100 text-emerald-400 border-emerald-200' 
                         : 'bg-slate-50 text-slate-700 border-slate-200 active:scale-95 hover:bg-slate-100'
                     }`}
                   >
                      {num}
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* --- 3. FLAŞ KELİMELER --- */}
        {view === 'academy-flash-ready' && (
           <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 relative">
              <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft size={24}/></button>
              <h2 className="text-4xl font-black text-amber-600 mb-6">Flaş Kelimeler</h2>
              
              <div className="bg-amber-50 p-6 rounded-2xl border-4 border-amber-100 mb-8">
                 <p className="font-black text-amber-800 mb-4">Kendine uygun hızı seç:</p>
                 <div className="flex gap-2">
                    <button onClick={() => setFlashSpeed(2000)} className={`flex-1 py-3 rounded-xl font-black transition-colors ${flashSpeed === 2000 ? 'bg-emerald-400 text-white shadow-inner border-2 border-emerald-500' : 'bg-white text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-50'}`}>🐢 Yavaş</button>
                    <button onClick={() => setFlashSpeed(1000)} className={`flex-1 py-3 rounded-xl font-black transition-colors ${flashSpeed === 1000 ? 'bg-amber-400 text-white shadow-inner border-2 border-amber-500' : 'bg-white text-amber-600 border-2 border-amber-200 hover:bg-amber-50'}`}>🐇 Normal</button>
                    <button onClick={() => setFlashSpeed(600)} className={`flex-1 py-3 rounded-xl font-black transition-colors ${flashSpeed === 600 ? 'bg-rose-400 text-white shadow-inner border-2 border-rose-500' : 'bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50'}`}>🐆 Hızlı</button>
                 </div>
              </div>
              
              <button 
                onClick={() => speakInstruction("Şimdi flaş kelimeleri fotoğraf gibi çekme vakti! Hazırsan macerayı başlat!")} 
                className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"
              >
                <Volume2 /> Dinle
              </button>
              
              <button 
                onClick={() => { setView('academy-flash-active'); triggerFlashWord(); }} 
                className="w-full bg-amber-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-[0_0px_0_rgb(180,83,9)] transition-all"
              >
                BAŞLA! 🚀
              </button>
           </div>
        )}

        {view === 'academy-flash-active' && (
          <div className="max-w-3xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 min-h-[400px]">
             <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft size={24}/></button>
             
             {isFlashShowing ? (
                <div className="text-7xl md:text-9xl font-black text-slate-800 tracking-tight my-10 animate-in fade-in duration-150">
                  {currentFlashWord.w}
                </div>
             ) : (
                <div className="w-full animate-in zoom-in duration-300">
                   <p className="text-3xl font-black text-amber-800 mb-8">Az önce ne gördün?</p>
                   <div className="grid md:grid-cols-3 gap-6">
                      {currentFlashWord.o.map((opt, i) => (
                         <button 
                           key={i} 
                           onClick={() => {
                              if(opt === currentFlashWord.w) {
                                if(flashStage === 2) { 
                                  updateAcademyLevel(4); 
                                  showTeacherMessageLocal("Harika! 4. Seviye Açıldı. 🔓"); 
                                  setView('academy-menu'); 
                                }
                                else { 
                                  setFlashStage(p=>p+1); 
                                  triggerFlashWord(); 
                                }
                              } else { 
                                setFlashStage(0); 
                                triggerFlashWord(); 
                              }
                           }} 
                           className="p-8 bg-amber-50 border-4 border-amber-200 rounded-3xl text-3xl font-black text-amber-700 hover:bg-amber-100 active:scale-95 transition-transform shadow-sm"
                         >
                           {opt}
                         </button>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* --- 4. METRONOM --- */}
        {view === 'academy-metronome-ready' && (
           <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 relative">
              <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft size={24}/></button>
              <h2 className="text-4xl font-black text-fuchsia-600 mb-6">Metronomlu Okuma</h2>
              
              <button 
                onClick={() => speakInstruction("Arka planda çalan tik-tak sesinin ritmine uyarak ekrana gelen kelimeleri sesli oku.")} 
                className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"
              >
                <Volume2 /> Dinle
              </button>
              
              <button 
                onClick={() => { setView('academy-metronome-active'); setMetronomeIndex(0); }} 
                className="w-full bg-fuchsia-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(162,28,175)] active:translate-y-2 active:shadow-[0_0px_0_rgb(162,28,175)] transition-all"
              >
                BAŞLA! 🚀
              </button>
           </div>
        )}

        {view === 'academy-metronome-active' && (
          <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 min-h-[500px]">
             <button onClick={() => { setView('academy-menu'); setMetronomeIndex(-1); }} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft size={24}/></button>
             
             {metronomeIndex < metronomeChunks.length ? (
               <>
                 <div className="w-full max-w-sm mb-12 bg-fuchsia-50 p-6 rounded-3xl border-4 border-fuchsia-100 shadow-inner">
                    <label className="block text-xl font-black text-fuchsia-800 mb-4">Metronom Hızı: {metronomeBPM} BPM</label>
                    <input type="range" min="30" max="150" step="10" value={metronomeBPM} onChange={(e) => setMetronomeBPM(Number(e.target.value))} className="w-full accent-fuchsia-600 h-3 bg-fuchsia-200 rounded-lg appearance-none cursor-pointer" />
                 </div>
                 <div className="h-64 flex items-center justify-center">
                    <span className="text-6xl md:text-8xl font-black text-fuchsia-800 tracking-tight leading-tight">
                      {metronomeChunks[metronomeIndex]}
                    </span>
                 </div>
               </>
             ) : (
               <div className="space-y-8">
                  <div className="text-8xl animate-bounce">🎉</div>
                  <h2 className="text-4xl font-black text-emerald-600">Mükemmel Odaklanma!</h2>
                  <button 
                    onClick={() => setView('academy-menu')} 
                    className="bg-emerald-500 text-white px-10 py-5 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all"
                  >
                    Akademiye Dön
                  </button>
               </div>
             )}
          </div>
        )}

        {/* ========================================== */}
        {/* YZ HİKAYE ÜRETİM VE OKUMA EKRANLARI        */}
        {/* ========================================== */}
        
        {isGeneratingStory && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-32 text-center animate-in zoom-in duration-300">
             <Loader2 className="w-24 h-24 text-sky-500 animate-spin mx-auto mb-8" />
             <h2 className="text-3xl font-black text-sky-600">Sana Özel Metin Hazırlanıyor...</h2>
             <p className="text-sky-800 font-bold mt-4 opacity-70">Yapay Zeka Çalışıyor 🤖</p>
          </div>
        )}

        {view === 'reading-ready' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-32 text-center animate-in slide-in-from-bottom-10">
             <h2 className="text-5xl font-black text-amber-500 mb-10 drop-shadow-sm">Hazır mısın?</h2>
             {micError && (
               <div className="bg-rose-100 text-rose-700 p-4 rounded-xl font-bold mb-6 border-2 border-rose-200">
                 🎙️ {micError}
               </div>
             )}
             <div className="flex flex-col md:flex-row gap-6">
                <button 
                  onClick={() => beginTimer(false)} 
                  className="flex-1 bg-sky-500 text-white py-6 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(3,105,161)] active:translate-y-2 active:shadow-[0_0px_0_rgb(3,105,161)] transition-all"
                >
                  SESSİZ OKU 📖
                </button>
                <button 
                  onClick={() => beginTimer(true)} 
                  className="flex-1 bg-rose-500 text-white py-6 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(190,18,60)] active:translate-y-2 active:shadow-[0_0px_0_rgb(190,18,60)] transition-all flex items-center justify-center gap-3"
                >
                  <Mic size={28} /> SESLİ OKU
                </button>
             </div>
          </div>
        )}

        {view === 'reading-active' && (
          <div className="max-w-4xl mx-auto mt-12 space-y-8 relative">
             
             {/* DEDEKTİF GÖREVİ BİLDİRİMİ */}
             {isReadingFinished && storyData?.treasureHunt && (
               <div className="sticky top-4 z-40 bg-amber-100/95 backdrop-blur-md border-4 border-amber-300 p-4 md:p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-10 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="bg-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-inner ring-4 ring-amber-200">
                        <Search className="text-amber-500 w-8 h-8 md:w-10 md:h-10" />
                     </div>
                     <div>
                        <h4 className="font-black text-amber-900 text-xl md:text-2xl">Dedektif Görevi!</h4>
                        <p className="font-bold text-amber-700 text-md md:text-lg">{storyData.treasureHunt.task}</p>
                     </div>
                  </div>
                  <div className="bg-white px-8 py-3 rounded-2xl border-4 border-amber-200 font-black text-amber-600 text-3xl md:text-4xl text-center shadow-inner">
                     {foundWords.length} / {storyData.treasureHunt.targetWords.length}
                  </div>
               </div>
             )}

             {/* OKUMA METNİ ALANI */}
             <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative mt-8">
                
                {/* Hecematik Butonu */}
                <div className="absolute -top-6 right-8 z-10">
                    <button 
                      onClick={() => setShowHeceler(!showHeceler)} 
                      className={`px-6 py-3 rounded-full font-black flex items-center gap-2 transition-all duration-300 shadow-xl border-4 border-fuchsia-400 ${
                        showHeceler 
                          ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)]' 
                          : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 animate-pulse'
                      }`}
                    >
                      <Sparkles size={20} /> HECEMATİK {showHeceler ? 'AÇIK' : 'KAPALI'}
                    </button>
                </div>
                
                <p className="text-xl md:text-4xl leading-relaxed md:leading-[4.5rem] font-bold text-slate-800 whitespace-pre-wrap mt-6 cursor-default tracking-wide">
                   {renderStoryTextLocal()}
                </p>
             </div>

             {/* BİTİRDİM BUTONU */}
             {!isReadingFinished && (
               <button 
                 onClick={finishReading} 
                 className="w-full bg-emerald-500 text-white py-6 rounded-full text-4xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all"
               >
                 BİTİRDİM! 🎉
               </button>
             )}
             
             {/* SORULAR ALANI */}
             {isReadingFinished && (
               <div className="space-y-8 animate-in slide-in-from-bottom-10">
                 <div className="bg-white p-8 md:p-12 rounded-[3rem] border-8 border-fuchsia-300 shadow-2xl space-y-8">
                   <h2 className="text-4xl font-black text-fuchsia-600 text-center mb-8">Soruları Cevapla 🧠</h2>
                   
                   {storyData.questions.map((q, idx) => (
                     <div key={q.id} className="bg-fuchsia-50 p-6 md:p-8 rounded-3xl border-4 border-fuchsia-100">
                       <h3 className="text-2xl md:text-3xl font-black text-fuchsia-900 mb-6">{idx+1}. {q.q}</h3>
                       <div className="flex flex-col gap-4">
                          {q.options.map((opt, optIdx) => (
                            <button 
                              key={optIdx} 
                              onClick={() => setAnswers({...answers, [q.id]: optIdx})} 
                              className={`p-5 rounded-2xl font-black text-xl text-left transition-all border-4 ${
                                answers[q.id] === optIdx 
                                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]' 
                                  : 'bg-white text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                       </div>
                     </div>
                   ))}
                   
                   <button 
                     onClick={checkAnswers} 
                     disabled={Object.keys(answers).length < storyData.questions.length} 
                     className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(3,105,161)] border-sky-700 disabled:opacity-50 disabled:shadow-none disabled:translate-y-2 transition-all mt-8"
                   >
                     KARNEMİ GÖSTER 🏆
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* YZ DEĞERLENDİRME YÜKLENİYOR */}
        {view === 'evaluating' && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-32 text-center animate-in zoom-in duration-300">
             <Loader2 className="w-24 h-24 text-emerald-500 animate-spin mx-auto mb-8" />
             <h2 className="text-3xl font-black text-emerald-600">Değerlendiriliyor... 🌟</h2>
             <p className="text-emerald-800 font-bold mt-4 opacity-70">Cevapların kontrol ediliyor</p>
          </div>
        )}

        {/* --- SONUÇ / KARNE EKRANI --- */}
        {view === 'result' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-20 text-center space-y-8 animate-in slide-in-from-bottom-10">
             <div className="text-7xl mb-4">🏆</div>
             <h2 className="text-5xl font-black text-sky-600">Tebrikler {readingResult.name.split(' ')[0]}!</h2>
             
             <div className="bg-indigo-50 p-10 rounded-3xl font-bold text-indigo-900 text-2xl relative shadow-inner border-4 border-indigo-100 leading-relaxed">
                "{readingResult.aiEvaluation.geribildirim}"
                
                <button 
                  onClick={() => speakInstruction(readingResult.aiEvaluation.geribildirim)} 
                  className="absolute -top-6 -right-6 bg-amber-400 text-amber-900 p-4 rounded-full shadow-xl hover:bg-amber-300 transition-transform active:scale-95 animate-bounce border-4 border-white" 
                  title="Sesli Dinle"
                >
                    <Volume2 size={32} />
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-amber-100 font-black text-amber-800 text-xl">
                  <span className="text-amber-500 text-5xl block mb-2">{readingResult.wpm}</span> Hız (WPM)
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-emerald-100 font-black text-emerald-800 text-xl">
                  <span className="text-emerald-500 text-5xl block mb-2">{readingResult.compScore}/{readingResult.maxScore}</span> Doğru
                </div>
             </div>
             
             <button 
               onClick={()=>{setView('student-setup')}} 
               className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_8px_0_rgb(3,105,161)] active:translate-y-2 active:shadow-[0_0px_0_rgb(3,105,161)] transition-all mt-8"
             >
               YENİDEN OYNA 🎮
             </button>
          </div>
        )}

        {/* ========================================== */}
        {/* ÖĞRETMEN GİRİŞİ VE YÖNETİM PANELİ          */}
        {/* ========================================== */}
        
        {view === 'teacher-login' && (
           <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl border-8 border-emerald-300 mt-20">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
                <User size={40} />
              </div>
              <h2 className="text-4xl font-black text-emerald-600 text-center mb-8">Öğretmen Girişi</h2>
              
              <form onSubmit={e => { 
                e.preventDefault(); 
                if (teacherPassword === actualTeacherPassword) { 
                  setTeacherTab('radar'); setView('teacher'); setPasswordError(false); 
                } else {
                  setPasswordError(true); 
                }
              }} className="space-y-6">
                 
                 <input 
                   type="password" 
                   value={teacherPassword} 
                   onChange={e=>setTeacherPassword(e.target.value)} 
                   className="w-full p-4 border-4 border-emerald-200 rounded-2xl text-center text-4xl tracking-[1em] bg-white font-bold outline-none text-emerald-900" 
                   placeholder="••••" 
                   maxLength={4} 
                 />
                 
                 {passwordError && <p className="text-rose-500 font-bold text-center">Hatalı Şifre!</p>}
                 
                 <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all">
                   GİRİŞ YAP 🚀
                 </button>
                 
                 <button type="button" onClick={()=>setView('student-setup')} className="w-full text-slate-400 font-bold mt-4 hover:text-slate-600 transition-colors">
                   Geri Dön
                 </button>
              </form>
           </div>
        )}

        {view === 'teacher' && (
           <div className="max-w-6xl mx-auto bg-white/95 rounded-[3rem] shadow-2xl border-8 border-emerald-100 mt-12 min-h-[600px] p-6 md:p-10 relative animate-in fade-in duration-300">
              
              {/* Panel Başlığı */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 no-print gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                     <Settings size={32} />
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black text-emerald-600 tracking-tight">Yönetim Merkezi</h2>
                 </div>
                 <button onClick={() => setView('student-setup')} className="bg-emerald-100 text-emerald-700 px-8 py-4 rounded-full font-black hover:bg-emerald-200 transition-colors shadow-sm w-full md:w-auto">
                   Öğrenci Ekranına Dön
                 </button>
              </div>
              
              {/* Sekmeler */}
              <div className="flex flex-wrap border-b-4 border-emerald-100 mb-10 no-print">
                 {[ 
                   {id:'radar', i:<Activity/>, l:'Sınıf Radarı'}, 
                   {id:'stats', i:<FileText/>, l:'Rapor & Arşiv'}, 
                   {id:'homework', i:<BookOpen/>, l:'Ödev Merkezi'}, 
                   {id:'students', i:<Users/>, l:'Öğrenciler'}, 
                   {id:'settings', i:<Settings/>, l:'Ayarlar'} 
                 ].map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setTeacherTab(tab.id)} 
                      className={`flex-1 flex items-center justify-center gap-2 py-5 font-black capitalize transition-all text-lg ${
                        teacherTab === tab.id 
                          ? 'text-emerald-700 border-b-8 border-emerald-500 bg-emerald-50 rounded-t-2xl' 
                          : 'text-slate-400 hover:text-emerald-500'
                      }`}
                    >
                       {tab.i} <span className="hidden md:inline">{tab.l}</span>
                    </button>
                 ))}
              </div>

              {/* SEKME 1: RADAR (Sınıf Gelişimi) */}
              {teacherTab === 'radar' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="grid md:grid-cols-2 gap-8">
                      {/* Hızlananlar Kartı */}
                      <div className="bg-emerald-50 p-8 rounded-[2rem] border-4 border-emerald-200 shadow-sm">
                         <h4 className="text-2xl font-black text-emerald-600 mb-6 flex items-center gap-3">
                           <TrendingUp size={28}/> Hızlanan Öğrenciler
                         </h4>
                         <ul className="space-y-4">
                            {students.map(s => {
                               const studentStats = stats.filter(r => r.name === s.name).reverse();
                               if(studentStats.length >= 2 && Number(studentStats[0].wpm) > Number(studentStats[1].wpm)) {
                                 return (
                                   <li key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border-l-8 border-emerald-500 font-black text-emerald-900 flex justify-between items-center text-lg">
                                     <span>{s.name}</span> 
                                     <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg">+{Number(studentStats[0].wpm) - Number(studentStats[1].wpm)} WPM</span>
                                   </li>
                                 );
                               } 
                               return null;
                            })}
                         </ul>
                      </div>
                      
                      {/* Desteğe İhtiyacı Olanlar Kartı */}
                      <div className="bg-rose-50 p-8 rounded-[2rem] border-4 border-rose-200 shadow-sm">
                         <h4 className="text-2xl font-black text-rose-600 mb-6 flex items-center gap-3">
                           <Activity size={28}/> Desteğe İhtiyacı Olanlar
                         </h4>
                         <ul className="space-y-4">
                            {students.map(s => {
                               const studentStats = stats.filter(r => r.name === s.name).reverse();
                               if(studentStats.length >= 2 && Number(studentStats[0].wpm) < Number(studentStats[1].wpm)) {
                                 return (
                                   <li key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border-l-8 border-rose-500 font-black text-rose-900 flex justify-between items-center text-lg">
                                     <span>{s.name}</span> 
                                     <span className="text-rose-500 bg-rose-50 px-3 py-1 rounded-lg">{Number(studentStats[0].wpm) - Number(studentStats[1].wpm)} WPM</span>
                                   </li>
                                 );
                               } 
                               return null;
                            })}
                         </ul>
                      </div>
                   </div>
                </div>
              )}

              {/* SEKME 2: RAPOR & PDF (Veli Çıktısı) */}
              {teacherTab === 'stats' && (
                <div id="print-section" className="animate-in fade-in duration-300">
                  <div className="mb-8 flex flex-col md:flex-row items-center gap-4 bg-emerald-50 p-6 rounded-[2rem] border-4 border-emerald-100 no-print">
                    <label className="font-black text-emerald-800 text-xl whitespace-nowrap">Öğrenci Seç:</label>
                    <select 
                      value={selectedStudentForProgress || ''} 
                      onChange={(e) => setSelectedStudentForProgress(e.target.value || null)} 
                      className="w-full md:flex-1 p-4 border-4 border-emerald-200 rounded-xl font-bold text-emerald-900 bg-white outline-none text-lg"
                    >
                      <option value="">Tüm Sınıf (Genel Liste)</option>
                      {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    {selectedStudentForProgress && (
                       <button onClick={() => window.print()} className="w-full md:w-auto bg-sky-500 hover:bg-sky-400 text-white p-4 rounded-xl shadow-md font-black flex items-center justify-center gap-2 text-lg transition-colors">
                         <Printer/> Veli PDF Çıktısı
                       </button>
                    )}
                  </div>

                  <div className="overflow-x-auto bg-white rounded-3xl border-4 border-emerald-50 shadow-sm p-2">
                    <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-4 border-emerald-100 bg-emerald-50/50">
                           {selectedStudentForProgress === null && <th className="p-5 font-black text-emerald-800">İsim</th>}
                           <th className="p-5 font-black text-emerald-800">Tarih</th>
                           <th className="p-5 font-black text-emerald-800">Tür</th>
                           <th className="p-5 font-black text-emerald-800 text-center">WPM</th>
                           <th className="p-5 font-black text-emerald-800 text-center">Skor</th>
                           <th className="p-5 font-black text-emerald-800 text-center no-print">Ses Kaydı</th>
                           <th className="p-5 font-black text-emerald-800 text-center no-print">İşlem</th>
                         </tr>
                      </thead>
                      <tbody>
                        {stats
                          .filter(r => selectedStudentForProgress ? r.name === selectedStudentForProgress : true)
                          .map(row => (
                          <tr key={row.id} className="border-b border-emerald-50 font-bold text-slate-700 hover:bg-emerald-50/30 transition-colors">
                            {selectedStudentForProgress === null && <td className="p-5 text-emerald-900">{row.name}</td>}
                            <td className="p-5 text-sm">{row.date || 'Belirtilmedi'}</td>
                            <td className="p-5">
                              {row.level === 'Ödev' 
                                ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-black border-2 border-amber-200">Ödev</span> 
                                : <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-lg text-sm font-black border-2 border-sky-200">{row.interest}</span>
                              }
                            </td>
                            <td className="p-5 text-center text-xl text-amber-600 font-black">{row.wpm}</td>
                            <td className="p-5 text-center text-xl text-emerald-600 font-black">{row.compScore}/{row.maxScore || 2}</td>
                            <td className="p-5 text-center no-print">
                              {row.audioUrl ? <audio src={row.audioUrl} controls className="h-10 w-full max-w-[200px] mx-auto outline-none" /> : <span className="text-slate-400 text-sm">Yok</span>}
                            </td>
                            <td className="p-5 text-center no-print">
                              <button onClick={() => handleDeleteStat(row.id)} className="bg-rose-100 text-rose-600 p-3 rounded-xl hover:bg-rose-500 hover:text-white transition-colors shadow-sm">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {stats.filter(r => selectedStudentForProgress ? r.name === selectedStudentForProgress : true).length === 0 && (
                          <tr><td colSpan="7" className="text-center p-8 text-slate-400 font-bold">Kayıt bulunamadı.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SEKME 3: ÖDEV MERKEZİ (Yapay Zeka Destekli) */}
              {teacherTab === 'homework' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {activeHomework && (
                     <div className="bg-amber-50 p-8 rounded-[2rem] border-4 border-amber-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                           <h3 className="text-2xl font-black text-amber-800">Yayında Aktif Ödev Var!</h3>
                           <p className="font-bold text-amber-600 mt-2 text-lg">Bitiş Süresi: {activeHomework.deadline ? new Date(activeHomework.deadline).toLocaleString('tr-TR') : 'Süresiz'}</p>
                        </div>
                        <button onClick={handleRemoveHomework} className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-md transition-colors text-lg">
                          <Trash2/> Ödevi Kaldır
                        </button>
                     </div>
                  )}
                  
                  <div className="bg-fuchsia-50 p-8 rounded-[2rem] border-4 border-fuchsia-100 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                     <h3 className="w-full text-2xl font-black text-fuchsia-800 mb-2 flex items-center gap-2">
                       <Sparkles className="text-fuchsia-500"/> Yapay Zeka ile Ödev Üret
                     </h3>
                     <input 
                       type="text" 
                       placeholder="Ödev Konusu (Örn: Uzaylı Dostlar)" 
                       value={hwTopic} 
                       onChange={e=>setHwTopic(e.target.value)} 
                       className="w-full md:flex-1 p-4 border-4 border-fuchsia-200 rounded-2xl font-bold outline-none text-fuchsia-900" 
                     />
                     <button 
                       onClick={async () => {
                         if (!hwTopic) { showTeacherMessageLocal("⚠️ Lütfen ödev konusu yazın."); return; }
                         setIsGeneratingHw(true);
                         try {
                           const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`, { 
                               method: 'POST', 
                               body: JSON.stringify({ 
                                   contents: [{ parts: [{ text: `Konu: "${hwTopic}". 1. sınıf ödevi, metin ve 2 soru. JSON: {text, questions:[{q, options, correct}]}` }] }], 
                                   generationConfig: { responseMimeType: "application/json" } 
                               }) 
                           });
                           const data = await res.json(); 
                           const d = JSON.parse(data.candidates[0].content.parts[0].text);
                           setHwText(d.text); 
                           setHwQuestions(d.questions);
                         } catch (e) {} 
                         setIsGeneratingHw(false);
                       }} 
                       disabled={isGeneratingHw} 
                       className="w-full md:w-auto bg-fuchsia-500 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-lg shadow-[0_6px_0_rgb(162,28,175)] active:translate-y-2 active:shadow-[0_0px_0_rgb(162,28,175)] transition-all"
                     >
                       {isGeneratingHw ? <Loader2 className="animate-spin" /> : <Sparkles />} YAPAY ZEKA ÜRETSİN
                     </button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="md:col-span-2">
                       <label className="block text-xl font-black text-emerald-800 mb-3">Okuma Metni:</label>
                       <textarea 
                         value={hwText} 
                         onChange={e => setHwText(e.target.value)} 
                         className="w-full p-6 border-4 border-emerald-200 rounded-[2rem] h-64 font-bold outline-none text-slate-700 leading-relaxed" 
                         placeholder="Metni buraya yazın veya yapay zekaya ürettirin..." 
                       />
                     </div>
                     <div>
                       <label className="block text-xl font-black text-amber-800 mb-3 flex items-center gap-2">
                         <Calendar/> Bitiş Süresi (Otomatik Silinir):
                       </label>
                       <input 
                         type="datetime-local" 
                         value={hwDeadline} 
                         onChange={e => setHwDeadline(e.target.value)} 
                         className="w-full p-6 border-4 border-amber-200 rounded-[2rem] font-black text-amber-900 outline-none bg-amber-50/50" 
                       />
                       <p className="mt-4 text-sm font-bold text-slate-500 italic px-2">
                         Belirlediğiniz saat geldiğinde bu ödev çocukların ekranından otomatik olarak kaldırılır.
                       </p>
                     </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 p-8 rounded-[3rem] border-4 border-slate-100">
                     <h3 className="text-2xl font-black text-emerald-800">Sorular</h3>
                     {hwQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white p-8 rounded-3xl border-4 border-emerald-100 shadow-sm relative">
                           {hwQuestions.length > 1 && (
                              <button 
                                onClick={() => setHwQuestions(hwQuestions.filter((_, i) => i !== qIndex))} 
                                className="absolute top-6 right-6 text-rose-500 bg-rose-50 p-3 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
                              >
                                <Trash2 size={20}/>
                              </button>
                           )}
                           
                           <label className="font-black text-emerald-600 block mb-2">Soru {qIndex + 1}:</label>
                           <input 
                             type="text" 
                             value={q.q} 
                             onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].q = e.target.value; setHwQuestions(newQs); }} 
                             className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold mb-6 outline-none focus:border-emerald-400" 
                             placeholder="Soru cümlesi..." 
                           />
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                             {[0, 1, 2].map(optIndex => (
                                <input 
                                  key={optIndex} 
                                  type="text" 
                                  value={q.options[optIndex]} 
                                  onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].options[optIndex] = e.target.value; setHwQuestions(newQs); }} 
                                  className="p-4 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-400" 
                                  placeholder={`${['A', 'B', 'C'][optIndex]} Şıkkı`} 
                                />
                             ))}
                           </div>
                           
                           <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100 flex items-center gap-4">
                             <label className="font-black text-emerald-800 whitespace-nowrap">Doğru Cevap:</label>
                             <select 
                               value={q.correct} 
                               onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].correct = Number(e.target.value); setHwQuestions(newQs); }} 
                               className="w-full p-3 bg-white border-2 border-emerald-200 rounded-lg font-black text-emerald-700 outline-none"
                             >
                                <option value={0}>A Şıkkı</option> 
                                <option value={1}>B Şıkkı</option> 
                                <option value={2}>C Şıkkı</option>
                             </select>
                           </div>
                        </div>
                     ))}
                     
                     <button 
                       onClick={() => setHwQuestions([...hwQuestions, { q: '', options: ['', '', ''], correct: 0 }])} 
                       className="w-full bg-emerald-100 text-emerald-700 py-6 rounded-3xl font-black border-4 border-emerald-200 border-dashed flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors text-xl"
                     >
                       <Plus size={28}/> YENİ SORU EKLE
                     </button>
                  </div>
                  
                  <button 
                    onClick={handlePublishHomework} 
                    className="w-full bg-emerald-500 text-white py-6 rounded-full font-black text-3xl shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all mt-8 flex items-center justify-center gap-4"
                  >
                    <Send size={32}/> SINIF PANOSUNA GÖNDER 🚀
                  </button>
                </div>
              )}

              {/* SEKME 4: ÖĞRENCİLER (Hediye Yıldız, Kilit Açma ve Şifre Yönetimi) */}
              {teacherTab === 'students' && (
                <div className="animate-in fade-in duration-300">
                  <div className="bg-emerald-50 p-6 md:p-8 rounded-[2rem] border-4 border-emerald-200 shadow-sm flex flex-col md:flex-row gap-4 mb-10">
                    <input 
                      type="text" 
                      placeholder="Öğrenci Adı Soyadı" 
                      value={newStudentName} 
                      onChange={e=>setNewStudentName(e.target.value)} 
                      className="flex-1 p-4 border-4 border-white rounded-xl font-black text-lg outline-none focus:border-emerald-300" 
                    />
                    <input 
                      type="text" 
                      placeholder="Şifre" 
                      value={newStudentPassword} 
                      onChange={e=>setNewStudentPassword(e.target.value)} 
                      className="w-full md:w-32 p-4 border-4 border-white rounded-xl font-black text-center text-lg outline-none focus:border-emerald-300" 
                    />
                    <button 
                      onClick={handleAddStudent} 
                      className="bg-emerald-500 text-white font-black px-10 py-4 rounded-xl shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-[0_0px_0_rgb(4,120,87)] transition-all text-lg"
                    >
                      KAYDET
                    </button>
                  </div>
                  
                  {students.length === 0 && (
                    <button 
                      onClick={handleLoadDefaultClass} 
                      className="bg-amber-100 text-amber-800 px-8 py-4 rounded-full font-black border-4 border-amber-200 mb-8 mx-auto block hover:bg-amber-200 transition-colors"
                    >
                      Hazır 1/A Sınıf Listesini Yükle
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    {students.map(s => (
                      <div key={s.id} className="flex flex-col md:flex-row justify-between items-center p-6 bg-white rounded-3xl border-4 border-emerald-100 shadow-sm gap-6 hover:border-emerald-300 transition-colors">
                        
                        <div className="flex-1 font-black text-emerald-900 text-2xl flex items-center gap-4">
                           {s.name} 
                           {s.teacherStars > 0 && (
                             <span className="bg-amber-100 text-amber-600 text-sm px-3 py-1 rounded-full flex items-center gap-1 border-2 border-amber-200 shadow-sm">
                               🌟 x{s.teacherStars}
                             </span>
                           )}
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                          
                          {/* HEDİYE YILDIZ BUTONU */}
                          <button 
                            onClick={async () => {
                                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id), { 
                                  teacherStars: (s.teacherStars || 0) + 1, 
                                  hasNewGift: true 
                                });
                                showTeacherMessageLocal(`🌟 ${s.name} öğrencisine Sürpriz Yıldız gönderildi!`);
                            }} 
                            className="bg-amber-400 text-white p-4 rounded-2xl shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none hover:bg-amber-500 transition-all" 
                            title="Motivasyon Yıldızı Gönder (Öğrenci ekranında hediye paketi çıkar)"
                          >
                            <Gift size={24}/>
                          </button>

                          {/* AKADEMİ SEVİYESİ YÖNETİMİ */}
                          <div className="bg-indigo-50 border-4 border-indigo-100 rounded-2xl flex items-center p-2 font-black text-indigo-800">
                             <span className="px-3 text-sm">Akademi Lvl:</span>
                             <select 
                               value={s.academyLevel || 1} 
                               onChange={(e) => updateAcademyLevel(Number(e.target.value), s.id)} 
                               className="bg-white border-2 border-indigo-200 rounded-xl p-2 outline-none cursor-pointer"
                             >
                                <option value={1}>1. Harf</option> 
                                <option value={2}>2. Hece</option> 
                                <option value={3}>3. Kelime</option> 
                                <option value={4}>4. Hikaye</option>
                             </select>
                          </div>

                          {/* ŞİFRE YÖNETİMİ */}
                          {editingPasswords[s.id] !== undefined ? (
                            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-2xl border-4 border-emerald-100">
                              <input 
                                type="text" 
                                value={editingPasswords[s.id]} 
                                onChange={(e) => setEditingPasswords({...editingPasswords, [s.id]: e.target.value})} 
                                className="w-24 p-3 border-2 border-emerald-300 rounded-xl text-center font-black tracking-widest outline-none bg-white" 
                                maxLength={4} 
                              />
                              <button 
                                onClick={() => handleUpdatePassword(s.id, editingPasswords[s.id])} 
                                className="bg-emerald-500 text-white p-3 rounded-xl font-bold shadow-sm"
                              >
                                <Check size={20}/>
                              </button>
                              <button 
                                onClick={() => { const newEd = {...editingPasswords}; delete newEd[s.id]; setEditingPasswords(newEd); }} 
                                className="bg-slate-200 text-slate-600 p-3 rounded-xl font-bold shadow-sm"
                              >
                                <X size={20}/>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border-4 border-slate-100">
                              <span className="bg-white px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 tracking-widest font-black">
                                {s.password}
                              </span>
                              <button 
                                onClick={() => setEditingPasswords({...editingPasswords, [s.id]: s.password})} 
                                className="bg-sky-500 text-white px-4 py-3 rounded-xl shadow-[0_4px_0_rgb(3,105,161)] active:translate-y-1 active:shadow-none font-black text-sm"
                              >
                                Değiştir
                              </button>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleDeleteStudent(s.id, s.name)} 
                            className="bg-rose-100 text-rose-600 p-4 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border-2 border-rose-200" 
                            title="Öğrenciyi Sil"
                          >
                            <Trash2 size={24}/>
                          </button>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEKME 5: AYARLAR (Öğretmen Şifresi) */}
              {teacherTab === 'settings' && (
                <div className="flex flex-col max-w-lg mx-auto gap-6 mt-12 bg-emerald-50 p-10 rounded-[3rem] border-4 border-emerald-100 animate-in fade-in duration-300">
                   <div className="text-center mb-4">
                     <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-emerald-500 shadow-sm mb-4 border-4 border-emerald-200">
                       <Lock size={32}/>
                     </div>
                     <h3 className="text-2xl font-black text-emerald-800">Yönetici Şifresi</h3>
                     <p className="text-emerald-600 font-bold mt-2">Öğretmen paneline giriş şifrenizi güncelleyin.</p>
                   </div>
                   
                   <input 
                     type="text" 
                     placeholder="Yeni 4 Haneli Şifre" 
                     value={newTeacherPasswordInput} 
                     onChange={e=>setNewTeacherPasswordInput(e.target.value)} 
                     className="p-5 border-4 border-white rounded-2xl font-black text-center tracking-[1em] text-2xl outline-none focus:border-emerald-300" 
                     maxLength={4}
                   />
                   
                   <button 
                     onClick={async () => {
                         if (!newTeacherPasswordInput || newTeacherPasswordInput.length < 4) { 
                           showTeacherMessageLocal("❌ Şifre en az 4 hane olmalı."); 
                           return; 
                         }
                         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin'), { password: newTeacherPasswordInput.trim() }, { merge: true });
                         setNewTeacherPasswordInput(''); 
                         showTeacherMessageLocal("✅ Şifre başarıyla güncellendi!");
                     }} 
                     className="bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all text-xl"
                   >
                     ŞİFREYİ GÜNCELLE
                   </button>
                </div>
              )}
              
              {/* ÖĞRETMEN BİLDİRİM TOAST'U */}
              {teacherMsg && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-8 py-4 rounded-full font-black text-lg shadow-2xl animate-bounce z-50 flex items-center gap-3">
                  <Check className="text-emerald-400" /> {teacherMsg}
                </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
