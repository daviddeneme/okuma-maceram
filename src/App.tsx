import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users, Search, Eye, Lock, Unlock, Trash2, Plus, Activity, Calendar, Printer, Gift, Cloud } from 'lucide-react';
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

const RANKS = [
  { lvl: 1, name: "Harf İzicisi", icon: "👣" },
  { lvl: 2, name: "Hece Kâşifi", icon: "🛶" },
  { lvl: 3, name: "Kelime Avcısı", icon: "🦅" },
  { lvl: 4, name: "Hikâye Ustası", icon: "📜" }
];

// --- DİNAMİK ANTRENMAN HAVUZLARI ---
const FLASH_POOLS = [
  { w: "Elma", o: ["Armut", "Elma", "Muz"] }, { w: "Kedi", o: ["Köpek", "Kedi", "Kuş"] }, { w: "Güneş", o: ["Bulut", "Güneş", "Yıldız"] },
  { w: "Masa", o: ["Sandalye", "Masa", "Koltuk"] }, { w: "Kitap", o: ["Defter", "Silgi", "Kitap"] }, { w: "Mavi", o: ["Sarı", "Mavi", "Kırmızı"] },
  { w: "Okul", o: ["Ev", "Okul", "Park"] }, { w: "Çiçek", o: ["Ağaç", "Çiçek", "Yaprak"] }, { w: "Deniz", o: ["Göl", "Deniz", "Nehir"] },
  { w: "Mutlu", o: ["Üzgün", "Şaşkın", "Mutlu"] }, { w: "Kalem", o: ["Silgi", "Defter", "Kalem"] }, { w: "Uçak", o: ["Gemi", "Uçak", "Tren"] },
  { w: "Top", o: ["Koş", "Top", "Al"] }, { w: "Orman", o: ["Ağaç", "Orman", "Dağ"] }
];

const METRONOME_TEXTS = [
  "Bir varmış bir yokmuş. Küçük bir çocuk ormanda gezerken kocaman bir ağaç görmüş. Ağacın dallarında kırmızı elmalar parlıyormuş. Çocuk elmalardan birini alıp afiyetle yemiş.",
  "Güneşli bir sabah sevimli bir tavşan yuvasından çıkmış. Havuç tarlasında zıplayarak koşmuş. Karnı doyana kadar havuç yemiş.",
  "Mavi denizlerde yüzen küçük bir balık varmış. Arkadaşlarıyla saklambaç oynamayı çok severmiş. Bir gün büyük bir mercan kayalığı bulmuşlar.",
  "Gökyüzünde süzülen renkli bir uçurtma çocukların neşesi olmuş. Rüzgar estikçe daha da yükseklere çıkmış. Bulutların arasından gülümsemiş.",
  "Kış gelince her yer bembeyaz karla kaplanmış. Çocuklar dışarı çıkıp kardan adam yapmışlar. Havuçtan burun ve kömürden göz takmışlar."
];

export default function App() {
  const [view, setView] = useState('student-setup');
  const [stats, setStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [showHomeworkDetails, setShowHomeworkDetails] = useState(false);

  const [activeHomework, setActiveHomework] = useState(null);
  const [teacherTab, setTeacherTab] = useState('radar');
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);

  const [hwText, setHwText] = useState('');
  const [hwDeadline, setHwDeadline] = useState('');
  const [hwQuestions, setHwQuestions] = useState([{ q: '', options: ['', '', ''], correct: 0 }]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const [hwTopic, setHwTopic] = useState('');
  const [hwLevel, setHwLevel] = useState('1');
  const [isGeneratingHw, setIsGeneratingHw] = useState(false);

  const [loginError, setLoginError] = useState('');
  const [micError, setMicError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [academyLevel, setAcademyLevel] = useState(1);
  const [teacherStars, setTeacherStars] = useState(0);

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

  const [warmupTime, setWarmupTime] = useState(30);
  const [schulteGrid, setSchulteGrid] = useState([]);
  const [schulteExpected, setSchulteExpected] = useState(1);

  const [flashWordsData, setFlashWordsData] = useState([]);
  const [flashStage, setFlashStage] = useState(0);
  const [isFlashShowing, setIsFlashShowing] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [flashSpeed, setFlashSpeed] = useState(1500);

  const [metronomeBPM, setMetronomeBPM] = useState(40);
  const [metronomeIndex, setMetronomeIndex] = useState(-1);
  const [metronomeChunks, setMetronomeChunks] = useState([]);

  const [teleprompterIndex, setTeleprompterIndex] = useState(-1);
  const [teleprompterActive, setTeleprompterActive] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(40);


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
        setIsAuthenticated(true);
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
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.deadline && new Date() > new Date(data.deadline)) {
          deleteDoc(hwRef);
          setActiveHomework(null);
        } else {
          setActiveHomework(data);
        }
      }
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
        setStudentAvatar(data.avatar || '🐶'); setLevel(data.level); setAcademyLevel(data.academyLevel || 1);
        setRememberMe(true);
        setIsAuthenticated(true);
        const topicsArray = (data.interest || '').split(', ').filter(t => t.trim() !== '');
        const cleanPredefined = PREDEFINED_TOPICS.map(t => t.split(' ')[0]);
        setSelectedTopics(topicsArray.filter(t => cleanPredefined.includes(t)));
        setCustomTopic(topicsArray.filter(t => !cleanPredefined.includes(t)).join(', '));
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (studentName) {
      const matchedStudent = students.find(s => s.name === studentName);
      if (matchedStudent) {
        setTeacherStars(matchedStudent.teacherStars || 0);
        if (matchedStudent.hasNewGift) {
          setShowTeacherStarGift(true);
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', matchedStudent.id), { hasNewGift: false });
        }
      }
    }
  }, [studentName, students]);

  const showTeacherMessage = (msg) => { setTeacherMsg(msg); setTimeout(() => setTeacherMsg(''), 4000); };

  const updateAcademyLevel = async (newLevel, forceStudentId = null) => {
    if (forceStudentId) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', forceStudentId), { academyLevel: newLevel });
      showTeacherMessage('✅ Seviye güncellendi!');
      return;
    }

    if (newLevel > academyLevel) {
      setAcademyLevel(newLevel);
      if (savedProfile) {
        const newProfile = { ...savedProfile, academyLevel: newLevel };
        setSavedProfile(newProfile);
        if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
        localStorage.setItem('okumaMaceramProfile', JSON.stringify(newProfile));

        const matched = students.find(s => s.name === studentName);
        if (matched) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', matched.id), { academyLevel: newLevel });
      }
    }
  };

  const handleGiveTeacherStar = async (studentId, currentStars) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId), { teacherStars: (currentStars || 0) + 1, hasNewGift: true });
    showTeacherMessage('🌟 Özel Öğretmen Yıldızı gönderildi!');
  };

  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'tr-TR';
      msg.rate = 0.9;
      msg.pitch = 1.3;

      const voices = window.speechSynthesis.getVoices();
      const turkishFemale = voices.find(voice => voice.lang.includes('tr') && voice.name.includes('Female'));
      if (turkishFemale) msg.voice = turkishFemale;

      window.speechSynthesis.speak(msg);
    }
  };

  const stopInstruction = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

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
    } catch (e) { }
  };

  useEffect(() => {
    let timer = null;
    if (view === 'academy-warmup-active' && warmupTime > 0) {
      timer = setTimeout(() => setWarmupTime(p => p - 1), 1000);
    } else if (view === 'academy-warmup-active' && warmupTime === 0) {
      updateAcademyLevel(2);
      showTeacherMessage("Gözlerin ısındı! Schulte Tablosu açıldı. 🔓");
      setView('academy-menu');
    }
    return () => clearTimeout(timer);
  }, [view, warmupTime]);

  useEffect(() => {
    let interval = null;
    if (view === 'academy-metronome-active' && metronomeIndex < metronomeChunks.length) {
      interval = setInterval(() => {
        playTick();
        setMetronomeIndex((prev) => prev + 1);
      }, (60 / metronomeBPM) * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, metronomeChunks, metronomeBPM, metronomeIndex]);

  useEffect(() => {
    let interval = null;
    if (view === 'reading-active' && teleprompterActive && teleprompterIndex >= 0 && !isReadingFinished) {
      const validWordsCount = (storyData?.text || '').split(/(\s+)/).filter(w => w.trim()).length;
      if (teleprompterIndex < validWordsCount) {
        interval = setInterval(() => {
          setTeleprompterIndex(p => p + 1);
        }, (60 / teleprompterSpeed) * 1000);
      } else {
        setTeleprompterIndex(-1);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, teleprompterActive, teleprompterIndex, teleprompterSpeed, isReadingFinished, storyData]);



  const startSchulte = () => {
    setSchulteGrid([...Array(9)].map((_, i) => i + 1).sort(() => Math.random() - 0.5));
    setSchulteExpected(1);
    setView('academy-schulte-ready');
    speakInstruction("Harika gidiyorsun! Şimdi bir dedektif gibi sayıları bulacağız. Lütfen gözünü tablonun tam ortasından hiç ayırma ve kenarlardaki sayıları birden dokuza kadar sırayla bulup tıkla. Hazırsan başla!");
  };

  const handleSchulteClick = (num) => {
    if (num === schulteExpected) {
      if (num === 9) {
        updateAcademyLevel(3);
        showTeacherMessage("Harika! Çevresel görüşün harika. Flaş modu açıldı. 🔓");
        setView('academy-menu');
      } else {
        setSchulteExpected(p => p + 1);
      }
    }
  };

  const startFlash = () => {
    const shuffled = [...FLASH_POOLS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const randomizedOptions = shuffled.map(item => ({
      w: item.w,
      o: [...item.o].sort(() => 0.5 - Math.random())
    }));
    setFlashWordsData(randomizedOptions);
    setFlashStage(0); setFlashMessage(''); setView('academy-flash-ready');
    speakInstruction("Şimdi gözlerinle fotoğraf çekme zamanı! Ekranda bir kelime şimşek gibi parlayıp kaybolacak. Onu aklında tut ve aşağıdaki seçeneklerden doğru olanı bul. Gözünü kırpma, hazırsan başla!");
  };

  const triggerFlashWord = () => {
    setIsFlashShowing(true);
    setTimeout(() => { setIsFlashShowing(false); }, flashSpeed);
  };

  const handleFlashAnswer = (opt, correctOpt) => {
    if (opt === correctOpt) {
      if (flashStage === 2) {
        updateAcademyLevel(4);
        showTeacherMessage("Fotoğrafik hafızan süper! Metronom açıldı. 🔓");
        setView('academy-menu');
      } else {
        setFlashMessage("Doğru! Hazırlan...");
        setTimeout(() => {
          setFlashMessage(''); setFlashStage(p => p + 1); triggerFlashWord();
        }, 1500);
      }
    } else {
      setFlashMessage("Yanlış kelime. Baştan başlıyoruz...");
      setTimeout(() => { setFlashStage(0); setFlashMessage(''); triggerFlashWord(); }, 2000);
    }
  };

  const startMetronome = () => {
    const randomText = METRONOME_TEXTS[Math.floor(Math.random() * METRONOME_TEXTS.length)];
    const words = randomText.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += 2) chunks.push(words.slice(i, i + 2).join(' '));
    setMetronomeChunks(chunks); setMetronomeIndex(-1); setView('academy-metronome-ready');
    speakInstruction("İşte büyük görev! Arka planda çalan tik-tak sesinin ritmine uyarak ekrana gelen kelimeleri sesli bir şekilde oku. Ritimden hiç kopma. Hazırsan macerayı başlat!");
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPassword) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: newStudentName.trim(), password: newStudentPassword.trim(), academyLevel: 1, teacherStars: 0 });
      setNewStudentName(''); setNewStudentPassword('1234'); showTeacherMessage(`✅ ${newStudentName} sınıfa eklendi!`);
    } catch (e) { showTeacherMessage(`❌ Öğrenci eklenemedi.`); }
  };

  const handleUpdatePassword = async (id, newPassword) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), { password: newPassword });
      showTeacherMessage('✅ Şifre güncellendi!');
      const newEditing = { ...editingPasswords }; delete newEditing[id]; setEditingPasswords(newEditing);
    } catch (e) { showTeacherMessage('❌ Hata oluştu.'); }
  };

  const handleDeleteStudent = async (id, name) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id)); showTeacherMessage(`🗑️ ${name} silindi.`);
    } catch (e) { showTeacherMessage(`❌ Silinemedi.`); }
  };

  const handleDeleteStat = async (id) => {
    if (window.confirm('Bu okuma kaydını silmek istediğinize emin misiniz?')) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', id)); showTeacherMessage('🗑️ Kayıt silindi.'); }
      catch (e) { showTeacherMessage('❌ Kayıt silinemedi.'); }
    }
  };

  const handleLoadDefaultClass = async () => {
    showTeacherMessage('⏳ Yükleniyor...');
    try {
      for (const name of DEFAULT_CLASS_LIST) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, password: '1234', academyLevel: 1, teacherStars: 0 });
      }
      showTeacherMessage('✅ 1/A Listesi yüklendi!');
    } catch (e) { showTeacherMessage('❌ Hata oluştu.'); }
  };

  const handlePublishHomework = async () => {
    if (!hwText || hwQuestions.some(q => !q.q)) { showTeacherMessage('⚠️ Lütfen metni ve soruları eksiksiz doldurun.'); return; }
    showTeacherMessage('⏳ Ödev gönderiliyor...');
    try {
      const homeworkData = {
        text: hwText.replace(/\*/g, ''),
        questions: hwQuestions.map((q, idx) => ({ id: idx + 1, q: q.q, options: q.options, correct: Number(q.correct) })),
        deadline: hwDeadline || null,
        timestamp: serverTimestamp()
      };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'), homeworkData);
      showTeacherMessage('✅ Ödev sınıfa başarıyla gönderildi!');
    } catch (e) { showTeacherMessage('❌ Ödev gönderilemedi.'); }
  };

  const handleRemoveHomework = async () => {
    if (window.confirm('Aktif ödevi silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'));
        setActiveHomework(null);
        showTeacherMessage('🗑️ Ödev yayından kaldırıldı.');
      } catch (e) { showTeacherMessage('❌ Ödev kaldırılamadı.'); }
    }
  };

  const handleUpdateTeacherPassword = async () => {
    if (!newTeacherPasswordInput || newTeacherPasswordInput.length < 4) { showTeacherMessage("❌ En az 4 hane olmalı."); return; }
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin'), { password: newTeacherPasswordInput.trim() }, { merge: true });
      setNewTeacherPasswordInput(''); showTeacherMessage("✅Şifre güncellendi!");
    } catch (e) { showTeacherMessage("❌ Hata."); }
  };

  const callGeminiAPI = async (topic, selectedLevel, avgWpm, avgScore) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Anahtarı bulunamadı.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');
    const categories = ['renk', 'hayvan', 'meyve', 'aile üyesi', 'giysi', 'oyuncak', 'duygu', 'doğa (ağaç, çiçek, bulut vb.)'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    let levelInstructions = selectedLevel === '1' ? "KOLAY SEVİYE: Kesinlikle 30 ile 50 kelime arasında yaz." : selectedLevel === '2' ? "ORTA SEVİYE: Kesinlikle 50 ile 90 kelime arasında yaz." : "ZOR SEVİYE: Kesinlikle 90 ile 140 kelime arasında yaz.";

    const adaptiveInstruction = avgWpm > 0
      ? `ÖĞRENCİ PROFİLİ (UYARLANABİLİR EĞİTİM): Bu öğrencinin geçmiş okuma hızı ortalaması ${avgWpm} WPM ve okuduğunu anlama skoru ortalaması ${avgScore.toFixed(1)}/2. Lütfen metnin zorluğunu, kelime uzunluklarını ve anlamsal derinliğini bu öğrencinin seviyesini bir adım ileriye taşıyacak şekilde pedagojik olarak uyarla. Eğer hızı 40 WPM altındaysa karmaşık heceler (str, kr) kullanma. Anlama skoru 1.5'in altındaysa daha somut ve net olaylar kurgula.`
      : `ÖĞRENCİ PROFİLİ: Bu öğrenci sistemi ilk kez kullanıyor. Standart 1. sınıf seviyesinde doğal ve pedagojik bir metin üret.`;

    const prompt = `Sen Türkçe dilini kusursuz, son derece doğal ve insansı bir şekilde kullanan ödüllü bir çocuk edebiyatı yazarı ve şefkatli bir 1. sınıf öğretmenisin. Konu: "${topic}". 
    Şu kurallara SIKI SIKIYA UYMALISIN:
    ${levelInstructions}
    ${adaptiveInstruction}
    EDEBI KALİTE: Cümleler birbirini kusursuzca tamamlamalı, sürükleyici ve doğal bir Türkçe ile yazılmalıdır.
    HAZİNE AVI: Hikayenin içine kesinlikle "${randomCategory}" kategorisine ait 3 farklı kelimeyi zorlama olmadan, çok doğal bir şekilde kurguya yedirerek yerleştir.
    DİKKAT KESİNLİKLE YASAK: Gizli kelimeleri veya metindeki herhangi bir kelimeyi ** (yıldız) veya başka bir işaretle ASLA VURGULAMA! Metin tamamen düz yazı olsun.
    Karakter isimlerini şu listeden seç: ${studentNamesStr || 'Ali, Elif'}.
    
    YALNIZCA JSON formatında cevap ver: targetWords içine kelimenin metinde geçen TAMP TAMINA ek almış halini küçük harfle yaz. category içine seçtiğin kategorinin KISA adını büyük harflerle yaz (Örn: HAYVAN, RENK, DUYGU).
    { 
      "text": "Hikaye metni buraya...", 
      "questions": [ { "id": 1, "q": "Soru 1?", "options": ["A", "B", "C"], "correct": 0 }, { "id": 2, "q": "Soru 2?", "options": ["A", "B", "C"], "correct": 1 } ],
      "treasureHunt": { "category": "${randomCategory.split(' (')[0].toUpperCase()}", "targetWords": ["kelime1", "kelime2", "kelime3"] }
    }`;

    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };

    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
      const data = await response.json();
      const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
      if (parsedData.text) parsedData.text = parsedData.text.replace(/\*/g, '');
      return parsedData;
    } catch (err) {
      console.error("❌ YAPAY ZEKA FONKSİYON HATASI:", err);
      throw err;
    }
  };

  const handleGenerateHomeworkAI = async () => {
    let topicToUse = hwTopic.trim();
    if (!topicToUse) {
      const RANDOM_TOPICS = ['Doğa 🌳', 'Hayvanlar 🐱', 'Uzay 🪐', 'Dostluk 🤝', 'Masal Dünyası 🧚'];
      topicToUse = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    }
    setIsGeneratingHw(true); showTeacherMessage(`⏳ Yapay zeka '${topicToUse}' konusunda ödev hazırlıyor...`);
    try {
      const aiData = await callGeminiAPI(topicToUse, hwLevel, 0, 0);
      setHwText(aiData.text);
      setHwQuestions(aiData.questions);
      showTeacherMessage("✨ Ödev başarıyla oluşturuldu! Düzenleyip sınıfa gönderebilirsiniz.");
    } catch (err) {
      showTeacherMessage("❌ Sunucu şuan çok yoğun daha sonra tekrar deneyiniz.");
    } finally { setIsGeneratingHw(false); }
  };

  const evaluateReadingWithAI = async (text, timeSeconds, wpm, compScore, maxScore, audioDataUrl) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const parts = [{ text: `Sen şefkatli bir öğretmensin. Metin: "${text}". Hız: ${wpm} wpm. Skor: ${compScore}/${maxScore}. JSON formatında 1-5 arası puanla ve şefkatli geri bildirim yaz: { "akicilik": 4, "telaffuz": 5, "anlama": 5, "okuma_hizi": 4, "geribildirim": "Harika!" }` }];
    if (audioDataUrl) { try { parts.push({ inlineData: { mimeType: "audio/webm", data: audioDataUrl.split(',')[1] } }); } catch (e) { } }
    const payload = { contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } };
    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) { return { akicilik: 5, telaffuz: 5, anlama: 5, okuma_hizi: 5, geribildirim: "Harika bir okuma yaptın! 🌟" }; }
  };

  const validateStudent = () => {
    if (!studentName || !studentPassword) { setLoginError('Lütfen ismini seç ve şifreni gir.'); return false; }
    const matchedStudent = students.find(s => s.name === studentName);
    if (!matchedStudent) { setLoginError('Sınıf listesinde adın bulunamadı.'); return false; }
    if (matchedStudent.password !== studentPassword) { setLoginError('Hatalı şifre! Tekrar dene.'); return false; }
    setLoginError(''); return true;
  };

  const handleLoginSubmit = () => {
    if (validateStudent()) {
      setIsAuthenticated(true);
      if (rememberMe) {
        saveProfileDataLocally();
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRememberMe(false);
    localStorage.removeItem('okumaMaceramProfile');
    setStudentName('');
    setStudentPassword('');
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
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) { setLoginError('Lütfen en az bir konu seç.'); return; }
    await saveProfileDataLocally();
    await startReadingSession(combinedInterest, level, false);
  };

  const handleStartHomework = async () => {
    if (!activeHomework) return;
    await saveProfileDataLocally();
    await startReadingSession('Sınıf Ödevi', 'Ödev', true);
  };

  const startReadingSession = async (currentInterest, currentLevel, isHomework) => {
    setInterest(currentInterest); setLevel(currentLevel); setAnswers({}); setHasRetried(false); setAudioUrl(null); setIsReadingFinished(false); setShowHeceler(false); setFoundWords([]);
    setShowBadgeAnimation(false); setBadgeInCorner(false); setTeleprompterIndex(-1); setTeleprompterActive(false);

    const studentPastStats = stats.filter(s => s.name === studentName);
    let avgWpm = 0; let avgScore = 0;
    if (studentPastStats.length > 0) {
      avgWpm = Math.round(studentPastStats.reduce((acc, curr) => acc + (Number(curr.wpm) || 0), 0) / studentPastStats.length);
      avgScore = studentPastStats.reduce((acc, curr) => acc + (Number(curr.compScore) || 0), 0) / studentPastStats.length;
    }

    if (isHomework) {
      setStoryData(activeHomework); setView('reading-ready');
    } else {
      setIsGeneratingStory(true);
      try {
        const aiData = await callGeminiAPI(currentInterest, currentLevel, avgWpm, avgScore);
        setStoryData(aiData); setView('reading-ready');
      } catch (err) {
        setLoginError("Sunucu şu an yoğun, daha sonra tekrar deneyin."); setView('student-setup');
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
    if (correctCount < storyData.questions.length && !hasRetried) { setHasRetried(true); setView('reading-active'); } else calculateFinalResult();
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
      } catch (e) { console.error("Ses yükleme hatası", e); }
      setIsUploading(false);
    }

    const maxScore = storyData.questions.length;
    const aiEvaluation = await evaluateReadingWithAI(storyData.text, tempStats.timeSeconds, tempStats.wpm, correctCount, maxScore, audioUrl);

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

    const newResult = { name: studentName, avatar: studentAvatar, interest: interest, level: level, words: tempStats.words, timeSeconds: tempStats.timeSeconds, wpm: tempStats.wpm, compScore: correctCount, maxScore: maxScore, badge: earnedBadge, audioUrl: firebaseAudioUrl || null, aiEvaluation, streakAchieved: currentStreak, date: fullDateTime, timestamp: serverTimestamp() };

    setReadingResult(newResult); setIsEvaluating(false); setView('result');
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult); } catch (e) { }
  };

  const renderStoryText = () => {
    if (!storyData || !storyData.text) return null;
    const targetWordsLower = (storyData.treasureHunt?.targetWords || []).map(w => w.toLowerCase('tr-TR'));

    let currentWordIndexTracker = 0;

    return storyData.text.split(/(\s+)/).map((wordOrSpace, idx) => {
      if (!wordOrSpace.trim()) return <span key={idx}>{wordOrSpace}</span>;
      const currentWordIndex = currentWordIndexTracker++;

      const match = wordOrSpace.match(/^([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)([a-zA-ZğüşıöçĞÜŞİÖÇ]+)([^a-zA-ZğüşıöçĞÜŞİÖÇ]*)$/);
      if (!match) return <span key={idx}>{wordOrSpace}</span>;

      const before = match[1]; const cleanWord = match[2]; const after = match[3];
      const lowerCleanWord = cleanWord.toLowerCase('tr-TR');

      const isTarget = targetWordsLower.includes(lowerCleanWord);
      const isFound = foundWords.includes(lowerCleanWord);

      const handleWordClick = () => {
        if (!isReadingFinished) return; // YENİ: Sadece 'Bitirdim' dedikten sonra tıklanabilir.
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

      // YENİ: Gizli kelimeler okunurken normal görünecek. Bulunup Tıklandığında parlayacak.
      let wordContainerClass = "";
      if (isFound) {
        wordContainerClass = "bg-green-300 text-green-900 rounded-lg px-1 transition-all duration-300 scale-110 inline-block shadow-sm font-black";
      } else if (teleprompterActive && teleprompterIndex === currentWordIndex) {
        wordContainerClass = "bg-amber-300 text-slate-900 rounded-lg px-1 transition-all duration-200 scale-[1.05] inline-block shadow-md";
      } else if (isReadingFinished && isTarget) {
        wordContainerClass = "cursor-pointer hover:bg-sky-100 transition-all rounded-lg px-1 inline-block";
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
        content = <>{heceler.map((hece, hIdx) => (<span key={hIdx} className={hIdx % 2 === 0 ? "text-red-600" : "text-black"}>{hece}</span>))}</>;
      }
      return <span key={idx} onClick={handleWordClick} className={wordContainerClass}>{before}{content}{after}</span>;
    });
  };

  const displayName = savedProfile ? savedProfile.studentName : studentName;
  const displayAvatar = savedProfile ? (savedProfile.avatar || studentAvatar) : studentAvatar;
  const myBadgeCount = stats.filter(s => s.name === displayName && s.badge).length;
  const myStats = stats.filter(s => s.name === displayName);
  const lastStat = myStats[0];
  const topicColors = ['#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#01CBC6'];
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative overflow-x-hidden font-sans text-slate-800 bg-slate-50" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── KÜRESEL STİLLER, ANİMASYONLAR VE YAZICI AYARLARI ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
        
        @keyframes om-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes om-twinkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        @keyframes om-bob { 0%,100%{transform:translateY(0px) rotate(-3deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
        @keyframes pendulum { 0%{transform:translateX(-35vw)} 50%{transform:translateX(35vw)} 100%{transform:translateX(-35vw)} }
        
        .om-f1{animation:om-float 3s ease-in-out infinite}
        .om-f2{animation:om-float 3.6s ease-in-out infinite .4s}
        .om-f3{animation:om-float 2.8s ease-in-out infinite .9s}
        .om-tw1{animation:om-twinkle 2s ease-in-out infinite}
        .om-bob{animation:om-bob 3.5s ease-in-out infinite}
        .animate-pendulum{animation:pendulum 3s infinite ease-in-out}
        
        @media print {
          body * { visibility: hidden; background: white !important; }
          #print-section, #print-section * { visibility: visible; color: black !important; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── PROFİL MODALI VE ÇIKIŞ YAP BUTONU (Taşma Sorunu Çözüldü) ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative border-8 border-sky-200 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProfileModal(false)} className="sticky top-0 float-right z-50 bg-slate-100 p-3 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={24} /></button>

            <div className="flex flex-col items-center clear-both">
              <div className="w-28 h-28 rounded-full bg-sky-100 text-6xl flex items-center justify-center mb-4 shadow-inner ring-8 ring-sky-50 drop-shadow-md">
                {displayAvatar?.startsWith('data') ? <img src={displayAvatar} className="w-full h-full object-cover rounded-full" alt="" /> : (displayAvatar || '👤')}
              </div>
              <h2 className="text-3xl font-black text-sky-900">{displayName || 'Misafir'}</h2>

              <div className="mt-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg flex items-center gap-2 border-2 border-indigo-400">
                {RANKS[academyLevel - 1].icon} {RANKS[academyLevel - 1].name}
              </div>
            </div>

            {/* Rütbe Vitrini */}
            <div className="mt-8 grid grid-cols-4 gap-2 md:gap-3">
              {RANKS.map(r => (
                <div key={r.lvl} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-4 transition-all ${academyLevel >= r.lvl ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-50'}`}>
                  <span className="text-2xl md:text-3xl drop-shadow-sm">{r.icon}</span>
                  {academyLevel < r.lvl && <Lock size={14} className="text-slate-400 mt-2" />}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4 mb-8">
              <div className="bg-sky-50 p-5 rounded-3xl border-4 border-sky-100 flex items-center justify-between shadow-sm">
                <div className="font-black text-sky-800 flex items-center gap-3 text-md md:text-lg"><BookOpen className="text-sky-500" /> Kelime Kumbarası</div>
                <div className="text-2xl md:text-3xl font-black text-sky-600">{myStats.reduce((acc, curr) => acc + (Number(curr.words) || 0), 0)}</div>
              </div>
              <div className="bg-fuchsia-50 p-5 rounded-3xl border-4 border-fuchsia-100 shadow-sm">
                <div className="font-black text-fuchsia-800 text-lg mb-4 flex items-center gap-2"><Trophy className="text-fuchsia-500" /> Başarı Vitrini</div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white px-4 md:px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border-2 border-fuchsia-200">
                    <span className="text-2xl md:text-3xl drop-shadow-md">🕵️‍♂️</span>
                    <span className="font-black text-fuchsia-700 text-xl">x {myBadgeCount}</span>
                  </div>
                  {teacherStars > 0 && (
                    <div className="bg-white px-4 md:px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm border-2 border-amber-300 animate-pulse">
                      <span className="text-2xl md:text-3xl drop-shadow-md">🌟</span>
                      <span className="font-black text-amber-600 text-xl">x {teacherStars}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => { handleLogout(); setShowProfileModal(false); }} className="w-full bg-rose-100 text-rose-600 py-4 rounded-2xl font-black text-lg border-4 border-rose-200 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
              🚪 Çıkış Yap / Başka Öğrenci
            </button>
          </div>
        </div>
      )}

      {/* ── ÖĞRETMEN YILDIZ HEDİYE ANİMASYONU ── */}
      {showTeacherStarGift && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-amber-300 text-center animate-bounce cursor-pointer max-w-xl" onClick={() => setShowTeacherStarGift(false)}>
            <span className="text-[8rem] block mb-6 drop-shadow-2xl">🎁</span>
            <h2 className="text-5xl font-black text-amber-600 leading-tight">Sürpriz Paketin Var!</h2>
            <p className="text-2xl font-bold text-amber-800 mt-4">Arif Öğretmenin sana özel bir yıldız gönderdi! 🌟</p>
            <button className="mt-10 bg-amber-500 text-white px-12 py-5 rounded-full font-black text-2xl shadow-[0_6px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none transition-all">PAKETİ AÇ</button>
          </div>
        </div>
      )}

      {/* DEDEKTİF ROZETİ KAZANMA ANİMASYONU */}
      {showBadgeAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-white/60 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl flex flex-col items-center animate-bounce border-8 border-amber-300 text-center max-w-xl">
            <span className="text-9xl mb-6 drop-shadow-2xl">🕵️‍♂️</span>
            <h2 className="text-5xl font-black text-amber-600 leading-tight">Harika Bir Dikkat!</h2>
            <p className="text-2xl font-bold text-amber-800 mt-4">Gerçek bir Okuma Dedektifi olduğunu kanıtladın! 🌟</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ANA EKRAN (GÖKKUŞAĞI, BULUTLAR VE OYUN KARTLARI)
      ══════════════════════════════════════════════════════════════════ */}
      {view === 'student-setup' && !isGeneratingStory && (
        <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-300 to-emerald-400 flex flex-col relative overflow-hidden">

          {/* Süslemeler (Bulutlar, Yıldızlar, Dinozor) */}
          <Cloud style={{ top: '5%', left: '5%' }} />
          <Cloud style={{ top: '15%', right: '10%', transform: 'scale(0.8)' }} />
          <Cloud style={{ top: '45%', left: '-5%', transform: 'scale(0.6)' }} />

          <div className="om-tw1 absolute top-[20%] right-[15%] text-4xl z-10 drop-shadow-md">⭐</div>
          <div className="om-tw2 absolute top-[40%] left-[10%] text-3xl z-10 drop-shadow-md">✨</div>
          <div className="om-bob absolute top-[12%] right-[5%] z-10 text-5xl drop-shadow-xl">🏔️<span className="text-2xl">👾</span></div>

          {/* Dinozor (Sabit ve Ortadaki paneli etkilemez) */}
          <div className="fixed bottom-0 left-4 z-40 text-[6rem] md:text-[8rem] drop-shadow-2xl pointer-events-none" style={{ transform: 'scaleX(-1)' }}>🦕</div>

          {/* Üst Navigasyon Çubuğu */}
          <div className="w-full flex flex-col xl:flex-row items-center justify-between p-4 md:p-8 z-50 gap-6">

            {/* Sol: Profil Butonu */}
            <button onClick={() => isAuthenticated ? setShowProfileModal(true) : null} className={`flex items-center gap-3 p-2 pr-6 rounded-full shadow-xl border-4 ${isAuthenticated ? 'border-amber-300 bg-gradient-to-b from-amber-400 to-amber-500 cursor-pointer hover:scale-105 transition-transform' : 'border-slate-300 bg-slate-200 cursor-default'}`}>
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white text-3xl shadow-inner border-4 border-white/50 flex-shrink-0">
                {displayAvatar?.startsWith('data') ? <img src={displayAvatar} className="w-full h-full object-cover" alt="" /> : (displayAvatar)}
              </div>
              <div className="text-left text-white drop-shadow-md">
                <div className="font-black text-xl leading-tight">{isAuthenticated ? displayName.split(' ')[0] : 'Giriş Bekleniyor'}</div>
                {isAuthenticated && <div className="text-sm font-bold text-amber-100 flex items-center gap-1">🕵️ Rozet: {myBadgeCount}</div>}
              </div>
            </button>

            {/* Orta: GÖSTERİŞLİ VE ORİJİNAL FONT BAŞLIK */}
            <div className="flex-1 flex justify-center w-full">
              <h1 className="text-4xl md:text-[5.5rem] font-black tracking-tight drop-shadow-[0_6px_0_rgba(0,0,0,0.2)] text-center leading-none">
                <span className="text-rose-500">O</span><span className="text-orange-500">K</span><span className="text-amber-400">U</span><span className="text-emerald-500">M</span><span className="text-sky-500">A</span>
                <br className="xl:hidden" />
                <span className="text-fuchsia-500 xl:ml-6">M</span><span className="text-rose-500">A</span><span className="text-orange-500">C</span><span className="text-amber-400">E</span><span className="text-emerald-500">R</span><span className="text-sky-500">A</span><span className="text-indigo-500">S</span><span className="text-rose-500">I</span>
              </h1>
            </div>

            {/* Sağ: Öğretmen Girişi */}
            <button onClick={() => setView('teacher-login')} className="flex items-center gap-3 p-3 px-6 rounded-full shadow-xl border-4 border-amber-600 bg-gradient-to-b from-amber-600 to-amber-700 text-white font-black hover:scale-105 transition-transform cursor-pointer flex-shrink-0">
              <span className="text-sm md:text-lg">1/A SINIFI – ARİF ÖĞRETMEN</span>
              <span className="text-2xl drop-shadow-md">🔔</span>
            </button>
          </div>

          {/* ── İÇERİK ALANI ── */}
          <div className="flex-1 flex flex-col items-center justify-center w-full z-20 pb-32 px-4">

            {/* GÜVENLİK KAPISI: GİRİŞ EKRANI */}
            {!isAuthenticated ? (
              <div className="bg-white/95 backdrop-blur-md rounded-[3rem] p-8 md:p-12 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-8 border-white animate-in zoom-in duration-300">
                <div className="text-center mb-8">
                  <div className="text-7xl mb-4 om-f1 drop-shadow-xl">🚀</div>
                  <h2 className="text-4xl font-black text-sky-600">Maceraya Katıl!</h2>
                  <p className="text-slate-500 font-bold mt-2 text-lg">Lütfen ismini seç ve şifreni gir.</p>
                </div>

                <div className="space-y-4">
                  <select value={studentName} onChange={e => { setStudentName(e.target.value); setLoginError(''); }} className="w-full p-4 border-4 border-sky-200 rounded-2xl font-black text-xl text-sky-800 bg-sky-50 outline-none cursor-pointer focus:border-sky-400 transition-colors">
                    <option value="">İsmini Seç...</option>
                    {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>

                  <input type="password" value={studentPassword} onChange={e => { setStudentPassword(e.target.value); setLoginError(''); }} onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()} className="w-full p-4 border-4 border-sky-200 rounded-2xl font-black text-3xl tracking-[1em] text-center text-sky-800 bg-sky-50 outline-none focus:border-sky-400 transition-colors" placeholder="••••" maxLength={4} />

                  {loginError && (
                    <div className="bg-rose-100 border-2 border-rose-300 p-3 rounded-xl">
                      <p className="text-rose-600 font-black text-center">❌ {loginError}</p>
                    </div>
                  )}

                  <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center justify-center gap-3 py-2 cursor-pointer group">
                    <div className={`w-7 h-7 rounded-lg border-4 flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                      {rememberMe && <Check size={16} className="text-white font-black" />}
                    </div>
                    <span className="font-black text-slate-600 text-lg group-hover:text-indigo-600 transition-colors">Bu cihazda beni hatırla</span>
                  </div>

                  <button onClick={handleLoginSubmit} className="w-full bg-gradient-to-b from-sky-400 to-sky-500 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_6px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none transition-all mt-4 tracking-wide">
                    GİRİŞ YAP 🚀
                  </button>
                </div>
              </div>
            ) : (

              /* ── 3 DEVASA MACERA KARTI ── */
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 w-full max-w-6xl animate-in slide-in-from-bottom-10 duration-500">

                {/* 1. ÖDEV KARTI (Yeşil Daire) */}
                <div className="flex flex-col items-center">
                  <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full bg-white border-8 border-slate-100 shadow-2xl flex flex-col items-center justify-start overflow-hidden hover:-translate-y-2 transition-transform">
                    <div className="w-full h-[55%] bg-gradient-to-b from-emerald-200 to-emerald-400 flex items-end justify-center gap-2 pb-4">
                      <span className="text-4xl drop-shadow-md">🌳</span>
                      <span className="text-6xl drop-shadow-md mb-2">🏫</span>
                      <span className="text-3xl drop-shadow-md mb-4">📚</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <div className="font-black text-slate-400 text-sm tracking-widest mb-1">BUGÜNÜN GÖREVİ:</div>
                      <div className="font-black text-xl md:text-2xl text-slate-800">{activeHomework ? 'SINIF ÖDEVİ' : 'ÖDEV YOK'}</div>
                    </div>
                  </div>
                  <button onClick={activeHomework ? handleStartHomework : null} className={`-mt-8 z-10 px-10 py-4 rounded-full font-black text-xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all border-4 border-white/50 ${activeHomework ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    {activeHomework ? 'BAŞLAT 🚀' : 'BEKLİYOR...'}
                  </button>
                </div>

                {/* 2. HİKAYE KEŞFİ KARTI (Sarı Dikdörtgen) */}
                <div className="w-full max-w-[300px] md:max-w-none md:w-[360px] mx-auto bg-gradient-to-b from-amber-300 to-orange-400 border-8 border-orange-500 rounded-[2.5rem] p-6 shadow-2xl hover:-translate-y-2 transition-transform flex flex-col">
                  <div className="relative h-32 flex items-center justify-center w-full mb-2">
                    <span className="absolute top-0 left-4 text-4xl bg-white rounded-full p-2 shadow-md om-f1">🦖</span>
                    <span className="absolute top-2 right-4 text-4xl bg-white rounded-full p-2 shadow-md om-f2">🪐</span>
                    <span className="absolute bottom-0 right-10 text-3xl bg-white rounded-full p-2 shadow-md om-f3">👑</span>
                    <span className="text-7xl drop-shadow-2xl z-10 relative">🚀</span>
                  </div>
                  <h3 className="text-center font-black text-orange-900 text-2xl mb-4">HİKAYE KEŞFİ</h3>

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {PREDEFINED_TOPICS.slice(0, 6).map((t, i) => (
                      <button key={t} onClick={() => setSelectedTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} className={`px-3 py-1.5 rounded-full font-black text-sm transition-colors border-2 shadow-sm ${selectedTopics.includes(t) ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white/90 text-orange-900 border-white hover:bg-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Veya başka konu yaz..." className="w-full p-3 rounded-xl border-4 border-white/60 bg-white/90 font-black text-sm outline-none focus:border-white text-orange-900 mb-4 placeholder-orange-400" />

                  <div className="flex gap-2 mb-6">
                    {[{ id: '1', l: '🌱 Kolay' }, { id: '2', l: '📚 Orta' }, { id: '3', l: '🔥 Zor' }].map(lv => (
                      <button key={lv.id} onClick={() => setLevel(lv.id)} className={`flex-1 py-2 rounded-xl font-black text-sm border-2 transition-colors shadow-sm ${level === lv.id ? 'bg-orange-600 text-white border-orange-800' : 'bg-white/80 text-orange-900 border-white hover:bg-white'}`}>{lv.l}</button>
                    ))}
                  </div>

                  <button onClick={handleStartFreeReading} className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-2 active:shadow-none transition-all border-4 border-orange-200 mt-auto">
                    OKUMAYA BAŞLA ⭐
                  </button>
                </div>

                {/* 3. AKADEMİ KARTI (Mavi Dikdörtgen) */}
                <div className="w-full max-w-[300px] md:max-w-none md:w-[340px] mx-auto bg-gradient-to-b from-indigo-400 to-indigo-700 border-8 border-indigo-800 rounded-[2.5rem] p-6 shadow-2xl hover:-translate-y-2 transition-transform flex flex-col items-center justify-between">
                  <div className="text-7xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] mb-4">🏔️<span className="text-4xl">🏯</span></div>
                  <h3 className="text-center font-black text-white text-2xl mb-6 leading-tight drop-shadow-md">HIZLI OKUMA<br />AKADEMİSİ</h3>

                  <div className="w-full grid grid-cols-2 gap-3 mb-6">
                    {RANKS.map(r => (
                      <div key={r.lvl} className={`rounded-xl p-3 text-center border-2 shadow-sm ${academyLevel >= r.lvl ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-600' : 'bg-white/10 border-white/20'}`}>
                        <div className="text-2xl drop-shadow-sm mb-1">{r.icon}</div>
                        <div className={`font-black text-xs leading-tight ${academyLevel >= r.lvl ? 'text-amber-900' : 'text-white/60'}`}>{r.name}</div>
                        <div className={`font-black text-[10px] mt-1 ${academyLevel >= r.lvl ? 'text-amber-800' : 'text-white/40'}`}>Lvl {r.lvl}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { setView('academy-menu'); }} className="w-full bg-indigo-900 text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_rgb(30,27,75)] active:translate-y-2 active:shadow-none transition-all border-2 border-indigo-400 flex items-center justify-center gap-2 mt-auto">
                    ANTRENMANA BAŞLA 💪
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ALT BİLGİ VE ATEŞ SERİSİ ÇUBUĞU (Ortalanmış ve Güvenli) ── */}
          {isAuthenticated && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 w-full md:w-auto justify-center px-4">
              {lastStat && (
                <div className="bg-slate-900/80 backdrop-blur-md border-2 border-white/20 rounded-full px-6 py-3 text-white font-black text-sm md:text-lg flex items-center gap-4 shadow-2xl">
                  <span>WPM: <span className="text-amber-400">{lastStat.wpm}</span> 🔥</span>
                  <span className="w-1 h-1 rounded-full bg-white/30"></span>
                  <span>Skor: <span className="text-emerald-400">{lastStat.compScore}/{lastStat.maxScore}</span> ⭐</span>
                </div>
              )}
              {(savedProfile?.streak || 0) > 0 && (
                <div className="bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-amber-200 rounded-full px-5 py-3 text-white font-black text-lg flex items-center gap-2 shadow-2xl animate-pulse">
                  <Flame size={20} className="drop-shadow-md" /> {savedProfile.streak}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DİĞER TÜM İÇ EKRANLAR (Hikaye, Akademi, Öğretmen Paneli)
      ══════════════════════════════════════════════════════════════════ */}
      {(view !== 'student-setup' || isGeneratingStory) && (
        <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 flex flex-col relative pt-8 pb-12">

          {/* İç Ekranlar Üst Profil Butonu */}
          {!['teacher-login', 'teacher'].includes(view) && !isGeneratingStory && (
            <div className="absolute top-4 left-4 flex items-center gap-3 z-50">
              <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white hover:scale-105 transition-transform cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl shadow-inner">
                  {displayAvatar?.startsWith('data') ? <img src={displayAvatar} className="w-full h-full object-cover" alt="" /> : (displayAvatar)}
                </div>
                <span className="font-black text-sky-800 text-xl">{displayName ? displayName.split(' ')[0] : 'Giriş'}</span>
              </button>
              {(savedProfile?.streak || 0) > 0 && (
                <div className="bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-full flex items-center gap-2 shadow-md animate-pulse">
                  <Flame className="text-amber-500" size={20} />
                  <span className="font-black text-amber-700">{savedProfile.streak}</span>
                </div>
              )}
              {badgeInCorner && <div className="animate-pulse drop-shadow-2xl transition-all ml-2"><span className="text-5xl">🕵️‍♂️</span></div>}
            </div>
          )}

          <div className="flex-1 w-full px-4 max-w-6xl mx-auto">

            {/* HİKAYE ÜRETİM YÜKLENİYOR */}
            {isGeneratingStory && (
              <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center animate-in zoom-in duration-300">
                <Loader2 className="w-20 h-20 text-sky-500 animate-spin mx-auto mb-6" />
                <h2 className="text-3xl font-black text-sky-600">Sana Özel Metin Hazırlanıyor...</h2>
                <p className="text-sky-800 font-bold mt-4">Geçmiş okumalarına göre uyarlanıyor 🤖</p>
              </div>
            )}

            {/* AKADEMİ MENÜSÜ */}
            {view === 'academy-menu' && (
              <div className="bg-white/95 p-6 md:p-12 rounded-[3rem] shadow-2xl border-8 border-indigo-300 mt-20 text-center relative max-w-4xl mx-auto w-full">
                <button onClick={() => setView('student-setup')} className="absolute top-4 md:top-6 right-4 md:right-6 bg-slate-100 p-3 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={24} /></button>
                <h2 className="text-3xl md:text-5xl font-black text-indigo-600 mb-4 flex items-center justify-center gap-3"><Eye className="w-8 h-8 md:w-10 md:h-10" /> Hızlı Okuma Akademisi</h2>
                <p className="text-lg md:text-xl font-bold text-slate-500 mb-10">Profesyonel göz eğitim simülatörü. Aşama aşama ilerle!</p>
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <button onClick={() => { setView('academy-warmup-ready'); speakInstruction("Hoş geldin! Şimdi göz kaslarımızı güçlendireceğiz. Ekranda sağa ve sola giden kırmızı topu takip etmeni istiyorum. Ama çok önemli bir kuralımız var: Kafanı kesinlikle çevirme! Sadece gözlerinle takip et. Hazırsan başla butonuna bas!"); }}
                    className="p-8 bg-sky-50 border-4 border-sky-200 rounded-[2rem] hover:bg-sky-100 hover:-translate-y-2 transition-all text-left relative overflow-hidden group shadow-md cursor-pointer">
                    <h3 className="text-2xl font-black text-sky-800 mb-2">1. Isınma (Sarkaç)</h3>
                    <p className="font-bold text-sky-600">Göz kaslarını esnetir. (30sn)</p>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sky-300 text-6xl group-hover:scale-110 transition-transform"><Unlock /></div>
                  </button>
                  <button onClick={() => academyLevel >= 2 ? startSchulte() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-md ${academyLevel >= 2 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:-translate-y-2 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 2 ? 'text-emerald-800' : 'text-slate-500'}`}>2. Schulte Tablosu</h3>
                    <p className={`font-bold ${academyLevel >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>Çevresel görüşünü geliştirir.</p>
                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 text-6xl transition-transform ${academyLevel >= 2 ? 'text-emerald-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 2 ? <Unlock /> : <Lock />}</div>
                  </button>
                  <button onClick={() => academyLevel >= 3 ? startFlash() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-md ${academyLevel >= 3 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:-translate-y-2 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 3 ? 'text-amber-800' : 'text-slate-500'}`}>3. Flaş Kelimeler</h3>
                    <p className={`font-bold ${academyLevel >= 3 ? 'text-amber-600' : 'text-slate-400'}`}>Fotoğrafik algını hızlandırır.</p>
                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 text-6xl transition-transform ${academyLevel >= 3 ? 'text-amber-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 3 ? <Unlock /> : <Lock />}</div>
                  </button>
                  <button onClick={() => academyLevel >= 4 ? startMetronome() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-md ${academyLevel >= 4 ? 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100 hover:-translate-y-2 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 4 ? 'text-fuchsia-800' : 'text-slate-500'}`}>4. Metronome</h3>
                    <p className={`font-bold ${academyLevel >= 4 ? 'text-fuchsia-600' : 'text-slate-400'}`}>Ritmik okuma simülatörü.</p>
                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 text-6xl transition-transform ${academyLevel >= 4 ? 'text-fuchsia-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 4 ? <Unlock /> : <Lock />}</div>
                  </button>
                </div>
              </div>
            )}

            {/* AKADEMİ ALT EKRANLARI */}
            {view === 'academy-warmup-ready' && (
              <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-sky-600 p-4 rounded-full shadow-xl border-4 border-sky-100 hover:bg-sky-50"><ArrowLeft size={24} /></button>
                <h2 className="text-4xl font-black text-sky-600 mb-6">1. Aşama: Isınma</h2>
                <p className="text-2xl font-bold text-sky-800 mb-8">Lütfen cihazın sesini dinle ve yönergeyi anladıktan sonra başla.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                  <button onClick={() => speakInstruction("Hoş geldin! Şimdi göz kaslarımızı güçlendireceğiz. Ekranda sağa ve sola giden kırmızı topu takip etmeni istiyorum. Ama çok önemli bir kuralımız var: Kafanı kesinlikle çevirme! Sadece gözlerinle takip et. Hazırsan başla butonuna bas!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                  <button onClick={stopInstruction} className="bg-rose-100 text-rose-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-rose-200 transition-colors"><div className="w-3 h-3 bg-rose-600 rounded-sm"></div> Sesi Durdur</button>
                </div>
                <button onClick={() => { stopInstruction(); setWarmupTime(30); setView('academy-warmup-active'); }} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_6px_0_rgb(3,105,161)] active:translate-y-2 active:shadow-none transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-warmup-active' && (
              <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center min-h-[50vh] relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-12 left-0 bg-white text-sky-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg border-4 border-sky-100 hover:bg-sky-50"><ArrowLeft /> Geri Dön</button>
                <h2 className="text-3xl font-black text-white bg-sky-500 px-8 py-3 rounded-full mb-12 shadow-lg">Kafanı çevirme, topu sadece gözünle takip et!</h2>
                <div className="text-5xl font-black text-sky-800 mb-8">{warmupTime} <span className="text-2xl text-sky-600">sn</span></div>
                <div className="w-full h-32 flex items-center justify-center bg-white/50 rounded-full border-8 border-white shadow-inner overflow-hidden relative">
                  <div className="w-16 h-16 bg-rose-500 rounded-full shadow-lg animate-pendulum absolute"></div>
                </div>
              </div>
            )}

            {view === 'academy-schulte-ready' && (
              <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-emerald-200 relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-emerald-600 p-4 rounded-full shadow-xl border-4 border-emerald-100 hover:bg-emerald-50"><ArrowLeft size={24} /></button>
                <h2 className="text-4xl font-black text-emerald-600 mb-6">2. Aşama: Schulte Tablosu</h2>
                <p className="text-2xl font-bold text-emerald-800 mb-8">Amacımız: Gözleri merkezde tutup çevresel görüş açısını genişletmek.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                  <button onClick={() => speakInstruction("Harika gidiyorsun! Şimdi bir dedektif gibi sayıları bulacağız. Lütfen gözünü tablonun tam ortasından hiç ayırma ve kenarlardaki sayıları birden dokuza kadar sırayla bulup tıkla. Hazırsan başla!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                  <button onClick={stopInstruction} className="bg-rose-100 text-rose-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-rose-200 transition-colors"><div className="w-3 h-3 bg-rose-600 rounded-sm"></div> Sesi Durdur</button>
                </div>
                <button onClick={() => { stopInstruction(); setView('academy-schulte-active'); }} className="w-full bg-emerald-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-schulte-active' && (
              <div className="max-w-2xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-200">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-emerald-600 p-4 rounded-full shadow-xl border-4 border-emerald-100 hover:bg-emerald-50"><ArrowLeft size={24} /></button>
                <h2 className="text-3xl font-black text-emerald-600 mb-4">Schulte Tablosu</h2>
                <p className="text-xl font-bold text-emerald-800 mb-8">Gözünü ortadan ayırmadan sırayla 1'den 9'a kadar tıkla. <br /> Sıradaki: <span className="text-4xl text-rose-500">{schulteExpected}</span></p>
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto">
                  {schulteGrid.map((num, i) => (
                    <button key={i} onClick={() => handleSchulteClick(num)}
                      className={`h-24 text-4xl font-black rounded-2xl shadow-sm transition-all border-4 ${num < schulteExpected ? 'bg-emerald-100 text-emerald-400 border-emerald-200 scale-95' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:scale-95'}`}>
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'academy-flash-ready' && (
              <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft size={24} /></button>
                <h2 className="text-4xl font-black text-amber-600 mb-6">3. Aşama: Flaş Kelimeler</h2>
                <p className="text-2xl font-bold text-amber-800 mb-6">Amacımız: Hecelemeyi bırakıp kelimeleri fotoğraf gibi tek seferde zihne kazımak.</p>
                <div className="bg-amber-50 p-4 rounded-2xl border-4 border-amber-100 mb-8">
                  <p className="font-black text-amber-800 mb-4">Kendine uygun hızı seç:</p>
                  <div className="flex gap-3">
                    <button onClick={() => setFlashSpeed(2000)} className={`flex-1 py-4 rounded-xl font-black text-lg transition-colors ${flashSpeed === 2000 ? 'bg-emerald-400 text-white shadow-inner border-2 border-emerald-500' : 'bg-white text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-50'}`}>🐢 Yavaş (2sn)</button>
                    <button onClick={() => setFlashSpeed(1000)} className={`flex-1 py-4 rounded-xl font-black text-lg transition-colors ${flashSpeed === 1000 ? 'bg-amber-400 text-white shadow-inner border-2 border-amber-500' : 'bg-white text-amber-600 border-2 border-amber-200 hover:bg-amber-50'}`}>🐇 Normal (1sn)</button>
                    <button onClick={() => setFlashSpeed(600)} className={`flex-1 py-4 rounded-xl font-black text-lg transition-colors ${flashSpeed === 600 ? 'bg-rose-400 text-white shadow-inner border-2 border-rose-500' : 'bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50'}`}>🐆 Hızlı (0.6sn)</button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                  <button onClick={() => speakInstruction("Şimdi gözlerinle fotoğraf çekme zamanı! Ekranda bir kelime şimşek gibi parlayıp kaybolacak. Onu aklında tut ve aşağıdaki seçeneklerden doğru olanı bul. Gözünü kırpma, hazırsan başla!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                  <button onClick={stopInstruction} className="bg-rose-100 text-rose-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-rose-200 transition-colors"><div className="w-3 h-3 bg-rose-600 rounded-sm"></div> Sesi Durdur</button>
                </div>
                <button onClick={() => { stopInstruction(); setView('academy-flash-active'); triggerFlashWord(); }} className="w-full bg-amber-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_6px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-flash-active' && (
              <div className="max-w-3xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 min-h-[400px]">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft size={24} /></button>
                <h2 className="text-3xl font-black text-amber-600 mb-2">Flaş Kelimeler</h2>
                <p className="text-xl font-bold text-slate-500 mb-8">Ekranda parlayan kelimeyi zihnine kazı!</p>
                {flashMessage && <div className="text-2xl font-black text-emerald-500 mb-8">{flashMessage}</div>}
                {isFlashShowing ? (
                  <div className="text-[5rem] md:text-8xl font-black text-slate-800 tracking-tight my-10 animate-in fade-in duration-150 drop-shadow-md">{flashWordsData[flashStage].w}</div>
                ) : (
                  !flashMessage && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                      <p className="text-2xl font-black text-amber-800 mb-8">Az önce ne gördün?</p>
                      <div className="grid grid-cols-3 gap-4">
                        {flashWordsData[flashStage].o.map((opt, i) => (
                          <button key={i} onClick={() => handleFlashAnswer(opt, flashWordsData[flashStage].w)} className="p-8 bg-amber-50 border-4 border-amber-200 rounded-3xl text-3xl font-black text-amber-700 hover:bg-amber-100 active:scale-95 transition-transform shadow-sm">{opt}</button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {view === 'academy-metronome-ready' && (
              <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft size={24} /></button>
                <h2 className="text-4xl font-black text-fuchsia-600 mb-6">4. Aşama: Metronomlu Okuma</h2>
                <p className="text-2xl font-bold text-fuchsia-800 mb-8">Amacımız: Ritim sayesinde geriye dönük okuma hatalarını (regresyon) engellemek.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                  <button onClick={() => speakInstruction("İşte büyük görev! Arka planda çalan tik-tak sesinin ritmine uyarak ekrana gelen kelimeleri sesli bir şekilde oku. Ritimden hiç kopma. Hazırsan macerayı başlat!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                  <button onClick={stopInstruction} className="bg-rose-100 text-rose-700 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 hover:bg-rose-200 transition-colors"><div className="w-3 h-3 bg-rose-600 rounded-sm"></div> Sesi Durdur</button>
                </div>
                <button onClick={() => { stopInstruction(); setView('academy-metronome-active'); setMetronomeIndex(0); }} className="w-full bg-fuchsia-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_6px_0_rgb(162,28,175)] active:translate-y-2 active:shadow-none transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-metronome-active' && (
              <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 min-h-[500px]">
                <button onClick={() => { setView('academy-menu'); setMetronomeIndex(-1); }} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft size={24} /></button>
                {metronomeIndex < metronomeChunks.length ? (
                  <>
                    <div className="w-full max-w-sm mb-12 bg-fuchsia-50 p-6 rounded-3xl border-4 border-fuchsia-100 shadow-sm">
                      <label className="block text-xl font-black text-fuchsia-800 mb-4">Metronom Hızı: <span className="text-fuchsia-600 bg-white px-3 py-1 rounded-lg border-2 border-fuchsia-200">{metronomeBPM}</span> BPM</label>
                      <input type="range" min="10" max="150" step="10" value={metronomeBPM} onChange={(e) => setMetronomeBPM(Number(e.target.value))} className="w-full accent-fuchsia-600 cursor-pointer" />
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <span className="text-[5rem] md:text-[8rem] font-black text-fuchsia-800 tracking-tight leading-none drop-shadow-md">{metronomeChunks[metronomeIndex]}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="text-7xl animate-bounce drop-shadow-lg">🎉</div>
                    <h2 className="text-5xl font-black text-emerald-600">Mükemmel Odaklanma!</h2>
                    <p className="text-2xl font-bold text-emerald-800">Metronom ritmi geriye dönüşleri başarıyla engelledi.</p>
                    <button onClick={() => setView('academy-menu')} className="bg-emerald-500 text-white px-10 py-5 rounded-2xl text-2xl font-black shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none hover:bg-emerald-400 transition-all mt-6">Akademiye Dön</button>
                  </div>
                )}
              </div>
            )}

            {/* OKUMA ÖNCESİ EKRAN */}
            {view === 'reading-ready' && (
              <div className="max-w-2xl mx-auto bg-white/95 p-8 md:p-12 rounded-[3rem] shadow-2xl mt-24 text-center animate-in slide-in-from-bottom-10 border-8 border-sky-200 w-full">
                <h2 className="text-4xl md:text-5xl font-black text-amber-600 mb-10 drop-shadow-sm">Hazır mısın?</h2>
                {micError && <div className="bg-rose-100 text-rose-700 p-4 rounded-xl font-bold mb-8 flex items-center justify-center gap-2 border-2 border-rose-300"><Mic size={24} /> {micError}</div>}
                <div className="flex gap-4 md:gap-6 flex-col md:flex-row">
                  <button onClick={() => beginTimer(false)} className="flex-1 bg-sky-500 text-white py-6 md:py-8 rounded-3xl text-xl md:text-2xl font-black shadow-[0_8px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none hover:bg-sky-400 transition-all">SESSİZ OKU 📖</button>
                  <button onClick={() => beginTimer(true)} className="flex-1 bg-rose-500 text-white py-6 md:py-8 rounded-3xl text-xl md:text-2xl font-black flex items-center justify-center gap-3 shadow-[0_8px_0_rgb(225,29,72)] active:translate-y-2 active:shadow-none hover:bg-rose-400 transition-all"><Mic size={32} /> SESLİ OKU</button>
                </div>
              </div>
            )}

            {/* AKTİF OKUMA EKRANI */}
            {view === 'reading-active' && (
              <div className="max-w-5xl mx-auto mt-12 space-y-8 relative">

                {/* YENİ HAZİNE AVI BANNER'I (SADECE OKUMA BİTİNCE ÇIKAR) */}
                {isReadingFinished && storyData?.treasureHunt && (
                  <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-md border-4 border-amber-400 p-4 md:p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center shadow-inner border-2 border-amber-300 flex-shrink-0">
                        <Search className="text-amber-600 w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="font-black text-amber-900 text-xl md:text-2xl">Dedektif Görevi!</h4>
                        <p className="font-bold text-amber-800 text-lg md:text-xl">
                          Metindeki gizli <span className="font-black text-rose-600 text-2xl px-1">{storyData.treasureHunt.category}</span> kelimelerini bulup tıkla!
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50 px-8 py-3 rounded-2xl border-4 border-amber-200 font-black text-amber-600 text-4xl text-center shadow-inner flex-shrink-0">
                      {foundWords.length} / {storyData.treasureHunt.targetWords.length}
                    </div>
                  </div>
                )}

                {/* OKUMA METNİ */}
                <div className="bg-white p-6 md:p-14 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative mt-8">
                  <div className="absolute -top-6 right-4 md:right-8 z-10 w-full md:w-auto px-4 md:px-0 flex justify-center gap-2 md:gap-4 flex-wrap">
                    <button onClick={() => setTeleprompterActive(!teleprompterActive)}
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-black flex items-center gap-2 transition-all duration-300 shadow-xl border-4 border-amber-400 text-sm md:text-lg ${teleprompterActive ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.8)]' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 animate-pulse'}`}>
                      <Zap size={20} className="md:w-6 md:h-6" /> ODAK IŞIĞI {teleprompterActive ? 'AÇIK' : 'KAPALI'}
                    </button>
                    <button onClick={() => setShowHeceler(!showHeceler)}
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-black flex items-center gap-2 transition-all duration-300 shadow-xl border-4 border-fuchsia-400 text-sm md:text-lg ${showHeceler ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)]' : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 animate-pulse'}`}>
                      <Sparkles size={20} className="md:w-6 md:h-6" /> HECEMATİK {showHeceler ? 'AÇIK' : 'KAPALI'}
                    </button>
                  </div>
                  {teleprompterActive && !isReadingFinished && (
                    <div className="bg-amber-50 p-4 md:p-6 border-4 border-amber-200 mt-6 md:mt-2 mb-4 rounded-3xl flex flex-col md:flex-row items-center gap-4 shadow-inner">
                      <span className="font-black text-amber-800 whitespace-nowrap text-lg md:text-xl">Hız: {teleprompterSpeed} WPM</span>
                      <input type="range" min="10" max="100" step="5" value={teleprompterSpeed} onChange={(e) => setTeleprompterSpeed(Number(e.target.value))} className="w-full accent-amber-500" />
                      <button onClick={() => setTeleprompterIndex(0)} className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-white px-8 py-4 font-black rounded-2xl shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"><Zap /> BAŞLAT</button>
                    </div>
                  )}
                  <p className="text-2xl md:text-[2.5rem] leading-[1.8] md:leading-[4.5rem] font-bold text-slate-800 whitespace-pre-wrap mt-8 md:mt-4 cursor-default tracking-wide">
                    {renderStoryText()}
                  </p>
                </div>

                {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-6 md:py-8 rounded-full text-3xl md:text-5xl font-black shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none hover:bg-emerald-400 transition-all mt-6 tracking-wide">BİTİRDİM! 🎉</button>}

                {/* SORULAR */}
                {isReadingFinished && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-10">
                    <div className="bg-white p-8 md:p-12 rounded-[3rem] border-8 border-fuchsia-300 space-y-8 shadow-2xl">
                      <h2 className="text-5xl font-black text-fuchsia-600 text-center mb-8">Soruları Cevapla 🧠</h2>
                      {storyData.questions.map((q, idx) => (
                        <div key={q.id} className="bg-fuchsia-50 p-6 md:p-8 rounded-3xl border-4 border-fuchsia-200 shadow-sm">
                          <h3 className="text-2xl md:text-3xl font-black text-fuchsia-900 mb-6 leading-tight">{idx + 1}. {q.q}</h3>
                          <div className="flex flex-col gap-4">
                            {q.options.map((opt, optIdx) => (
                              <button key={optIdx} onClick={() => setAnswers({ ...answers, [q.id]: optIdx })} className={`p-6 rounded-2xl font-black text-2xl text-left transition-all border-4 ${answers[q.id] === optIdx ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]' : 'bg-white text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-100 hover:border-fuchsia-300'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button onClick={checkAnswers} disabled={Object.keys(answers).length < storyData.questions.length} className="w-full bg-sky-500 text-white py-8 rounded-3xl text-4xl font-black shadow-[0_8px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-2 hover:bg-sky-400 transition-all mt-8 tracking-widest">KARNEMİ GÖSTER 🏆</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* YZ DEĞERLENDİRME YÜKLENİYOR */}
            {view === 'evaluating' && (
              <div className="max-w-md mx-auto bg-white/95 p-8 md:p-12 rounded-[3rem] shadow-2xl mt-32 text-center animate-in zoom-in duration-300 border-8 border-emerald-200">
                {isUploading ? (
                  <><Loader2 className="w-20 md:w-28 h-20 md:h-28 text-sky-500 animate-spin mx-auto mb-8" /><h2 className="text-3xl md:text-4xl font-black text-sky-600">Sesin Uçuyor... 🚀</h2></>
                ) : (
                  <><Loader2 className="w-20 md:w-28 h-20 md:h-28 text-emerald-500 animate-spin mx-auto mb-8" /><h2 className="text-3xl md:text-4xl font-black text-emerald-600">Değerlendiriliyor... 🌟</h2></>
                )}
              </div>
            )}

            {/* SONUÇ (KARNE) EKRANI */}
            {view === 'result' && readingResult && (
              <div className="max-w-3xl mx-auto bg-white/95 p-6 md:p-12 rounded-[4rem] shadow-2xl border-8 border-sky-300 mt-12 text-center space-y-8 animate-in slide-in-from-bottom-10 w-full">
                <div className="text-6xl md:text-8xl mb-4 md:mb-6 animate-bounce drop-shadow-xl">🏆</div>
                <h2 className="text-4xl md:text-5xl font-black text-sky-600 drop-shadow-sm">Tebrikler {readingResult.name.split(' ')[0]}!</h2>

                <div className="bg-indigo-50 p-6 md:p-10 rounded-3xl font-bold text-indigo-900 text-xl md:text-2xl relative shadow-inner border-4 border-indigo-200 leading-relaxed text-left italic">
                  "{readingResult.aiEvaluation.geribildirim}"
                  <button onClick={() => speakInstruction(readingResult.aiEvaluation.geribildirim)} className="absolute -top-6 -right-4 md:-top-8 md:-right-8 bg-amber-400 text-amber-900 p-4 md:p-5 rounded-full shadow-xl hover:bg-amber-300 transition-transform active:scale-95 animate-bounce border-4 border-white" title="Sesli Dinle">
                    <Volume2 size={32} className="md:w-9 md:h-9" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8 mt-8">
                  <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm font-black border-4 border-amber-200 text-amber-800 text-lg md:text-2xl flex flex-col items-center justify-center">
                    <span className="text-amber-500 text-4xl md:text-6xl mb-2 md:mb-3 drop-shadow-sm">{readingResult.wpm}</span> Hız (WPM)
                  </div>
                  <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm font-black border-4 border-emerald-200 text-emerald-800 text-lg md:text-2xl flex flex-col items-center justify-center">
                    <span className="text-emerald-500 text-4xl md:text-6xl mb-2 md:mb-3 drop-shadow-sm">{readingResult.compScore}/{readingResult.maxScore}</span> Doğru
                  </div>
                </div>

                <button onClick={() => setView('student-setup')} className="w-full bg-sky-500 text-white py-6 md:py-8 rounded-full text-2xl md:text-4xl font-black shadow-[0_8px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none hover:bg-sky-400 transition-all mt-8 tracking-wide">YENİDEN OYNA 🎮</button>
              </div>
            )}

            {/* ÖĞRETMEN GİRİŞİ */}
            {view === 'teacher-login' && (
              <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl border-8 border-emerald-300 mt-24">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-inner border-4 border-white"><User size={48} /></div>
                <h2 className="text-4xl font-black text-emerald-600 text-center mb-10">Öğretmen Girişi</h2>
                <form onSubmit={e => { e.preventDefault(); if (teacherPassword === actualTeacherPassword) { setTeacherTab('radar'); setView('teacher'); setPasswordError(false); } else setPasswordError(true); }} className="space-y-6">
                  <input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} className="w-full p-5 border-4 border-emerald-200 rounded-2xl text-center text-4xl tracking-[1em] bg-emerald-50 font-black outline-none text-emerald-900 focus:border-emerald-400 transition-colors" placeholder="••••" maxLength={4} />
                  {passwordError && <p className="text-rose-500 font-black text-center text-lg bg-rose-100 py-2 rounded-xl border-2 border-rose-200">❌ Hatalı Şifre!</p>}
                  <button type="submit" className="w-full bg-emerald-500 text-white py-6 rounded-2xl text-3xl font-black shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none hover:bg-emerald-400 transition-all mt-4">GİRİŞ YAP 🚀</button>
                  <button type="button" onClick={() => setView('student-setup')} className="w-full text-slate-400 font-bold mt-6 hover:text-slate-600 transition-colors text-lg">Geri Dön</button>
                </form>
              </div>
            )}

            {/* ÖĞRETMEN YÖNETİM PANELİ */}
            {view === 'teacher' && (
              <div className="max-w-7xl mx-auto bg-white/95 rounded-[3rem] shadow-2xl border-8 border-emerald-200 mt-16 min-h-[600px] p-8 md:p-14 relative animate-in fade-in duration-300">

                <div className="flex flex-col md:flex-row justify-between items-center mb-12 no-print gap-6">
                  <h2 className="text-4xl md:text-5xl font-black text-emerald-700 tracking-tight drop-shadow-sm">Sınıf Yönetim Merkezi</h2>
                  <button onClick={() => setView('student-setup')} className="bg-emerald-100 text-emerald-800 px-8 py-4 rounded-full font-black hover:bg-emerald-200 transition-colors border-4 border-emerald-300 shadow-sm text-lg">Öğrenci Ekranına Dön</button>
                </div>

                <div className="flex flex-wrap border-b-8 border-emerald-100 mb-12 no-print">
                  {[{ id: 'radar', i: <Activity size={24} />, l: 'Sınıf Radarı' }, { id: 'stats', i: <FileText size={24} />, l: 'Rapor & Arşiv' }, { id: 'homework', i: <BookOpen size={24} />, l: 'Ödev Merkezi' }, { id: 'students', i: <Users size={24} />, l: 'Öğrenciler' }, { id: 'settings', i: <Settings size={24} />, l: 'Ayarlar' }].map(tab => (
                    <button key={tab.id} onClick={() => setTeacherTab(tab.id)} className={`flex-1 flex items-center justify-center gap-3 py-5 font-black capitalize transition-all text-xl ${teacherTab === tab.id ? 'text-emerald-800 border-b-8 border-emerald-500 bg-emerald-50/80 rounded-t-3xl' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-50 rounded-t-3xl'}`}>
                      {tab.i} <span className="hidden md:inline">{tab.l}</span>
                    </button>
                  ))}
                </div>

                {/* RADAR */}
                {teacherTab === 'radar' && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    <h3 className="text-3xl font-black text-emerald-900 mb-8 flex items-center gap-3"><Activity className="text-emerald-500 w-10 h-10" /> Sınıf Gelişim Radarı</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="bg-sky-50 p-8 rounded-[2rem] border-4 border-sky-200 text-center shadow-sm">
                        <div className="text-sky-500 text-5xl mb-4 drop-shadow-sm">⚡</div>
                        <div className="text-md font-black text-sky-700 uppercase tracking-widest mb-2">Sınıf Ort. Hızı</div>
                        <div className="text-5xl font-black text-sky-900">{stats.length > 0 ? Math.round(stats.reduce((a, b) => a + (Number(b.wpm) || 0), 0) / stats.length) : 0} <span className="text-2xl">WPM</span></div>
                      </div>
                      <div className="bg-fuchsia-50 p-8 rounded-[2rem] border-4 border-fuchsia-200 text-center shadow-sm">
                        <div className="text-fuchsia-500 text-5xl mb-4 drop-shadow-sm">📚</div>
                        <div className="text-md font-black text-fuchsia-700 uppercase tracking-widest mb-2">Toplam Okuma</div>
                        <div className="text-5xl font-black text-fuchsia-900">{stats.length} <span className="text-2xl">Kere</span></div>
                      </div>
                      <div className="bg-amber-50 p-8 rounded-[2rem] border-4 border-amber-200 text-center shadow-sm">
                        <div className="text-amber-500 text-5xl mb-4 drop-shadow-sm">🎯</div>
                        <div className="text-md font-black text-amber-700 uppercase tracking-widest mb-2">Genel Doğruluk</div>
                        <div className="text-5xl font-black text-amber-900">{stats.length > 0 ? ((stats.reduce((a, b) => a + (Number(b.compScore) || 0), 0) / Math.max(1, stats.reduce((a, b) => a + (Number(b.maxScore) || 2), 0))) * 100).toFixed(0) : 0}<span className="text-4xl">%</span></div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="bg-emerald-50 p-10 rounded-[2rem] border-4 border-emerald-200 shadow-sm relative overflow-hidden">
                        <TrendingUp size={140} className="absolute -right-10 -bottom-10 text-emerald-200 opacity-40" />
                        <h4 className="text-3xl font-black text-emerald-700 mb-8 flex items-center gap-3 relative z-10"><TrendingUp className="w-10 h-10" /> Hızlanan Öğrenciler</h4>
                        <ul className="space-y-4 relative z-10">
                          {students.map(s => {
                            const ss = stats.filter(r => r.name === s.name).reverse();
                            if (ss.length >= 2 && Number(ss[0].wpm) > Number(ss[1].wpm)) {
                              return <li key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-emerald-500 font-black text-emerald-900 flex justify-between items-center text-xl"><span>{s.name}</span><span className="text-emerald-700 bg-emerald-100 border-2 border-emerald-200 px-4 py-2 rounded-xl">+{Number(ss[0].wpm) - Number(ss[1].wpm)} WPM</span></li>;
                            } return null;
                          })}
                        </ul>
                      </div>
                      <div className="bg-rose-50 p-10 rounded-[2rem] border-4 border-rose-200 shadow-sm relative overflow-hidden">
                        <Activity size={140} className="absolute -right-10 -bottom-10 text-rose-200 opacity-40" />
                        <h4 className="text-3xl font-black text-rose-700 mb-8 flex items-center gap-3 relative z-10"><Activity className="w-10 h-10" /> Desteğe İhtiyacı Olanlar</h4>
                        <ul className="space-y-4 relative z-10">
                          {students.map(s => {
                            const ss = stats.filter(r => r.name === s.name).reverse();
                            if (ss.length >= 2 && Number(ss[0].wpm) < Number(ss[1].wpm)) {
                              return <li key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-rose-500 font-black text-rose-900 flex justify-between items-center text-xl"><span>{s.name}</span><span className="text-rose-700 bg-rose-100 border-2 border-rose-200 px-4 py-2 rounded-xl">{Number(ss[0].wpm) - Number(ss[1].wpm)} WPM</span></li>;
                            } return null;
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* STATS & RAPOR */}
                {teacherTab === 'stats' && (
                  <div id="print-section" className="animate-in fade-in duration-300">
                    {!selectedStudentForProgress ? (
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                          <Users className="text-emerald-500" size={36} />
                          <h3 className="text-3xl font-black text-emerald-900">Sınıf Dosyaları</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {students.map(s => {
                            const hwTime = activeHomework?.timestamp?.toMillis ? activeHomework.timestamp.toMillis() : 0;
                            const didhw = stats.find(r => r.name === s.name && r.level === 'Ödev' && r.timestamp?.toMillis && r.timestamp.toMillis() >= hwTime);
                            return (
                              <div key={s.id} onClick={() => setSelectedStudentForProgress(s.name)} className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer p-6 rounded-[2rem] border-4 border-emerald-200 shadow-sm transition-transform hover:-translate-y-2 flex flex-col items-center justify-center gap-2 group aspect-square">
                                <span className="text-6xl drop-shadow-md group-hover:scale-110 transition-transform">📁</span>
                                <span className="font-black text-emerald-900 text-lg text-center leading-tight mt-2">{s.name}</span>
                                {activeHomework && (
                                  didhw ? <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-black flex items-center gap-1 shadow-sm mt-1"><Check size={12} /> Teslim</div>
                                    : <div className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full font-black flex items-center gap-1 shadow-sm mt-1"><Clock size={12} /> Bekliyor</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border-4 border-emerald-200 no-print gap-4">
                          <button onClick={() => setSelectedStudentForProgress(null)} className="w-full md:w-auto flex items-center justify-center gap-2 text-emerald-600 font-black px-6 py-4 rounded-xl hover:bg-emerald-50 transition-colors bg-white border-4 border-emerald-200"><ArrowLeft size={24} /> Klasörlere Dön</button>
                          <h3 className="text-3xl md:text-4xl font-black text-emerald-900 drop-shadow-sm flex items-center gap-4">
                            <span className="text-4xl md:text-5xl">📁</span> {selectedStudentForProgress} Dosyası
                          </h3>
                          <button onClick={() => window.print()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-500 text-white font-black px-6 py-4 rounded-xl hover:bg-sky-400 transition-colors shadow-[0_4px_0_rgb(2,132,199)] active:translate-y-1 active:shadow-none border-4 border-sky-600"><Printer size={24} /> Yazdır</button>
                        </div>

                        {/* Grafik */}
                        <div className="bg-white p-6 md:p-8 rounded-[3rem] border-4 border-emerald-100 shadow-sm overflow-x-auto">
                          <h4 className="font-black text-emerald-900 mb-8 text-center text-xl md:text-2xl flex items-center justify-center gap-3"><TrendingUp /> WPM Gelişim Grafiği</h4>
                          {(() => {
                            const studentStats = [...stats].filter(r => r.name === selectedStudentForProgress).reverse();
                            if (studentStats.length === 0) return <div className="text-center text-emerald-600 font-bold text-xl bg-emerald-50 p-6 rounded-2xl">Eklenmiş veri yok.</div>;
                            const allWpm = studentStats.map(s => Number(s.wpm) || 0);
                            const maxWpm = Math.max(...allWpm, 50) + 10;
                            const chartHeight = 200; const pointWidth = 100;
                            const chartWidth = Math.max(studentStats.length * pointWidth, 800);
                            const points = studentStats.map((row, idx) => { const x = idx * pointWidth + 60; const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight; return `${x},${y}`; }).join(" ");
                            return (
                              <div className="w-full overflow-x-auto pb-4">
                                <svg width={chartWidth} height={chartHeight + 40} className="mx-auto block">
                                  <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,6" />
                                  <polyline points={points} fill="none" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                                  {studentStats.map((row, idx) => { const x = idx * pointWidth + 60; const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight; return (<g key={idx}><circle cx={x} cy={y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" /><text x={x} y={y - 15} textAnchor="middle" className="text-[14px] font-black fill-emerald-800">{row.wpm}</text><text x={x} y={chartHeight + 20} textAnchor="middle" className="text-[10px] font-bold fill-slate-500">{row.date?.split(' - ')[0]}</text></g>); })}
                                </svg>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Geçmiş Kayıtlar */}
                        <div className="space-y-6">
                          <h4 className="font-black text-emerald-900 text-xl md:text-2xl flex items-center gap-3 px-4"><FileText /> Okuma Kayıtları ve YZ Karneleri</h4>
                          {stats.filter(r => r.name === selectedStudentForProgress).map(row => (
                            <div key={row.id} className="bg-white rounded-[2.5rem] border-4 border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start shadow-sm hover:border-emerald-300 transition-colors group">
                              <div className="flex flex-col gap-3 w-full md:min-w-[200px] md:w-auto">
                                <div className="text-slate-500 font-bold flex items-center gap-2"><Calendar size={18} /> {row.date}</div>
                                <div className="font-black text-xl text-emerald-800 mt-1">
                                  {row.level === 'Ödev' ? <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl border-2 border-amber-300">Sınıf Ödevi</span> : <span className="bg-sky-100 text-sky-800 px-4 py-2 rounded-xl border-2 border-sky-300">{row.interest}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  <div className="bg-amber-50 p-3 md:p-4 rounded-2xl border-2 border-amber-100 flex flex-col items-center">
                                    <span className="text-amber-500 text-3xl font-black">{row.wpm}</span><span className="text-sm font-black text-amber-800">WPM</span>
                                  </div>
                                  <div className="bg-emerald-50 p-3 md:p-4 rounded-2xl border-2 border-emerald-100 flex flex-col items-center">
                                    <span className="text-emerald-500 text-3xl font-black">{row.compScore}/{row.maxScore || 2}</span><span className="text-sm font-black text-emerald-800">Doğru</span>
                                  </div>
                                </div>
                                {row.audioUrl && (
                                  <div className="mt-4 w-full no-print">
                                    <audio src={row.audioUrl} controls className="w-full h-12 outline-none rounded-full bg-slate-50 border-2 border-slate-200" />
                                  </div>
                                )}
                                <button onClick={() => handleDeleteStat(row.id)} className="text-rose-400 hover:text-rose-600 font-black flex items-center justify-center gap-2 text-md mt-4 md:mt-auto pt-4 border-t-2 border-slate-100 md:border-t-0 no-print"><Trash2 size={18} /> Kaydı Sil</button>
                              </div>

                              <div className="flex-1 w-full bg-indigo-50 p-6 md:p-8 rounded-[2rem] border-4 border-indigo-100 relative shadow-inner">
                                <div className="absolute -top-6 -left-2 text-5xl group-hover:animate-bounce">🤖</div>
                                <p className="font-bold text-indigo-900 text-lg md:text-xl leading-relaxed italic mt-2 md:mt-0">"{row.aiEvaluation?.geribildirim || "Değerlendirme bulunamadı."}"</p>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* HOMEWORK */}
                {teacherTab === 'homework' && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    {activeHomework && (
                      <div className="space-y-6">
                        <div onClick={() => setShowHomeworkDetails(!showHomeworkDetails)} className="bg-amber-100 hover:bg-amber-200 cursor-pointer p-8 rounded-[3rem] border-4 border-amber-400 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative transition-colors">
                          <div className="flex items-center gap-6">
                            <div className="text-6xl drop-shadow-md">📁</div>
                            <div>
                              <h3 className="text-3xl font-black text-amber-900 mb-2">Sınıf Ödevi Yayında</h3>
                              <p className="font-bold text-amber-700 text-lg flex items-center gap-2"><Clock size={18} /> Bitiş: {activeHomework.deadline ? new Date(activeHomework.deadline).toLocaleString('tr-TR') : 'Süresiz'}</p>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveHomework(); }} className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-6 py-4 rounded-xl font-black shadow-[0_4px_0_rgb(190,18,60)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 text-lg transition-all z-10"><Trash2 size={24} /> Kaldır</button>
                        </div>

                        {showHomeworkDetails && (
                          <div className="bg-white p-8 rounded-[3rem] border-4 border-amber-200 shadow-sm animate-in fade-in">
                            <h4 className="text-2xl font-black text-amber-900 mb-6 flex items-center gap-3"><Users className="text-amber-500" /> Öğrenci Teslim Durumu</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {students.map(s => {
                                const hwTime = activeHomework.timestamp?.toMillis ? activeHomework.timestamp.toMillis() : 0;
                                const didhw = stats.find(r => r.name === s.name && r.level === 'Ödev' && r.timestamp?.toMillis && r.timestamp.toMillis() >= hwTime);
                                return (
                                  <div key={s.id} className={`p-4 border-4 rounded-2xl flex items-center justify-between ${didhw ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <span className="font-black text-lg text-slate-700">{s.name}</span>
                                    {didhw ? <span className="text-emerald-600 font-black flex items-center gap-1"><Check size={18} /> Teslim Edildi</span> : <span className="text-amber-500 font-bold flex items-center gap-1"><Clock size={18} /> Bekleniyor</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="bg-fuchsia-50 p-10 rounded-[3rem] border-4 border-fuchsia-200 shadow-sm flex flex-col gap-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="text-fuchsia-500" size={36} />
                        <h3 className="text-3xl font-black text-fuchsia-900">YZ ile Ödev Üret</h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <input
                          type="text"
                          placeholder="Ödev Konusu Girin (Örn: Doğa, Hayvanlar...)"
                          value={hwTopic}
                          onChange={e => setHwTopic(e.target.value)}
                          className="w-full p-6 border-4 border-fuchsia-300 rounded-[2rem] font-bold text-2xl outline-none text-fuchsia-900 focus:border-fuchsia-500 transition-colors placeholder-fuchsia-300 shadow-inner"
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 mt-2">
                        <select value={hwLevel} onChange={e => setHwLevel(e.target.value)} className="flex-1 p-6 border-4 border-fuchsia-300 rounded-[2rem] font-black bg-white text-fuchsia-900 text-2xl outline-none cursor-pointer focus:border-fuchsia-500 transition-colors shadow-sm text-center">
                          <option value="1">🌱 Kolay Seviye</option>
                          <option value="2">📚 Orta Seviye</option>
                          <option value="3">🔥 Zor Seviye</option>
                        </select>
                        <button onClick={handleGenerateHomeworkAI} disabled={isGeneratingHw} className="flex-[2] bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black px-12 py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all text-2xl shadow-[0_8px_0_rgb(162,28,175)] active:translate-y-2 active:shadow-none">
                          {isGeneratingHw ? <Loader2 className="animate-spin" size={32} /> : <Sparkles size={32} />} {hwTopic.trim() ? 'ÜRET' : 'RASTGELE ÜRET'}
                        </button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-10">
                      <div>
                        <label className="block text-2xl font-black text-emerald-900 mb-4 flex items-center gap-2"><FileText /> Okuma Metni:</label>
                        <textarea value={hwText} onChange={e => setHwText(e.target.value)} className="w-full p-8 border-4 border-emerald-300 rounded-[2.5rem] h-72 font-bold text-xl outline-none text-slate-700 leading-relaxed shadow-inner focus:border-emerald-500 transition-colors" placeholder="Metni buraya yazın veya yapay zekaya ürettirin..." />
                      </div>
                      <div>
                        <label className="block text-2xl font-black text-amber-900 mb-4 flex items-center gap-2"><Calendar /> Teslim Süresi:</label>
                        <input type="datetime-local" value={hwDeadline} onChange={e => setHwDeadline(e.target.value)} className="w-full p-8 border-4 border-amber-300 rounded-[2.5rem] font-black bg-amber-50 text-amber-900 outline-none text-xl shadow-inner focus:border-amber-500 transition-colors" />
                        <div className="bg-amber-100 p-6 rounded-2xl mt-6 border-2 border-amber-200 flex items-start gap-4">
                          <div className="text-amber-500 text-3xl">⚠️</div>
                          <p className="text-lg font-bold text-amber-900 leading-snug">Seçilen tarih geldiğinde ödev otomatik olarak öğrencilerin ekranından silinir ve erişime kapanır.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-200">
                      <h3 className="text-3xl font-black text-emerald-900 mb-6 flex items-center gap-3"><span className="text-4xl">❓</span> Sorular:</h3>
                      {hwQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white p-8 md:p-10 rounded-[2.5rem] border-4 border-emerald-200 space-y-6 relative shadow-sm">
                          {hwQuestions.length > 1 && (<button onClick={() => setHwQuestions(hwQuestions.filter((_, i) => i !== qIndex))} className="absolute top-8 right-8 text-rose-500 bg-rose-50 p-4 rounded-xl hover:bg-rose-500 hover:text-white transition-colors border-2 border-rose-200"><Trash2 size={24} /></button>)}
                          <label className="font-black text-emerald-700 text-xl bg-emerald-50 px-4 py-2 rounded-xl border-2 border-emerald-100">Soru {qIndex + 1}</label>
                          <input type="text" value={q.q} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].q = e.target.value; setHwQuestions(newQs); }} className="w-full p-5 border-4 border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-emerald-400 transition-colors mt-2" placeholder="Soru cümlesi..." />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            {[0, 1, 2].map(optIndex => (<input key={optIndex} type="text" value={q.options[optIndex]} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].options[optIndex] = e.target.value; setHwQuestions(newQs); }} className="p-5 border-4 border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-emerald-400 transition-colors" placeholder={`${['A', 'B', 'C'][optIndex]} Şıkkı`} />))}
                          </div>
                          <div className="bg-emerald-50 p-6 rounded-2xl border-4 border-emerald-100 flex items-center gap-6 mt-6">
                            <label className="font-black text-emerald-900 text-xl whitespace-nowrap">Doğru Cevap:</label>
                            <select value={q.correct} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].correct = Number(e.target.value); setHwQuestions(newQs); }} className="w-full md:w-auto p-4 bg-white border-4 border-emerald-300 rounded-xl font-black text-xl text-emerald-700 outline-none cursor-pointer focus:border-emerald-500 transition-colors">
                              <option value={0}>A Şıkkı</option><option value={1}>B Şıkkı</option><option value={2}>C Şıkkı</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setHwQuestions([...hwQuestions, { q: '', options: ['', '', ''], correct: 0 }])} className="w-full bg-emerald-50 text-emerald-600 py-8 rounded-[2.5rem] font-black text-2xl border-4 border-emerald-300 border-dashed flex items-center justify-center gap-4 hover:bg-emerald-100 transition-colors"><Plus size={32} /> YENİ SORU EKLE</button>
                    </div>
                    <button onClick={handlePublishHomework} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-8 rounded-full font-black text-4xl shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all mt-10 flex items-center justify-center gap-4 tracking-wide"><Send size={40} /> SINIF PANOSUNA GÖNDER 🚀</button>
                  </div>
                )}

                {/* STUDENTS */}
                {teacherTab === 'students' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row gap-6 mb-12 bg-emerald-50 p-8 md:p-10 rounded-[3rem] border-4 border-emerald-200 shadow-sm items-center">
                      <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-600 font-black text-2xl border-4 border-white flex-shrink-0"><Plus size={32} /></div>
                      <input type="text" placeholder="Öğrenci Adı Soyadı" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="flex-1 w-full p-5 border-4 border-white rounded-2xl font-black text-xl outline-none shadow-inner focus:border-emerald-300 transition-colors" />
                      <input type="text" placeholder="Şifre" value={newStudentPassword} onChange={e => setNewStudentPassword(e.target.value)} className="w-full md:w-48 p-5 border-4 border-white rounded-2xl font-black text-center text-2xl tracking-widest outline-none shadow-inner focus:border-emerald-300 transition-colors" />
                      <button onClick={handleAddStudent} className="w-full md:w-auto bg-emerald-500 text-white font-black px-12 py-5 rounded-2xl shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all text-2xl">EKLE</button>
                    </div>

                    {students.length === 0 && (
                      <div className="text-center bg-amber-50 p-10 rounded-[3rem] border-4 border-amber-200 mb-10">
                        <div className="text-6xl mb-4">🏫</div>
                        <h3 className="text-2xl font-black text-amber-900 mb-4">Sınıf listesi boş görünüyor.</h3>
                        <button onClick={handleLoadDefaultClass} className="bg-amber-400 text-amber-950 px-10 py-5 rounded-full font-black text-xl border-4 border-amber-500 hover:bg-amber-300 transition-colors shadow-sm">1/A Hazır Listesini Yükle</button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      {students.map(s => (
                        <div key={s.id} className="flex flex-col md:flex-row justify-between items-center p-6 md:p-8 bg-white rounded-[2.5rem] border-4 border-emerald-100 shadow-sm gap-6 hover:border-emerald-300 transition-colors group">
                          <div className="flex-1 font-black text-emerald-900 text-2xl md:text-3xl flex items-center gap-4">
                            {s.name}
                            {s.teacherStars > 0 && <span className="bg-amber-100 text-amber-700 text-lg px-4 py-2 rounded-2xl flex items-center gap-2 border-2 border-amber-300 shadow-sm font-bold tracking-normal"><Star className="fill-amber-400 text-amber-500" size={20} /> x{s.teacherStars}</span>}
                          </div>
                          <div className="flex items-center gap-4 flex-wrap justify-end">

                            <button onClick={() => handleGiveTeacherStar(s.id, s.teacherStars)} className="bg-amber-400 text-white p-4 rounded-2xl shadow-[0_6px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none hover:bg-amber-500 transition-all border-2 border-amber-500 group-hover:animate-pulse" title="Öğrenciye Yıldız Hediye Et"><Gift size={28} /></button>

                            <div className="bg-indigo-50 border-4 border-indigo-100 rounded-2xl flex items-center p-3 font-black text-indigo-800">
                              <span className="px-3 text-md">Akademi:</span>
                              <select value={s.academyLevel || 1} onChange={(e) => updateAcademyLevel(Number(e.target.value), s.id)} className="bg-white border-2 border-indigo-200 rounded-xl p-2 outline-none cursor-pointer font-bold text-lg">
                                <option value={1}>1. Isınma</option><option value={2}>2. Schulte</option><option value={3}>3. Flaş</option><option value={4}>4. Metronom</option>
                              </select>
                            </div>

                            {editingPasswords[s.id] !== undefined ? (
                              <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border-4 border-emerald-200">
                                <input type="text" value={editingPasswords[s.id]} onChange={(e) => setEditingPasswords({ ...editingPasswords, [s.id]: e.target.value })} className="w-28 p-3 border-4 border-emerald-300 rounded-xl text-center font-black text-2xl tracking-[0.5em] outline-none bg-white focus:border-emerald-500" maxLength={4} />
                                <button onClick={() => handleUpdatePassword(s.id, editingPasswords[s.id])} className="bg-emerald-500 text-white p-4 rounded-xl font-bold shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none"><Check size={24} /></button>
                                <button onClick={() => { const newEd = { ...editingPasswords }; delete newEd[s.id]; setEditingPasswords(newEd); }} className="bg-slate-200 text-slate-600 p-4 rounded-xl font-bold shadow-[0_4px_0_rgb(148,163,184)] active:translate-y-1 active:shadow-none"><X size={24} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-4 border-slate-100">
                                <span className="bg-white px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 tracking-[0.5em] font-black text-xl">{s.password}</span>
                                <button onClick={() => setEditingPasswords({ ...editingPasswords, [s.id]: s.password })} className="bg-sky-500 text-white px-5 py-4 rounded-xl shadow-[0_6px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none font-black text-md transition-all">Değiştir</button>
                              </div>
                            )}

                            <button onClick={() => handleDeleteStudent(s.id, s.name)} className="bg-rose-100 text-rose-600 p-5 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border-2 border-rose-200 ml-2" title="Öğrenciyi Sil"><Trash2 size={28} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {teacherTab === 'settings' && (
                  <div className="flex flex-col max-w-lg mx-auto gap-8 mt-16 bg-emerald-50 p-12 rounded-[3rem] border-4 border-emerald-200 animate-in fade-in duration-300 shadow-sm">
                    <div className="text-center mb-4">
                      <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center text-emerald-500 shadow-sm mb-6 border-4 border-emerald-200"><Lock size={40} /></div>
                      <h3 className="text-3xl font-black text-emerald-900">Yönetici Şifresi</h3>
                      <p className="text-emerald-700 font-bold mt-4 text-lg">Öğretmen paneline giriş şifrenizi güvenliğiniz için belli aralıklarla güncelleyin.</p>
                    </div>
                    <input type="text" placeholder="Yeni 4 Haneli Şifre" value={newTeacherPasswordInput} onChange={e => setNewTeacherPasswordInput(e.target.value)} className="p-6 border-4 border-white rounded-2xl font-black text-center tracking-[1em] text-3xl outline-none focus:border-emerald-400 shadow-inner" maxLength={4} />
                    <button onClick={handleUpdateTeacherPassword} className="bg-emerald-500 text-white font-black py-6 rounded-2xl shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all text-2xl mt-4">ŞİFREYİ GÜNCELLE</button>
                  </div>
                )}

                {/* BİLDİRİM BALONU */}
                {teacherMsg && (
                  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xl shadow-2xl animate-bounce z-50 flex items-center gap-4 tracking-wide border-4 border-white/10">
                    <Check className="text-emerald-400 w-8 h-8" /> {teacherMsg}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
