import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users, Search, Eye, Lock, Unlock, Trash2, Plus, Activity, Calendar, Printer, Gift } from 'lucide-react';
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

// ── OYUNLAŞTIRILMIŞ AHŞAP BUTON STİLİ ──
const wood = {
  background: 'linear-gradient(180deg, #D4912A 0%, #B57A18 100%)',
  border: '3px solid #7A4F10',
  borderRadius: 30,
  boxShadow: '0 5px 0 #5A3508, inset 0 1px 0 rgba(255,255,255,0.2)',
};

// ── BULUT ÇİZİM BİLEŞENİ ──
function Cloud({ style }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', zIndex: 1, filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.05))', ...style }}>
      <div style={{ position: 'relative', width: 150, height: 62 }}>
        <div style={{ position: 'absolute', width: 150, height: 48, background: 'rgba(255,255,255,0.95)', borderRadius: 60, bottom: 0 }} />
        <div style={{ position: 'absolute', width: 76, height: 72, background: 'rgba(255,255,255,0.95)', borderRadius: '50%', bottom: 14, left: 28 }} />
        <div style={{ position: 'absolute', width: 56, height: 60, background: 'rgba(255,255,255,0.95)', borderRadius: '50%', bottom: 10, left: 78 }} />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('student-setup'); 
  const [stats, setStats] = useState([]); 
  const [students, setStudents] = useState([]); 
  
  const [activeHomework, setActiveHomework] = useState(null);
  const [teacherTab, setTeacherTab] = useState('radar');
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);

  const [hwText, setHwText] = useState('');
  const [hwDeadline, setHwDeadline] = useState('');
  const [hwQuestions, setHwQuestions] = useState([{ q: '', options: ['', '', ''], correct: 0 }]);
  
  // YENİ: Başarılı Giriş Kontrol Anahtarı
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
  
  const flashWordsData = [{w:"Top", o:["Koş","Top","Al"]}, {w:"Kalem", o:["Silgi","Defter","Kalem"]}, {w:"Mavi gök", o:["Kırmızı ev","Mavi gök","Sıcak çay"]}];
  const [flashStage, setFlashStage] = useState(0);
  const [isFlashShowing, setIsFlashShowing] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [flashSpeed, setFlashSpeed] = useState(1500); 
  
  const [metronomeBPM, setMetronomeBPM] = useState(60); 
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
        setIsAuthenticated(true); // Otomatik giriş yaptı
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


  const startSchulte = () => {
    setSchulteGrid([...Array(9)].map((_,i)=>i+1).sort(()=>Math.random()-0.5));
    setSchulteExpected(1);
    setView('academy-schulte-ready');
    speakInstruction("Harika gidiyorsun! Şimdi bir dedektif gibi sayıları bulacağız. Lütfen gözünü tablonun tam ortasından hiç ayırma ve kenarlardaki sayıları birden dokuza kadar sırayla bulup tıkla. Hazırsan başla!");
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
    setFlashStage(0); setFlashMessage(''); setView('academy-flash-ready');
    speakInstruction("Şimdi gözlerinle fotoğraf çekme zamanı! Ekranda bir kelime şimşek gibi parlayıp kaybolacak. Onu aklında tut ve aşağıdaki seçeneklerden doğru olanı bul. Gözünü kırpma, hazırsan başla!");
  };

  const triggerFlashWord = () => {
    setIsFlashShowing(true);
    setTimeout(() => { setIsFlashShowing(false); }, flashSpeed); 
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
    for(let i=0; i<words.length; i+=2) chunks.push(words.slice(i, i+2).join(' ')); 
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
      } catch(e) { showTeacherMessage('❌ Ödev kaldırılamadı.'); }
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
      const aiData = await callGeminiAPI(hwTopic, hwLevel, 0, 0); 
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
    if (audioDataUrl) { try { parts.push({ inlineData: { mimeType: "audio/webm", data: audioDataUrl.split(',')[1] } }); } catch (e) {} }
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

  // YENİ GİRİŞ MANTIĞI: Şifre doğrulandıktan sonra kartlar açılır
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
    setShowBadgeAnimation(false); setBadgeInCorner(false);
    
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
        } catch(e) { console.error("Ses yükleme hatası", e); }
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

  const displayName = savedProfile ? savedProfile.studentName : studentName;
  const displayAvatar = savedProfile ? (savedProfile.avatar || studentAvatar) : studentAvatar;
  const myBadgeCount = stats.filter(s => s.name === displayName && s.badge).length;
  const myStats = stats.filter(s => s.name === displayName);
  const lastStat = myStats[0];

  const topicColors = ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#54A0FF','#5F27CD','#00D2D3','#01CBC6'];
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>

      {/* ── GLOBAL STYLES & FONTS (Türkçe Karakter Uyumlu) ──────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pendulum { 0%{transform:translateX(-35vw)} 50%{transform:translateX(35vw)} 100%{transform:translateX(-35vw)} }
        @keyframes om-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes om-twinkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.82)} }
        @keyframes om-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes om-bob { 0%,100%{transform:translateY(0px) rotate(-3deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
        .om-f1{animation:om-float 3s ease-in-out infinite}
        .om-f2{animation:om-float 3.6s ease-in-out infinite .4s}
        .om-f3{animation:om-float 2.8s ease-in-out infinite .9s}
        .om-f4{animation:om-float 3.3s ease-in-out infinite 1.3s}
        .om-f5{animation:om-float 4s ease-in-out infinite .2s}
        .om-f6{animation:om-float 3.1s ease-in-out infinite .7s}
        .om-tw1{animation:om-twinkle 2s ease-in-out infinite}
        .om-tw2{animation:om-twinkle 2.6s ease-in-out infinite .35s}
        .om-tw3{animation:om-twinkle 1.9s ease-in-out infinite .8s}
        .om-tw4{animation:om-twinkle 3s ease-in-out infinite 1.2s}
        .om-bob{animation:om-bob 3.5s ease-in-out infinite}
        .animate-pendulum{animation:pendulum 3s infinite ease-in-out}
        .om-card-hover{transition:transform .2s,box-shadow .2s}
        .om-card-hover:hover{transform:translateY(-4px)}
        .om-btn{transition:transform .12s,box-shadow .12s;cursor:pointer;border:none;outline:none}
        .om-btn:active{transform:translateY(3px)}
        
        /* VELİ ÇIKTISI İÇİN TEMİZ YAZDIRMA AYARI */
        @media print{
          body * { visibility:hidden; background: white !important; }
          #print-section, #print-section * { visibility:visible; color: black !important; }
          #print-section { position:absolute; left:0; top:0; width:100%; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── PROFİL MODALI VE ÇIKIŞ YAP BUTONU ─────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sky-900/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white rounded-[3rem] p-8 w-full max-w-md shadow-2xl relative border-8 border-sky-200">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 bg-sky-100 p-2 rounded-full text-sky-600 hover:bg-sky-200"><X /></button>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-sky-100 text-5xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-white">
                {displayAvatar?.startsWith('data') ? <img src={displayAvatar} className="w-full h-full object-cover rounded-full" alt="" /> : (displayAvatar || '👤')}
              </div>
              <h2 className="text-3xl font-black text-sky-800" style={{fontFamily: "'Nunito',sans-serif"}}>{displayName || 'Misafir'}</h2>
              
              <div className="flex gap-2 mt-3">
                <span className="bg-amber-100 text-amber-600 px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-sm">
                  <Flame size={18} /> {savedProfile?.streak || 0} Gün Ateş Serisi
                </span>
              </div>
              
              <div className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg flex items-center gap-2">
                {RANKS[academyLevel - 1].icon} {RANKS[academyLevel - 1].name}
              </div>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-2">
              {RANKS.map(r => (
                <div key={r.lvl} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${academyLevel >= r.lvl ? 'bg-emerald-50 border-emerald-300 shadow-md' : 'bg-slate-50 border-slate-200 grayscale opacity-40'}`}>
                  <span className="text-2xl">{r.icon}</span>
                  {academyLevel < r.lvl && <Lock size={12} className="text-slate-400 mt-1" />}
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4 mb-6">
              <div className="bg-emerald-50 p-4 rounded-2xl border-4 border-emerald-100 flex items-center justify-between shadow-sm">
                <div className="font-black text-emerald-800 flex items-center gap-2"><BookOpen size={18} /> Kelime Kumbarası</div>
                <div className="text-2xl font-black text-emerald-600">{myStats.reduce((acc, curr) => acc + (Number(curr.words) || 0), 0)}</div>
              </div>
              <div className="bg-fuchsia-50 p-4 rounded-2xl border-4 border-fuchsia-100 min-h-[100px] shadow-sm">
                <div className="font-black text-fuchsia-800 text-lg mb-3">Başarı Vitrini 🏆</div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm border-2 border-fuchsia-200">
                    <span className="text-2xl">🕵️‍♂️</span>
                    <span className="font-black text-fuchsia-700 text-xl">x {myBadgeCount}</span>
                  </div>
                  {teacherStars > 0 && (
                    <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm border-2 border-amber-300 animate-pulse">
                      <span className="text-2xl">🌟</span>
                      <span className="font-black text-amber-600 text-xl">x {teacherStars}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* YENİ: ÇIKIŞ YAP BUTONU */}
            <button onClick={() => { handleLogout(); setShowProfileModal(false); }} className="w-full bg-rose-100 text-rose-600 py-3 rounded-xl font-black border-2 border-rose-200 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center gap-2">
              🚪 Çıkış Yap / Başka Öğrenci
            </button>

          </div>
        </div>
      )}

      {/* ── TEACHER STAR GIFT ─────────────────────────────────────────── */}
      {showTeacherStarGift && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70 backdrop-blur-md font-sans">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-amber-300 text-center animate-bounce cursor-pointer" onClick={() => setShowTeacherStarGift(false)}>
            <span className="text-[8rem] block mb-4 drop-shadow-xl">🎁</span>
            <h2 className="text-5xl font-black text-amber-600 leading-tight">Sürpriz Paketin Var!</h2>
            <p className="text-2xl font-bold text-amber-800 mt-4">Arif Öğretmenin sana özel bir yıldız gönderdi! 🌟</p>
            <button className="mt-8 bg-amber-500 text-white px-10 py-4 rounded-full font-black text-2xl shadow-xl">PAKETİ AÇ</button>
          </div>
        </div>
      )}

      {/* ── BADGE ANIMATION ───────────────────────────────────────────── */}
      {showBadgeAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-sm font-sans">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center animate-bounce border-8 border-amber-300 text-center max-w-xl">
            <span className="text-9xl mb-4 drop-shadow-2xl">🕵️‍♂️</span>
            <h2 className="text-4xl font-black text-amber-600 leading-tight">İnanılmaz Bir Dikkat!</h2>
            <p className="text-2xl font-bold text-amber-800 mt-2">Gerçek bir Okuma Dedektifi olduğunu kanıtladın! 🌟</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADVENTURE HOME SCREEN (GÖKKUŞAKLI ANA EKRAN)
      ══════════════════════════════════════════════════════════════════ */}
      {view === 'student-setup' && !isGeneratingStory && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #3BA8EC 0%, #62C0EE 18%, #8CD4E8 36%, #A8DBCC 54%, #88C878 72%, #62B050 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
          fontFamily: "'Nunito', 'Fredoka One', sans-serif",
        }}>

          {/* ── CLOUD DECORATIONS ────────────────────────────────────── */}
          <Cloud style={{ top: '5%', left: '2%' }} />
          <Cloud style={{ top: '3%', left: '28%', transform: 'scale(0.75)' }} />
          <Cloud style={{ top: '6%', right: '22%', transform: 'scale(0.85)' }} />
          <Cloud style={{ top: '14%', right: '5%', transform: 'scale(0.6)' }} />

          {/* ── RAINBOW ARC ──────────────────────────────────────────── */}
          <div style={{ position: 'absolute', bottom: '18%', right: '-4%', zIndex: 1, pointerEvents: 'none' }}>
            {[
              { c: '#FF4444', w: 420, h: 210 },
              { c: '#FF8800', w: 375, h: 188 },
              { c: '#FFDD00', w: 330, h: 165 },
              { c: '#22CC44', w: 285, h: 143 },
              { c: '#4488FF', w: 240, h: 120 },
              { c: '#9933CC', w: 195, h: 98 },
            ].map((arc, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: arc.w, height: arc.h,
                border: `14px solid ${arc.c}`,
                borderBottom: 'none',
                borderRadius: `${arc.w / 2}px ${arc.w / 2}px 0 0`,
                bottom: 0,
                left: (420 - arc.w) / 2,
                opacity: 0.65,
              }} />
            ))}
          </div>

          {/* ── FLOATING STARS ───────────────────────────────────────── */}
          <div className="om-tw1" style={{ position: 'absolute', top: '22%', right: '14%', fontSize: 30, zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>⭐</div>
          <div className="om-tw2" style={{ position: 'absolute', top: '38%', right: '6%', fontSize: 22, zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>⭐</div>
          <div className="om-tw3" style={{ position: 'absolute', top: '12%', left: '48%', fontSize: 18, zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>⭐</div>
          <div className="om-tw4" style={{ position: 'absolute', top: '55%', right: '18%', fontSize: 26, zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>⭐</div>
          <div className="om-tw1" style={{ position: 'absolute', top: '30%', left: '6%', fontSize: 16, zIndex: 2 }}>✨</div>

          {/* ── FLOATING ISLAND / CHARACTERS ─────────────────────────────── */}
          <div className="om-bob" style={{ position: 'absolute', top: '10%', right: '2%', zIndex: 2, fontSize: 36, lineHeight: 1, filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))' }}>
            🏔️<br />
            <span style={{ fontSize: 20 }}>👾⭐</span>
          </div>

          {/* ── DINOSAUR ───────────────────────────────── */}
          <div style={{ position: 'absolute', bottom: 0, left: 20, zIndex: 3, fontSize: 'clamp(50px, 8vw, 90px)', lineHeight: 1, transform: 'scaleX(-1)', pointerEvents: 'none', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }}>🦕</div>

          {/* ── TOP NAVIGATION BAR ──────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(10px,2vw,20px) clamp(12px,3vw,24px) 0', position: 'relative', zIndex: 20, gap: 12 }}>

            {/* Left: Profile Badge */}
            <button
              onClick={() => isAuthenticated ? setShowProfileModal(true) : null}
              style={{
                ...wood, padding: '8px clamp(12px,2vw,20px) 8px 8px',
                display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                cursor: isAuthenticated ? 'pointer' : 'default',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: '#FFF5E0', border: '3px solid rgba(255,220,100,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
              }}>
                {displayAvatar?.startsWith('data') ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (displayAvatar || '🐶')}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 'clamp(13px,2vw,18px)', lineHeight: 1.2, fontFamily: "'Nunito',sans-serif" }}>
                  {isAuthenticated ? displayName.split(' ')[0] : 'Giriş Yapılmadı'}
                </div>
                {isAuthenticated && (
                  <div style={{ color: '#FFE0A0', fontSize: 'clamp(10px,1.5vw,13px)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                    🕵️ Rozet: {myBadgeCount}
                  </div>
                )}
              </div>
            </button>

            {/* Center: Rainbow Title */}
            <h1 style={{
              fontFamily: "'Fredoka One', 'Impact', cursive",
              fontSize: 'clamp(26px, 5vw, 62px)',
              lineHeight: 0.95, textAlign: 'center', margin: 0, flex: 1,
              filter: 'drop-shadow(2px 4px 0px rgba(0,0,0,0.22))',
            }}>
              <div>
                {[['O', '#FF3333'], ['K', '#FF8800'], ['U', '#FFD700'], ['M', '#22CC44'], ['A', '#3399FF']].map(([l, c], i) => (
                  <span key={i} style={{ color: c, WebkitTextStroke: '1.5px rgba(255,255,255,0.55)', display: 'inline-block' }}>{l}</span>
                ))}
              </div>
              <div>
                {[['M', '#FF3399'], ['A', '#FF7700'], ['C', '#FFDD00'], ['E', '#00CC66'], ['R', '#4488FF'], ['A', '#AA44FF'], ['M', '#FF4444']].map(([l, c], i) => (
                  <span key={i} style={{ color: c, WebkitTextStroke: '1.5px rgba(255,255,255,0.55)', display: 'inline-block' }}>{l}</span>
                ))}
              </div>
            </h1>

            {/* Right: Teacher Badge */}
            <button
              onClick={() => setView('teacher-login')}
              style={{
                ...wood, padding: 'clamp(8px,1.5vw,14px) clamp(12px,2vw,20px)',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer',
                color: 'white', fontWeight: 900, fontSize: 'clamp(10px,1.5vw,15px)',
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              <span>1/A SINIFI – ARİF ÖĞRETMEN</span>
              <span style={{ fontSize: 'clamp(16px,2.5vw,22px)' }}>🔔</span>
            </button>
          </div>

          {/* ── GÜVENLİK DÜZELTMESİ: GİRİŞ EKRANI ─────────────────────── */}
          {!isAuthenticated && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10 }}>
              <div style={{
                background: 'rgba(255,255,255,0.97)',
                borderRadius: 36, padding: 'clamp(24px,4vw,44px)',
                width: '100%', maxWidth: 420,
                boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                border: '4px solid rgba(255,255,255,0.8)',
                position: 'relative'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 62, marginBottom: 6, filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.2))' }} className="om-f1">🚀</div>
                  <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 30, color: '#1a56db', margin: 0 }}>Maceraya Katıl!</h2>
                  <p style={{ color: '#64748b', fontWeight: 700, marginTop: 8, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>İsmini seç ve şifreni gir</p>
                </div>

                <select value={studentName} onChange={e => { setStudentName(e.target.value); setLoginError(''); }}
                  style={{ width: '100%', padding: '14px 16px', border: '3px solid #BAE6FD', borderRadius: 16, fontWeight: 700, marginBottom: 14, fontSize: 16, outline: 'none', background: '#F0F9FF', color: '#0C4A6E', fontFamily: "'Nunito',sans-serif", cursor: 'pointer' }}>
                  <option value="">İsmini Seç...</option>
                  {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>

                <input type="password" value={studentPassword} onChange={e => { setStudentPassword(e.target.value); setLoginError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                  style={{ width: '100%', padding: '14px 16px', border: '3px solid #BAE6FD', borderRadius: 16, fontWeight: 900, marginBottom: 14, fontSize: 28, outline: 'none', textAlign: 'center', letterSpacing: '0.6em', background: '#F0F9FF', color: '#0C4A6E' }}
                  placeholder="••••" maxLength={4} />

                {loginError && (
                  <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', padding: '8px 12px', borderRadius: 12, marginBottom: 16, animation: 'om-bob 0.5s ease-out' }}>
                    <p style={{ color: '#b91c1c', fontWeight: 800, textAlign: 'center', fontSize: 14, margin: 0, fontFamily: "'Nunito',sans-serif" }}>❌ {loginError}</p>
                  </div>
                )}

                <div onClick={() => setRememberMe(!rememberMe)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, cursor: 'pointer', justifyContent: 'center' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, border: `3px solid ${rememberMe ? '#6366f1' : '#cbd5e1'}`,
                    background: rememberMe ? '#6366f1' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s',
                  }}>
                    {rememberMe && <Check size={14} color="white" />}
                  </div>
                  <span style={{ color: '#475569', fontWeight: 800, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>Bu cihazda beni hatırla</span>
                </div>

                <button onClick={handleLoginSubmit} className="om-btn"
                  style={{ width: '100%', background: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)', color: 'white', padding: '16px', borderRadius: 20, fontWeight: 900, fontSize: 22, boxShadow: '0 6px 0 #1e3a8a', fontFamily: "'Fredoka One',cursive" }}>
                  GİRİŞ YAP 🚀
                </button>
              </div>
            </div>
          )}

          {/* ── THREE ADVENTURE CARDS (SADECE GİRİŞ YAPINCA GÖZÜKÜR) ──── */}
          {isAuthenticated && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 'clamp(10px,2vw,24px)', padding: 'clamp(10px,2vw,20px) clamp(12px,3vw,24px) clamp(60px,10vw,100px)',
              flexWrap: 'wrap', zIndex: 10, position: 'relative',
            }}>

              {/* ── KART 1: ÖDEV MERKEZİ ──────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div className="om-card-hover" style={{
                  width: 'clamp(220px,28vw,300px)', height: 'clamp(220px,28vw,300px)',
                  borderRadius: '50%', background: 'white',
                  border: '6px solid #E8E8E8',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'flex-start', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ width: '100%', height: '55%', background: 'linear-gradient(180deg,#C8EAB0 0%,#A0D890 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 4 }}>
                    <span style={{ fontSize: 'clamp(18px,3.5vw,32px)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>🌳</span>
                    <span style={{ fontSize: 'clamp(24px,4.5vw,44px)', marginBottom: 2, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>🏫</span>
                    <span style={{ fontSize: 'clamp(14px,2.5vw,24px)', marginBottom: 4, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>📚</span>
                  </div>
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {activeHomework ? (
                      <>
                        <div style={{ fontWeight: 900, fontSize: 'clamp(9px,1.5vw,13px)', color: '#555', letterSpacing: 1, marginBottom: 2, fontFamily: "'Nunito',sans-serif" }}>BUGÜNÜN GÖREVİ:</div>
                        <div style={{ fontWeight: 900, fontSize: 'clamp(11px,2vw,17px)', color: '#1a1a1a', fontFamily: "'Fredoka One',cursive" }}>SINIF ÖDEVİ</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 900, fontSize: 'clamp(9px,1.5vw,13px)', color: '#aaa', marginBottom: 2, fontFamily: "'Nunito',sans-serif" }}>BUGÜNÜN GÖREVİ:</div>
                        <div style={{ fontWeight: 900, fontSize: 'clamp(11px,2vw,16px)', color: '#bbb', fontFamily: "'Fredoka One',cursive" }}>ÖDEV YOK</div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={activeHomework ? handleStartHomework : null}
                  className="om-btn"
                  style={{
                    marginTop: -18, zIndex: 5,
                    background: activeHomework ? 'linear-gradient(180deg,#4CAF50 0%,#388E3C 100%)' : '#ccc',
                    color: 'white', padding: 'clamp(8px,1.5vw,12px) clamp(24px,4vw,40px)',
                    borderRadius: 30, fontWeight: 900, fontSize: 'clamp(13px,2vw,18px)',
                    boxShadow: activeHomework ? '0 5px 0 #1B5E20' : '0 4px 0 #aaa',
                    cursor: activeHomework ? 'pointer' : 'not-allowed',
                    fontFamily: "'Fredoka One',cursive",
                    border: '3px solid rgba(255,255,255,0.4)',
                  }}>
                  {activeHomework ? 'BAŞLAT 🚀' : 'BEKLİYOR...'}
                </button>
              </div>

              {/* ── KART 2: HİKAYE KEŞFİ ────────────────────── */}
              <div style={{
                width: 'clamp(240px,30vw,320px)',
                background: 'linear-gradient(180deg, #FFE566 0%, #FFCA28 45%, #FF9F00 100%)',
                border: '5px solid #E67E00', borderRadius: 32,
                boxShadow: '0 14px 40px rgba(0,0,0,0.22), 0 6px 16px rgba(255,150,0,0.3)',
                padding: 'clamp(14px,2.5vw,22px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
              }} className="om-card-hover">

                <div style={{ position: 'relative', width: '100%', height: 'clamp(110px,16vw,160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="om-f1" style={{ position: 'absolute', top: '10%', left: '8%', fontSize: 'clamp(22px,3.5vw,34px)', background: 'white', borderRadius: '50%', padding: 5, boxShadow: '0 3px 8px rgba(0,0,0,0.12)' }}>🦖</span>
                  <span className="om-f2" style={{ position: 'absolute', top: '5%', right: '10%', fontSize: 'clamp(22px,3.5vw,34px)', background: 'white', borderRadius: '50%', padding: 5, boxShadow: '0 3px 8px rgba(0,0,0,0.12)' }}>🪐</span>
                  <span className="om-f3" style={{ position: 'absolute', bottom: '8%', right: '8%', fontSize: 'clamp(20px,3vw,30px)', background: 'white', borderRadius: '50%', padding: 5, boxShadow: '0 3px 8px rgba(0,0,0,0.12)' }}>👑</span>
                  <span className="om-f4" style={{ position: 'absolute', bottom: '12%', left: '10%', fontSize: 'clamp(20px,3vw,30px)', background: 'white', borderRadius: '50%', padding: 5, boxShadow: '0 3px 8px rgba(0,0,0,0.12)' }}>🌊</span>
                  <span style={{ fontSize: 'clamp(42px,7vw,70px)', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }}>🚀</span>
                </div>

                <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 'clamp(17px,2.8vw,24px)', color: '#7C3A00', margin: '4px 0 10px', textAlign: 'center' }}>HİKAYE KEŞFİ</h3>

                <div style={{ width: '100%', marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 7 }}>
                    {PREDEFINED_TOPICS.slice(0, 6).map((t, i) => (
                      <button key={t} onClick={() => setSelectedTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                        className="om-btn"
                        style={{
                          padding: 'clamp(3px,0.8vw,6px) clamp(8px,1.5vw,14px)', borderRadius: 20,
                          fontWeight: 900, fontSize: 'clamp(10px,1.5vw,13px)',
                          background: selectedTopics.includes(t) ? topicColors[i % topicColors.length] : 'rgba(255,255,255,0.85)',
                          color: selectedTopics.includes(t) ? 'white' : '#7C3A00',
                          boxShadow: selectedTopics.includes(t) ? '0 3px 0 rgba(0,0,0,0.2)' : '0 2px 0 rgba(0,0,0,0.1)',
                          fontFamily: "'Nunito',sans-serif",
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                    placeholder="Veya başka konu yaz..."
                    style={{ width: '100%', padding: '7px 12px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 'clamp(11px,1.5vw,13px)', outline: 'none', marginBottom: 7, color: '#7C3A00', fontFamily: "'Nunito',sans-serif" }} />
                  
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                    {[{ id: '1', l: '🌱 Kolay' }, { id: '2', l: '📚 Orta' }, { id: '3', l: '🔥 Zor' }].map(lv => (
                      <button key={lv.id} onClick={() => setLevel(lv.id)} className="om-btn"
                        style={{
                          flex: 1, padding: 'clamp(4px,0.8vw,7px) 4px', borderRadius: 12, fontWeight: 900,
                          fontSize: 'clamp(10px,1.3vw,13px)', fontFamily: "'Nunito',sans-serif",
                          background: level === lv.id ? '#FF7C00' : 'rgba(255,255,255,0.8)',
                          color: level === lv.id ? 'white' : '#7C3A00',
                          boxShadow: level === lv.id ? '0 3px 0 #CC5500' : '0 2px 0 rgba(0,0,0,0.1)',
                        }}>{lv.l}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handleStartFreeReading} className="om-btn"
                  style={{
                    width: '100%', background: 'white', color: '#E67E00',
                    padding: 'clamp(10px,1.8vw,14px)', borderRadius: 24,
                    fontWeight: 900, fontSize: 'clamp(13px,2vw,18px)',
                    border: '3px solid #FF9F00', boxShadow: '0 5px 0 #CC6600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: "'Fredoka One',cursive",
                  }}>
                  OKUMAYA BAŞLA ⭐
                </button>
              </div>

              {/* ── KART 3: AKADEMİ ────────────────────────────── */}
              <div style={{
                width: 'clamp(220px,27vw,295px)',
                background: 'linear-gradient(180deg, #8DA8EA 0%, #6B7FD8 45%, #5060C0 100%)',
                border: '5px solid #3A4A9A', borderRadius: 28,
                boxShadow: '0 14px 40px rgba(0,0,0,0.22), 0 6px 16px rgba(80,96,192,0.3)',
                padding: 'clamp(14px,2.5vw,22px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }} className="om-card-hover">

                <div style={{ fontSize: 'clamp(36px,6vw,56px)', marginBottom: 4, lineHeight: 1, filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.3))' }}>🏔️<span style={{ fontSize: '55%' }}>🏯</span></div>

                <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 'clamp(14px,2.2vw,20px)', color: 'white', textAlign: 'center', margin: '0 0 12px', lineHeight: 1.15, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  HIZLI OKUMA<br />AKADEMİSİ
                </h3>

                <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  {RANKS.map(r => (
                    <div key={r.lvl} style={{
                      background: academyLevel >= r.lvl ? 'linear-gradient(180deg,#FFE566 0%,#FFC107 100%)' : 'rgba(255,255,255,0.15)',
                      borderRadius: 12, padding: 'clamp(5px,1vw,8px) clamp(6px,1.2vw,10px)',
                      textAlign: 'center', border: academyLevel >= r.lvl ? '2px solid #E8A000' : '2px solid rgba(255,255,255,0.2)',
                      opacity: academyLevel >= r.lvl ? 1 : 0.45, flex: 1,
                      boxShadow: academyLevel >= r.lvl ? '0 3px 8px rgba(0,0,0,0.15)' : 'none',
                    }}>
                      <div style={{ fontSize: 'clamp(12px,2vw,18px)' }}>{r.icon}</div>
                      <div style={{ color: academyLevel >= r.lvl ? '#7C4A00' : 'rgba(255,255,255,0.7)', fontSize: 'clamp(7px,1vw,10px)', fontWeight: 900, lineHeight: 1.2, fontFamily: "'Nunito',sans-serif" }}>{r.name}</div>
                      <div style={{ color: academyLevel >= r.lvl ? '#CC7700' : 'rgba(255,255,255,0.4)', fontSize: 'clamp(6px,0.9vw,9px)', fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}>Lvl {r.lvl}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setView('academy-menu'); }}
                  className="om-btn"
                  style={{
                    width: '100%', background: 'linear-gradient(180deg,#1E3A8A 0%,#1E40AF 100%)',
                    color: 'white', padding: 'clamp(10px,1.8vw,14px)',
                    borderRadius: 24, fontWeight: 900, fontSize: 'clamp(12px,1.8vw,16px)',
                    border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 5px 0 #071542',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: "'Fredoka One',cursive",
                  }}>
                  ANTRENMANA BAŞLA 💪
                </button>
              </div>
            </div>
          )}

          {/* ── BİLGİ VE ATEŞ SERİSİ ALTLIĞI ─────────────────────────────────────── */}
          {isAuthenticated && lastStat && (
            <div style={{
              position: 'absolute', bottom: 16, left: 'clamp(90px,14vw,130px)', zIndex: 10,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              borderRadius: 30, padding: 'clamp(7px,1.2vw,10px) clamp(14px,2.5vw,22px)',
              color: 'white', fontWeight: 900, fontSize: 'clamp(13px,2vw,18px)',
              display: 'flex', alignItems: 'center', gap: 10,
              border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              fontFamily: "'Fredoka One',cursive",
            }}>
              WPM: {lastStat.wpm} 🔥 , Skor: {lastStat.compScore}/{lastStat.maxScore} ⭐
            </div>
          )}

          {isAuthenticated && (savedProfile?.streak || 0) > 0 && (
            <div style={{
              position: 'absolute', bottom: 16, left: 'clamp(14px,3vw,24px)', zIndex: 10,
              background: 'rgba(255,200,80,0.95)', border: '2px solid #F59E0B',
              borderRadius: 24, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: "'Fredoka One',cursive",
            }}>
              <Flame size={18} color="#D97706" />
              <span style={{ fontWeight: 900, color: '#92400E', fontSize: 16 }}>{savedProfile.streak}</span>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DİĞER TÜM İÇ EKRANLAR (Hikaye, Akademi, Öğretmen Paneli)
      ══════════════════════════════════════════════════════════════════ */}
      {(view !== 'student-setup' || isGeneratingStory) && (
        <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative pt-8 pb-12 overflow-x-hidden">

          {/* İç Ekranlar Üst Navigasyon */}
          {!['teacher-login', 'teacher'].includes(view) && !isGeneratingStory && (
            <div className="absolute top-4 left-4 flex items-center gap-3 z-50">
              <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white hover:scale-105 transition-transform cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 text-2xl shadow-inner">
                  {displayAvatar?.startsWith('data') ? <img src={displayAvatar} className="w-full h-full object-cover" alt="" /> : (displayAvatar)}
                </div>
                <span className="font-black text-sky-800 text-xl" style={{fontFamily: "'Nunito',sans-serif"}}>{displayName ? displayName.split(' ')[0] : 'Giriş'}</span>
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

          <div className="flex-1 w-full px-4 font-sans">

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
              <div className="max-w-4xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-indigo-300 mt-20 text-center relative">
                <button onClick={() => setView('student-setup')} className="absolute top-6 right-6 bg-slate-100 p-3 rounded-full text-slate-600 hover:bg-slate-200"><X size={24} /></button>
                <h2 className="text-4xl font-black text-indigo-600 mb-4 flex items-center justify-center gap-3"><Eye /> Hızlı Okuma Akademisi</h2>
                <p className="text-xl font-bold text-slate-500 mb-10">Profesyonel göz eğitim simülatörü. Aşama aşama ilerle!</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <button onClick={() => { setView('academy-warmup-ready'); speakInstruction("Hoş geldin! Şimdi göz kaslarımızı güçlendireceğiz. Ekranda sağa ve sola giden kırmızı topu takip etmeni istiyorum. Ama çok önemli bir kuralımız var: Kafanı kesinlikle çevirme! Sadece gözlerinle takip et. Hazırsan başla butonuna bas!"); }}
                    className="p-8 bg-sky-50 border-4 border-sky-200 rounded-[2rem] hover:bg-sky-100 transition-all text-left relative overflow-hidden group shadow-sm">
                    <h3 className="text-2xl font-black text-sky-800 mb-2">1. Isınma (Sarkaç)</h3>
                    <p className="font-bold text-sky-600">Göz kaslarını esnetir. (30sn)</p>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 text-5xl group-hover:scale-110 transition-transform"><Unlock /></div>
                  </button>
                  <button onClick={() => academyLevel >= 2 ? startSchulte() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-sm ${academyLevel >= 2 ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 2 ? 'text-emerald-800' : 'text-slate-500'}`}>2. Schulte Tablosu</h3>
                    <p className={`font-bold ${academyLevel >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>Çevresel görüşünü geliştirir.</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 2 ? 'text-emerald-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 2 ? <Unlock /> : <Lock />}</div>
                  </button>
                  <button onClick={() => academyLevel >= 3 ? startFlash() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-sm ${academyLevel >= 3 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 3 ? 'text-amber-800' : 'text-slate-500'}`}>3. Flaş Kelimeler</h3>
                    <p className={`font-bold ${academyLevel >= 3 ? 'text-amber-600' : 'text-slate-400'}`}>Fotoğrafik algını hızlandırır.</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 3 ? 'text-amber-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 3 ? <Unlock /> : <Lock />}</div>
                  </button>
                  <button onClick={() => academyLevel >= 4 ? startMetronome() : null}
                    className={`p-8 border-4 rounded-[2rem] text-left relative overflow-hidden transition-all shadow-sm ${academyLevel >= 4 ? 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100 cursor-pointer group' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                    <h3 className={`text-2xl font-black mb-2 ${academyLevel >= 4 ? 'text-fuchsia-800' : 'text-slate-500'}`}>4. Metronome</h3>
                    <p className={`font-bold ${academyLevel >= 4 ? 'text-fuchsia-600' : 'text-slate-400'}`}>Ritmik okuma simülatörü.</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl ${academyLevel >= 4 ? 'text-fuchsia-300 group-hover:scale-110' : 'text-slate-300'}`}>{academyLevel >= 4 ? <Unlock /> : <Lock />}</div>
                  </button>
                </div>
              </div>
            )}

            {view === 'academy-warmup-ready' && (
              <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-sky-600 p-4 rounded-full shadow-xl border-4 border-sky-100 hover:bg-sky-50"><ArrowLeft size={24} /></button>
                <h2 className="text-4xl font-black text-sky-600 mb-6">1. Aşama: Isınma</h2>
                <p className="text-2xl font-bold text-sky-800 mb-8">Lütfen cihazın sesini dinle ve yönergeyi anladıktan sonra başla.</p>
                <button onClick={() => speakInstruction("Hoş geldin! Şimdi göz kaslarımızı güçlendireceğiz. Ekranda sağa ve sola giden kırmızı topu takip etmeni istiyorum. Ama çok önemli bir kuralımız var: Kafanı kesinlikle çevirme! Sadece gözlerinle takip et. Hazırsan başla butonuna bas!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                <button onClick={() => { setWarmupTime(30); setView('academy-warmup-active'); }} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-xl border-b-8 border-sky-700 active:translate-y-2 active:border-b-0 transition-all">HAZIRIM, BAŞLA! 🚀</button>
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
                <button onClick={() => speakInstruction("Harika gidiyorsun! Şimdi bir dedektif gibi sayıları bulacağız. Lütfen gözünü tablonun tam ortasından hiç ayırma ve kenarlardaki sayıları birden dokuza kadar sırayla bulup tıkla. Hazırsan başla!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                <button onClick={() => setView('academy-schulte-active')} className="w-full bg-emerald-500 text-white py-6 rounded-2xl text-3xl font-black shadow-xl border-b-8 border-emerald-700 active:translate-y-2 active:border-b-0 transition-all">HAZIRIM, BAŞLA! 🚀</button>
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
                  <div className="flex gap-2">
                    <button onClick={() => setFlashSpeed(2000)} className={`flex-1 py-3 rounded-xl font-black text-lg transition-colors ${flashSpeed === 2000 ? 'bg-emerald-400 text-white shadow-inner' : 'bg-white text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-50'}`}>🐢 Yavaş (2sn)</button>
                    <button onClick={() => setFlashSpeed(1000)} className={`flex-1 py-3 rounded-xl font-black text-lg transition-colors ${flashSpeed === 1000 ? 'bg-amber-400 text-white shadow-inner' : 'bg-white text-amber-600 border-2 border-amber-200 hover:bg-amber-50'}`}>🐇 Normal (1sn)</button>
                    <button onClick={() => setFlashSpeed(600)} className={`flex-1 py-3 rounded-xl font-black text-lg transition-colors ${flashSpeed === 600 ? 'bg-rose-400 text-white shadow-inner' : 'bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50'}`}>🐆 Hızlı (0.6sn)</button>
                  </div>
                </div>
                <button onClick={() => speakInstruction("Şimdi gözlerinle fotoğraf çekme zamanı! Ekranda bir kelime şimşek gibi parlayıp kaybolacak. Onu aklında tut ve aşağıdaki seçeneklerden doğru olanı bul. Gözünü kırpma, hazırsan başla!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                <button onClick={() => { setView('academy-flash-active'); triggerFlashWord(); }} className="w-full bg-amber-500 text-white py-6 rounded-2xl text-3xl font-black shadow-xl border-b-8 border-amber-700 active:translate-y-2 active:border-b-0 transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-flash-active' && (
              <div className="max-w-3xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-amber-200 min-h-[400px]">
                <button onClick={() => setView('academy-menu')} className="absolute -top-6 -left-6 bg-white text-amber-600 p-4 rounded-full shadow-xl border-4 border-amber-100 hover:bg-amber-50"><ArrowLeft size={24} /></button>
                <h2 className="text-3xl font-black text-amber-600 mb-2">Flaş Kelimeler</h2>
                <p className="text-xl font-bold text-slate-500 mb-8">Ekranda parlayan kelimeyi zihnine kazı!</p>
                {flashMessage && <div className="text-2xl font-black text-emerald-500 mb-8">{flashMessage}</div>}
                {isFlashShowing ? (
                  <div className="text-[5rem] md:text-8xl font-black text-slate-800 tracking-tight my-10 animate-in fade-in duration-150">{flashWordsData[flashStage].w}</div>
                ) : (
                  !flashMessage && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                      <p className="text-2xl font-black text-amber-800 mb-8">Az önce ne gördün?</p>
                      <div className="grid grid-cols-3 gap-4">
                        {flashWordsData[flashStage].o.map((opt, i) => (
                          <button key={i} onClick={() => handleFlashAnswer(opt, flashWordsData[flashStage].w)} className="p-6 bg-amber-50 border-4 border-amber-200 rounded-2xl text-2xl font-black text-amber-700 hover:bg-amber-100 active:scale-95 transition-transform shadow-sm">{opt}</button>
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
                <button onClick={() => speakInstruction("İşte büyük görev! Arka planda çalan tik-tak sesinin ritmine uyarak ekrana gelen kelimeleri sesli bir şekilde oku. Ritimden hiç kopma. Hazırsan macerayı başlat!")} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-full font-black mb-8 flex items-center justify-center gap-2 mx-auto hover:bg-amber-200 transition-colors animate-pulse"><Volume2 /> Yönergeyi Tekrar Dinle</button>
                <button onClick={() => { setView('academy-metronome-active'); setMetronomeIndex(0); }} className="w-full bg-fuchsia-500 text-white py-6 rounded-2xl text-3xl font-black shadow-xl border-b-8 border-fuchsia-700 active:translate-y-2 active:border-b-0 transition-all">HAZIRIM, BAŞLA! 🚀</button>
              </div>
            )}

            {view === 'academy-metronome-active' && (
              <div className="max-w-4xl mx-auto mt-20 text-center flex flex-col items-center justify-center relative bg-white p-12 rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 min-h-[500px]">
                <button onClick={() => { setView('academy-menu'); setMetronomeIndex(-1); }} className="absolute -top-6 -left-6 bg-white text-fuchsia-600 p-4 rounded-full shadow-xl border-4 border-fuchsia-100 hover:bg-fuchsia-50"><ArrowLeft size={24} /></button>
                {metronomeIndex < metronomeChunks.length ? (
                  <>
                    <div className="w-full max-w-sm mb-12 bg-fuchsia-50 p-4 rounded-2xl border-4 border-fuchsia-100 shadow-sm">
                      <label className="block text-lg font-black text-fuchsia-800 mb-2">Metronom Hızı: <span className="text-fuchsia-600">{metronomeBPM}</span> BPM</label>
                      <input type="range" min="30" max="150" step="10" value={metronomeBPM} onChange={(e) => setMetronomeBPM(Number(e.target.value))} className="w-full accent-fuchsia-600" />
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <span className="text-6xl md:text-8xl font-black text-fuchsia-800 tracking-tight leading-tight">{metronomeChunks[metronomeIndex]}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <h2 className="text-4xl font-black text-emerald-600">Mükemmel Odaklanma!</h2>
                    <p className="text-2xl font-bold text-emerald-800">Metronom ritmi geriye dönüşleri başarıyla engelledi.</p>
                    <button onClick={() => setView('academy-menu')} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl text-2xl font-black shadow-lg hover:scale-105 transition-transform mt-4">Akademiye Dön</button>
                  </div>
                )}
              </div>
            )}

            {/* OKUMA ÖNCESİ EKRAN */}
            {view === 'reading-ready' && (
              <div className="max-w-2xl mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center animate-in slide-in-from-bottom-10">
                <h2 className="text-4xl font-black text-amber-600 mb-8">Hazır mısın?</h2>
                {micError && <div className="bg-rose-100 text-rose-700 p-4 rounded-xl font-bold mb-6">🎙️ {micError}</div>}
                <div className="flex gap-4 flex-col md:flex-row">
                  <button onClick={() => beginTimer(false)} className="flex-1 bg-sky-500 text-white py-6 rounded-2xl text-2xl font-black border-b-4 border-sky-700 active:translate-y-1 active:border-b-0 transition-all shadow-md">SESSİZ OKU 📖</button>
                  <button onClick={() => beginTimer(true)} className="flex-1 bg-rose-500 text-white py-6 rounded-2xl text-2xl font-black border-b-4 border-rose-700 flex justify-center gap-3 active:translate-y-1 active:border-b-0 transition-all shadow-md"><Mic size={28} /> SESLİ OKU</button>
                </div>
              </div>
            )}

            {/* AKTİF OKUMA EKRANI */}
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
                <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border-8 border-sky-200 relative mt-8">
                  <div className="absolute -top-6 right-6 z-10">
                    <button onClick={() => setShowHeceler(!showHeceler)}
                      className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-black flex items-center gap-2 transition-all duration-300 shadow-xl border-4 border-fuchsia-400 ${showHeceler ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)]' : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 animate-pulse'}`}>
                      <Sparkles size={20} /> HECEMATİK {showHeceler ? 'AÇIK' : 'KAPALI'}
                    </button>
                  </div>
                  <p className="text-2xl md:text-4xl leading-relaxed md:leading-[4.5rem] font-bold text-slate-800 whitespace-pre-wrap mt-4 cursor-default tracking-wide">
                    {renderStoryText()}
                  </p>
                </div>
                {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-6 rounded-full text-4xl font-black shadow-lg hover:bg-emerald-400 active:scale-95 transition-transform mt-4">BİTİRDİM! 🎉</button>}
                {isReadingFinished && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-10">
                    <div className="bg-white p-8 md:p-12 rounded-[3rem] border-8 border-fuchsia-300 space-y-8 shadow-xl">
                      <h2 className="text-4xl font-black text-fuchsia-600 text-center mb-6">Soruları Cevapla 🧠</h2>
                      {storyData.questions.map((q, idx) => (
                        <div key={q.id} className="bg-fuchsia-50 p-6 md:p-8 rounded-3xl border-4 border-fuchsia-100 shadow-sm">
                          <h3 className="text-2xl md:text-3xl font-black text-fuchsia-900 mb-6">{idx + 1}. {q.q}</h3>
                          <div className="flex flex-col gap-4">
                            {q.options.map((opt, optIdx) => (
                              <button key={optIdx} onClick={() => setAnswers({ ...answers, [q.id]: optIdx })} className={`p-5 rounded-2xl font-black text-xl text-left transition-all border-2 ${answers[q.id] === optIdx ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]' : 'bg-white text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button onClick={checkAnswers} disabled={Object.keys(answers).length < storyData.questions.length} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black border-b-8 border-sky-700 disabled:opacity-50 disabled:border-b-0 disabled:translate-y-2 hover:bg-sky-400 transition-all mt-6">KARNEMİ GÖSTER 🏆</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* YZ DEĞERLENDİRME */}
            {view === 'evaluating' && (
              <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl mt-20 text-center animate-in zoom-in duration-300">
                {isUploading ? (
                  <><Loader2 className="w-24 h-24 text-sky-500 animate-spin mx-auto mb-6" /><h2 className="text-3xl font-black text-sky-600">Sesin Öğretmenine Uçuyor... 🚀</h2></>
                ) : (
                  <><Loader2 className="w-20 h-20 text-emerald-500 animate-spin mx-auto mb-6" /><h2 className="text-3xl font-black text-emerald-600">Okuman Değerlendiriliyor... 🌟</h2></>
                )}
              </div>
            )}

            {/* SONUÇ (KARNE) */}
            {view === 'result' && readingResult && (
              <div className="max-w-2xl mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-12 text-center space-y-8 animate-in slide-in-from-bottom-10">
                <div className="text-7xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-4xl font-black text-sky-600">Tebrikler {readingResult.name.split(' ')[0]}!</h2>
                <div className="bg-indigo-50 p-8 rounded-3xl font-bold text-indigo-900 text-2xl relative shadow-inner border-4 border-indigo-100 leading-relaxed text-left">
                  "{readingResult.aiEvaluation.geribildirim}"
                  <button onClick={() => speakInstruction(readingResult.aiEvaluation.geribildirim)} className="absolute -top-6 -right-6 bg-amber-400 text-amber-900 p-4 rounded-full shadow-xl hover:bg-amber-300 transition-transform active:scale-95 animate-bounce border-4 border-white" title="Sesli Dinle">
                    <Volume2 size={32} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm font-black border-4 border-amber-100 text-amber-800 text-xl">
                    <span className="text-amber-500 text-4xl block mb-2">{readingResult.wpm}</span> Hız (WPM)
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm font-black border-4 border-emerald-100 text-emerald-800 text-xl">
                    <span className="text-emerald-500 text-4xl block mb-2">{readingResult.compScore}/{readingResult.maxScore}</span> Doğru
                  </div>
                </div>
                <button onClick={() => setView('student-setup')} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black shadow-lg border-b-8 border-sky-700 active:translate-y-2 active:border-b-0 transition-all mt-6">YENİDEN OYNA 🎮</button>
              </div>
            )}

            {/* ÖĞRETMEN GİRİŞİ */}
            {view === 'teacher-login' && (
              <div className="max-w-md mx-auto bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-200 mt-20">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner"><User size={40} /></div>
                <h2 className="text-3xl font-black text-emerald-600 text-center mb-8">Öğretmen Girişi</h2>
                <form onSubmit={e => { e.preventDefault(); if (teacherPassword === actualTeacherPassword) { setTeacherTab('radar'); setView('teacher'); setPasswordError(false); } else setPasswordError(true); }} className="space-y-6">
                  <input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} className="w-full p-4 border-4 border-emerald-200 rounded-xl text-center text-4xl tracking-[1em] bg-white font-bold outline-none text-emerald-900" placeholder="••••" maxLength={4} />
                  {passwordError && <p className="text-rose-500 font-bold text-center text-lg">Hatalı Şifre!</p>}
                  <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl text-2xl font-black border-b-6 border-emerald-700 active:translate-y-2 active:border-b-0 transition-all">GİRİŞ YAP 🚀</button>
                  <button type="button" onClick={() => setView('student-setup')} className="w-full text-slate-400 font-bold mt-4 hover:text-slate-600 transition-colors">Geri Dön</button>
                </form>
              </div>
            )}

            {/* ÖĞRETMEN PANELİ */}
            {view === 'teacher' && (
              <div className="max-w-6xl mx-auto bg-white/95 rounded-[3rem] shadow-2xl border-8 border-emerald-100 mt-12 min-h-[600px] p-8 md:p-12 relative animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 no-print gap-4">
                  <h2 className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tight">Sınıf Yönetim Merkezi</h2>
                  <button onClick={() => setView('student-setup')} className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full font-black hover:bg-emerald-200 transition-colors border-2 border-emerald-200">Öğrenci Ekranına Dön</button>
                </div>

                <div className="flex flex-wrap border-b-4 border-emerald-100 mb-10 no-print">
                  {[{ id: 'radar', i: <Activity />, l: 'Sınıf Radarı' }, { id: 'stats', i: <FileText />, l: 'Rapor & Arşiv' }, { id: 'homework', i: <BookOpen />, l: 'Ödev Merkezi' }, { id: 'students', i: <Users />, l: 'Öğrenciler' }, { id: 'settings', i: <Settings />, l: 'Ayarlar' }].map(tab => (
                    <button key={tab.id} onClick={() => setTeacherTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-4 font-black capitalize transition-all text-lg ${teacherTab === tab.id ? 'text-emerald-700 border-b-8 border-emerald-500 bg-emerald-50 rounded-t-2xl' : 'text-slate-400 hover:text-emerald-500'}`}>
                      {tab.i} <span className="hidden md:inline">{tab.l}</span>
                    </button>
                  ))}
                </div>

                {/* RADAR */}
                {teacherTab === 'radar' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-3xl font-black text-emerald-800 mb-6">Sınıf Gelişim Radarı</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-sky-50 p-6 rounded-3xl border-4 border-sky-200 text-center shadow-sm">
                        <div className="text-sky-500 text-4xl mb-2">⚡</div>
                        <div className="text-sm font-bold text-sky-700 uppercase tracking-wide">Sınıf Ort. Hızı</div>
                        <div className="text-3xl font-black text-sky-900 mt-1">{stats.length > 0 ? Math.round(stats.reduce((a, b) => a + (Number(b.wpm) || 0), 0) / stats.length) : 0} WPM</div>
                      </div>
                      <div className="bg-fuchsia-50 p-6 rounded-3xl border-4 border-fuchsia-200 text-center shadow-sm">
                        <div className="text-fuchsia-500 text-4xl mb-2">📚</div>
                        <div className="text-sm font-bold text-fuchsia-700 uppercase tracking-wide">Toplam Okuma</div>
                        <div className="text-3xl font-black text-fuchsia-900 mt-1">{stats.length} Kere</div>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-3xl border-4 border-amber-200 text-center shadow-sm">
                        <div className="text-amber-500 text-4xl mb-2">🎯</div>
                        <div className="text-sm font-bold text-amber-700 uppercase tracking-wide">Genel Doğruluk</div>
                        <div className="text-3xl font-black text-amber-900 mt-1">{stats.length > 0 ? ((stats.reduce((a, b) => a + (Number(b.compScore) || 0), 0) / Math.max(1, stats.reduce((a, b) => a + (Number(b.maxScore) || 2), 0))) * 100).toFixed(0) : 0}%</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-emerald-50 p-8 rounded-3xl border-4 border-emerald-200 shadow-sm relative overflow-hidden">
                        <TrendingUp size={100} className="absolute -right-8 -bottom-8 text-emerald-200 opacity-50" />
                        <h4 className="text-2xl font-black text-emerald-600 mb-6 flex items-center gap-2 relative z-10"><TrendingUp /> Hızlanan Öğrenciler</h4>
                        <ul className="space-y-4 relative z-10">
                          {students.map(s => {
                            const ss = stats.filter(r => r.name === s.name).reverse();
                            if (ss.length >= 2 && Number(ss[0].wpm) > Number(ss[1].wpm)) {
                              return <li key={s.id} className="bg-white p-4 rounded-xl shadow-sm border-l-8 border-emerald-500 font-bold text-emerald-900 flex justify-between items-center text-lg"><span>{s.name}</span><span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">+{Number(ss[0].wpm) - Number(ss[1].wpm)} WPM</span></li>;
                            } return null;
                          })}
                        </ul>
                      </div>
                      <div className="bg-rose-50 p-8 rounded-3xl border-4 border-rose-200 shadow-sm relative overflow-hidden">
                        <Activity size={100} className="absolute -right-8 -bottom-8 text-rose-200 opacity-50" />
                        <h4 className="text-2xl font-black text-rose-600 mb-6 flex items-center gap-2 relative z-10"><Activity /> Desteğe İhtiyacı Olanlar</h4>
                        <ul className="space-y-4 relative z-10">
                          {students.map(s => {
                            const ss = stats.filter(r => r.name === s.name).reverse();
                            if (ss.length >= 2 && Number(ss[0].wpm) < Number(ss[1].wpm)) {
                              return <li key={s.id} className="bg-white p-4 rounded-xl shadow-sm border-l-8 border-rose-500 font-bold text-rose-900 flex justify-between items-center text-lg"><span>{s.name}</span><span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">{Number(ss[0].wpm) - Number(ss[1].wpm)} WPM</span></li>;
                            } return null;
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* STATS */}
                {teacherTab === 'stats' && (
                  <div id="print-section" className="animate-in fade-in duration-300">
                    <div className="mb-8 flex flex-col md:flex-row items-center gap-4 bg-emerald-50 p-6 rounded-3xl border-4 border-emerald-100 no-print">
                      <label className="font-black text-emerald-800 text-xl whitespace-nowrap">Öğrenci Seç:</label>
                      <select value={selectedStudentForProgress || ''} onChange={(e) => setSelectedStudentForProgress(e.target.value || null)} className="flex-1 p-4 border-4 border-emerald-200 rounded-2xl font-bold text-emerald-900 bg-white outline-none text-lg">
                        <option value="">Tüm Sınıf (Genel Liste)</option>
                        {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      {selectedStudentForProgress && (
                        <button onClick={() => window.print()} className="w-full md:w-auto bg-sky-500 hover:bg-sky-400 text-white p-4 rounded-2xl shadow-md font-black flex items-center justify-center gap-2 text-lg"><Printer size={24} /> Veli PDF Çıktısı</button>
                      )}
                    </div>
                    {selectedStudentForProgress && (
                      <div className="bg-white p-8 rounded-3xl border-4 border-emerald-100 mb-8 shadow-sm overflow-x-auto">
                        <h4 className="font-black text-emerald-800 mb-8 text-center text-2xl">{selectedStudentForProgress} - Okuma Hızı Gelişim Grafiği (WPM)</h4>
                        {(() => {
                          const studentStats = [...stats].filter(r => r.name === selectedStudentForProgress).reverse();
                          if (studentStats.length === 0) return <div className="text-center text-emerald-600 font-bold text-lg">Grafik oluşturulacak veri yok.</div>;
                          const allWpm = studentStats.map(s => Number(s.wpm) || 0);
                          const maxWpm = Math.max(...allWpm, 50) + 10;
                          const chartHeight = 200; const pointWidth = 80;
                          const chartWidth = Math.max(studentStats.length * pointWidth, 600);
                          const points = studentStats.map((row, idx) => { const x = idx * pointWidth + 40; const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight; return `${x},${y}`; }).join(" ");
                          return (
                            <div className="w-full overflow-x-auto pb-6">
                              <svg width={chartWidth} height={chartHeight + 40} className="mx-auto block">
                                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="2" />
                                <polyline points={points} fill="none" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" />
                                {studentStats.map((row, idx) => { const x = idx * pointWidth + 40; const y = chartHeight - ((Number(row.wpm) || 0) / maxWpm) * chartHeight; return (<g key={idx}><circle cx={x} cy={y} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" /><text x={x} y={y - 15} textAnchor="middle" className="text-[14px] font-black fill-emerald-700">{row.wpm}</text><text x={x} y={chartHeight + 25} textAnchor="middle" className="text-[10px] font-bold fill-slate-400">{row.date?.split(' - ')[0]}</text></g>); })}
                              </svg>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <div className="overflow-x-auto bg-white rounded-3xl border-4 border-emerald-50 shadow-sm p-2">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-4 border-emerald-100 bg-emerald-50/50">
                            {!selectedStudentForProgress && <th className="p-5 font-black text-emerald-800">İsim</th>}
                            <th className="p-5 font-black text-emerald-800">Tarih - Saat</th>
                            <th className="p-5 font-black text-emerald-800">Tür</th>
                            <th className="p-5 font-black text-emerald-800 text-center">Hız (WPM)</th>
                            <th className="p-5 font-black text-emerald-800 text-center">Skor</th>
                            <th className="p-5 font-black text-emerald-800 text-center no-print">Ses Kaydı</th>
                            <th className="p-5 font-black text-emerald-800 text-center no-print">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedStudentForProgress ? stats.filter(r => r.name === selectedStudentForProgress) : stats).map(row => (
                            <tr key={row.id} className="border-b border-emerald-50 font-bold text-slate-700 hover:bg-emerald-50/30 transition-colors">
                              {!selectedStudentForProgress && <td className="p-5 text-emerald-900 text-lg">{row.name}</td>}
                              <td className="p-5 text-sm">{row.date || 'Belirtilmedi'}</td>
                              <td className="p-5">{row.level === 'Ödev' ? <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm border-2 border-amber-200">Ödev</span> : <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-lg text-sm border-2 border-sky-200">{row.interest}</span>}</td>
                              <td className="p-5 text-center text-xl text-amber-600 font-black">{row.wpm}</td>
                              <td className="p-5 text-center text-xl text-emerald-600 font-black">{row.compScore}/{row.maxScore || 2}</td>
                              <td className="p-5 text-center no-print">{row.audioUrl ? <audio src={row.audioUrl} controls className="h-10 w-full max-w-[200px] mx-auto outline-none" /> : <span className="text-slate-400 text-sm">Yok</span>}</td>
                              <td className="p-5 text-center no-print"><button onClick={() => handleDeleteStat(row.id)} className="bg-rose-100 text-rose-600 p-3 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={20} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* HOMEWORK */}
                {teacherTab === 'homework' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {activeHomework && (
                      <div className="bg-amber-50 p-8 rounded-3xl border-4 border-amber-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-black text-amber-800">Şu An Yayında Olan Aktif Ödev Var!</h3>
                          <p className="font-bold text-amber-600 mt-2 text-lg">Bitiş Süresi: {activeHomework.deadline ? new Date(activeHomework.deadline).toLocaleString('tr-TR') : 'Süresiz'}</p>
                        </div>
                        <button onClick={handleRemoveHomework} className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-md flex items-center justify-center gap-2 text-lg transition-colors"><Trash2 size={24} /> Aktif Ödevi Kaldır</button>
                      </div>
                    )}
                    <div className="bg-fuchsia-50 p-8 rounded-3xl border-4 border-fuchsia-100 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                      <h3 className="w-full text-2xl font-black text-fuchsia-800 mb-2 flex items-center gap-3"><Sparkles size={28} /> YZ ile Ödev Üret</h3>
                      <input type="text" placeholder="Ödev Konusu" value={hwTopic} onChange={e => setHwTopic(e.target.value)} className="w-full md:flex-1 p-4 border-4 border-fuchsia-200 rounded-2xl font-bold outline-none text-lg text-fuchsia-900" />
                      <select value={hwLevel} onChange={e => setHwLevel(e.target.value)} className="w-full md:w-auto p-4 border-4 border-fuchsia-200 rounded-2xl font-bold bg-white text-fuchsia-900 text-lg outline-none cursor-pointer">
                        <option value="1">Kolay</option><option value="2">Orta</option><option value="3">Zor</option>
                      </select>
                      <button onClick={handleGenerateHomeworkAI} disabled={isGeneratingHw} className="w-full md:w-auto bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-lg shadow-[0_4px_0_rgb(162,28,175)] active:translate-y-1 active:shadow-none">
                        {isGeneratingHw ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />} ÜRET
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xl font-black text-emerald-800 mb-3">Okuma Metni:</label>
                        <textarea value={hwText} onChange={e => setHwText(e.target.value)} className="w-full p-6 border-4 border-emerald-200 rounded-3xl h-64 font-bold text-lg outline-none text-slate-700 leading-relaxed shadow-inner" placeholder="Metni buraya yazın veya yapay zekaya ürettirin..." />
                      </div>
                      <div>
                        <label className="block text-xl font-black text-amber-800 mb-3 flex items-center gap-2"><Calendar /> Teslim Süresi:</label>
                        <input type="datetime-local" value={hwDeadline} onChange={e => setHwDeadline(e.target.value)} className="w-full p-6 border-4 border-amber-200 rounded-3xl font-bold bg-amber-50 text-amber-900 outline-none text-lg shadow-inner" />
                        <p className="text-md font-bold text-slate-500 mt-4 px-2 italic">* Seçilen tarih geldiğinde ödev otomatik silinir.</p>
                      </div>
                    </div>
                    <div className="space-y-6 bg-slate-50 p-8 rounded-[3rem] border-4 border-slate-100">
                      <h3 className="text-2xl font-black text-emerald-800 mb-4">Sorular:</h3>
                      {hwQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white p-8 rounded-3xl border-4 border-emerald-100 space-y-4 relative shadow-sm">
                          {hwQuestions.length > 1 && (<button onClick={() => setHwQuestions(hwQuestions.filter((_, i) => i !== qIndex))} className="absolute top-6 right-6 text-rose-500 bg-rose-50 p-3 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={20} /></button>)}
                          <label className="font-black text-emerald-600 text-lg">Soru {qIndex + 1}:</label>
                          <input type="text" value={q.q} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].q = e.target.value; setHwQuestions(newQs); }} className="w-full p-4 border-2 border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-emerald-400" placeholder="Soru cümlesi..." />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {[0, 1, 2].map(optIndex => (<input key={optIndex} type="text" value={q.options[optIndex]} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].options[optIndex] = e.target.value; setHwQuestions(newQs); }} className="p-4 border-2 border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-emerald-400" placeholder={`${['A', 'B', 'C'][optIndex]} Şıkkı`} />))}
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100 flex items-center gap-4 mt-4">
                            <label className="font-black text-emerald-800 text-lg whitespace-nowrap">Doğru Cevap:</label>
                            <select value={q.correct} onChange={e => { const newQs = [...hwQuestions]; newQs[qIndex].correct = Number(e.target.value); setHwQuestions(newQs); }} className="w-full md:w-auto p-3 bg-white border-2 border-emerald-200 rounded-xl font-black text-lg text-emerald-700 outline-none cursor-pointer">
                              <option value={0}>A Şıkkı</option><option value={1}>B Şıkkı</option><option value={2}>C Şıkkı</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setHwQuestions([...hwQuestions, { q: '', options: ['', '', ''], correct: 0 }])} className="w-full bg-emerald-100 text-emerald-700 py-6 rounded-3xl font-black text-xl border-4 border-emerald-200 border-dashed flex items-center justify-center gap-3 hover:bg-emerald-200 transition-colors"><Plus size={28} /> YENİ SORU EKLE</button>
                    </div>
                    <button onClick={handlePublishHomework} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-6 rounded-full font-black text-3xl shadow-[0_8px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all mt-8 flex items-center justify-center gap-4"><Send size={32} /> SINIF PANOSUNA GÖNDER 🚀</button>
                  </div>
                )}

                {/* STUDENTS */}
                {teacherTab === 'students' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row gap-4 mb-10 bg-emerald-50 p-6 md:p-8 rounded-3xl border-4 border-emerald-200 shadow-sm">
                      <input type="text" placeholder="Öğrenci Adı Soyadı" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="flex-1 p-5 border-4 border-white rounded-2xl font-black text-xl outline-none shadow-inner" />
                      <input type="text" placeholder="Şifre" value={newStudentPassword} onChange={e => setNewStudentPassword(e.target.value)} className="w-full md:w-40 p-5 border-4 border-white rounded-2xl font-black text-center text-xl outline-none shadow-inner" />
                      <button onClick={handleAddStudent} className="bg-emerald-500 text-white font-black px-10 py-4 rounded-2xl shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition-all text-xl">EKLE</button>
                    </div>
                    {students.length === 0 && <button onClick={handleLoadDefaultClass} className="bg-amber-100 text-amber-800 px-8 py-4 rounded-full font-black text-lg border-4 border-amber-200 mb-8 mx-auto block hover:bg-amber-200 transition-colors shadow-sm">1/A Hazır Listesini Yükle</button>}
                    <div className="grid grid-cols-1 gap-4">
                      {students.map(s => (
                        <div key={s.id} className="flex flex-col md:flex-row justify-between items-center p-6 bg-white rounded-3xl border-4 border-emerald-100 shadow-sm gap-6 hover:border-emerald-300 transition-colors">
                          <div className="flex-1 font-black text-emerald-900 text-2xl flex items-center gap-4">
                            {s.name}
                            {s.teacherStars > 0 && <span className="bg-amber-100 text-amber-600 text-sm px-3 py-1 rounded-full flex items-center gap-1 border-2 border-amber-200 shadow-sm">🌟 x{s.teacherStars}</span>}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            <button onClick={() => handleGiveTeacherStar(s.id, s.teacherStars)} className="bg-amber-400 text-white p-4 rounded-2xl shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none hover:bg-amber-500 transition-all border-2 border-amber-500" title="Motivasyon Yıldızı Gönder"><Gift size={24} /></button>
                            <div className="bg-indigo-50 border-4 border-indigo-100 rounded-2xl flex items-center p-2 font-black text-indigo-800">
                              <span className="px-3 text-sm">Akademi Lvl:</span>
                              <select value={s.academyLevel || 1} onChange={(e) => updateAcademyLevel(Number(e.target.value), s.id)} className="bg-white border-2 border-indigo-200 rounded-xl p-2 outline-none cursor-pointer">
                                <option value={1}>1. Isınma</option><option value={2}>2. Schulte</option><option value={3}>3. Flaş</option><option value={4}>4. Metronom</option>
                              </select>
                            </div>
                            {editingPasswords[s.id] !== undefined ? (
                              <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-2xl border-4 border-emerald-100">
                                <input type="text" value={editingPasswords[s.id]} onChange={(e) => setEditingPasswords({ ...editingPasswords, [s.id]: e.target.value })} className="w-24 p-3 border-2 border-emerald-300 rounded-xl text-center font-black tracking-widest outline-none bg-white" maxLength={4} />
                                <button onClick={() => handleUpdatePassword(s.id, editingPasswords[s.id])} className="bg-emerald-500 text-white p-3 rounded-xl font-bold shadow-sm"><Check size={20} /></button>
                                <button onClick={() => { const newEd = { ...editingPasswords }; delete newEd[s.id]; setEditingPasswords(newEd); }} className="bg-slate-200 text-slate-600 p-3 rounded-xl font-bold shadow-sm"><X size={20} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border-4 border-slate-100">
                                <span className="bg-white px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 tracking-widest font-black">{s.password}</span>
                                <button onClick={() => setEditingPasswords({ ...editingPasswords, [s.id]: s.password })} className="bg-sky-500 text-white px-4 py-3 rounded-xl shadow-[0_4px_0_rgb(3,105,161)] active:translate-y-1 active:shadow-none font-black text-sm">Şifre</button>
                              </div>
                            )}
                            <button onClick={() => handleDeleteStudent(s.id, s.name)} className="bg-rose-100 text-rose-600 p-4 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border-2 border-rose-200 ml-2" title="Öğrenciyi Sil"><Trash2 size={24} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {teacherTab === 'settings' && (
                  <div className="flex flex-col max-w-lg mx-auto gap-6 mt-12 bg-emerald-50 p-10 rounded-[3rem] border-4 border-emerald-100 animate-in fade-in duration-300 shadow-sm">
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-emerald-500 shadow-sm mb-4 border-4 border-emerald-200"><Lock size={32} /></div>
                      <h3 className="text-2xl font-black text-emerald-800">Yönetici Şifresi</h3>
                      <p className="text-emerald-600 font-bold mt-2">Öğretmen paneline giriş şifrenizi güncelleyin.</p>
                    </div>
                    <input type="text" placeholder="Yeni 4 Haneli Şifre" value={newTeacherPasswordInput} onChange={e => setNewTeacherPasswordInput(e.target.value)} className="p-5 border-4 border-white rounded-2xl font-black text-center tracking-[1em] text-2xl outline-none focus:border-emerald-300" maxLength={4} />
                    <button onClick={handleUpdateTeacherPassword} className="bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all text-xl mt-2">ŞİFREYİ GÜNCELLE</button>
                  </div>
                )}

                {teacherMsg && (
                  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-8 py-4 rounded-full font-black text-lg shadow-2xl animate-bounce z-50 flex items-center gap-3">
                    <Check className="text-emerald-400" /> {teacherMsg}
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
