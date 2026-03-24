import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, Image as ImageIcon, X, Flame, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// 1. FİREBASE BAĞLANTISI
// ============================================================================
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

// ============================================================================
// 2. GEMİNİ API AYARLARI (Şifreniz Eklendi)
// ============================================================================
const EXTERNAL_GEMINI_API_KEY = "AIzaSyDUJOYdeQJ09dV2mHxvrE5NOsygOJjFvLg"; 

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
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
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
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
      const loadedStats = [];
      snapshot.forEach((docItem) => {
        loadedStats.push({ id: docItem.id, ...docItem.data() });
      });
      loadedStats.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setStats(loadedStats);
    }, (error) => console.error("Stats fetch error:", error));

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
      const loadedStudents = [];
      snapshot.forEach((docItem) => {
        loadedStudents.push({ id: docItem.id, ...docItem.data() });
      });
      loadedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      setStudents(loadedStudents);
    }, (error) => console.error("Students fetch error:", error));

    const hwRef = doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current');
    const unsubscribeHw = onSnapshot(hwRef, (docSnap) => {
      if (docSnap.exists()) setActiveHomework(docSnap.data());
      else setActiveHomework(null);
    }, (error) => console.error("Homework fetch error:", error));

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().password) {
        setActualTeacherPassword(docSnap.data().password);
      }
    }, (error) => console.error("Settings fetch error:", error));

    return () => {
      unsubscribeStats();
      unsubscribeStudents();
      unsubscribeHw();
      unsubscribeSettings();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsCheckingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const showTeacherMessage = (msg) => {
    setTeacherMsg(msg);
    setTimeout(() => setTeacherMsg(''), 4000);
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPassword) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
        name: newStudentName.trim(),
        password: newStudentPassword.trim()
      });
      setNewStudentName('');
      setNewStudentPassword('1234');
      showTeacherMessage(`✅ ${newStudentName} sınıfa eklendi!`);
    } catch (e) {
      showTeacherMessage(`❌ Öğrenci eklenemedi.`);
    }
  };

  const handleUpdatePassword = async (id, newPassword) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), {
        password: newPassword
      });
      showTeacherMessage('✅ Şifre başarıyla güncellendi!');
      const newEditing = {...editingPasswords};
      delete newEditing[id];
      setEditingPasswords(newEditing);
    } catch (e) {
      showTeacherMessage('❌ Şifre güncellenemedi.');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id));
      showTeacherMessage(`🗑️ ${name} sınıftan silindi.`);
    } catch (e) {
      showTeacherMessage(`❌ Öğrenci silinemedi.`);
    }
  };

  const handleLoadDefaultClass = async () => {
    showTeacherMessage('⏳ Liste yükleniyor, lütfen bekleyin...');
    try {
      for (const name of DEFAULT_CLASS_LIST) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          name: name,
          password: '1234'
        });
      }
      showTeacherMessage('✅ 1/A Sınıf Listesi başarıyla yüklendi!');
    } catch (e) {
      showTeacherMessage('❌ Liste yüklenirken hata oluştu.');
    }
  };

  const handleUpdateTeacherPassword = async () => {
    if (!newTeacherPasswordInput || newTeacherPasswordInput.length < 4) {
      showTeacherMessage("❌ Şifre en az 4 haneli olmalıdır."); return;
    }
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin'), {
        password: newTeacherPasswordInput.trim()
      }, { merge: true });
      setNewTeacherPasswordInput('');
      showTeacherMessage("✅ Öğretmen şifresi başarıyla güncellendi!");
    } catch (e) {
      showTeacherMessage("❌ Şifre güncellenemedi.");
    }
  };

  const handleAvatarChange = async (ava) => {
    setStudentAvatar(ava);
    if (savedProfile && user) {
      const newProfile = { ...savedProfile, avatar: ava };
      setSavedProfile(newProfile);
      try {
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved');
        await setDoc(profileRef, newProfile, { merge: true });
      } catch (e) {
        console.error("Profil güncellenemedi:", e);
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { 
        setLoginError("Lütfen daha küçük boyutlu bir fotoğraf seçin.");
        setTimeout(() => setLoginError(''), 4000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAvatarChange(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const callGeminiAPI = async (topic, selectedLevel) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY || ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');

    const prompt = `Sen dünyanın en iyi çocuk edebiyatı yazarı ve şefkatli bir 1. sınıf öğretmenisin. 
    Konu(lar): ${topic}
    PEDAGOJİK SEVİYE TABLOSU (BU KURALLARA KESİNLİKLE UYULACAK):
    - Seviye 1 (Kolay): 15-25 kelime arası. Cümleler kısa ve basit (Özne + Yüklem). Odak: Kelime tanıma ve temel yargı.
    - Seviye 2 (Orta): 25-45 kelime arası. Birleşik cümleler, sıfat tamlamaları. Odak: Olay örgüsünü takip etme.
    - Seviye 3 (Zor): 45-70 kelime arası. Neden-sonuç ilişkisi içeren paragraflar. Odak: Çıkarım yapma ve detayları yakalama.

    Seçilen Seviye: ${selectedLevel}
    
    GÖREV: Seçilen seviyenin kelime sayısına tam uyarak, çocuk edebiyatına uygun, masalsı, sıcak ve merak uyandırıcı bir dille Türkçe bir hikaye yaz. 
    Karakter isimlerini şu listeden seç: ${studentNamesStr || 'Ali, Elif'}. 
    Hikaye sonunda bu metinle ilgili 3 şıklı 2 adet anlama sorusu hazırla.
    
    YALNIZCA aşağıdaki JSON formatında cevap ver:
    {
      "text": "Hikaye metni buraya...",
      "questions": [
        { "id": 1, "q": "Soru 1?", "options": ["Şık A", "Şık B", "Şık C"], "correct": 0 },
        { "id": 2, "q": "Soru 2?", "options": ["Şık A", "Şık B", "Şık C"], "correct": 1 }
      ]
    }`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const delays = [1000, 2000, 4000, 8000, 16000]; 
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("API hatası");
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (err) {
        if (i === 4) throw err;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };

  const evaluateReadingWithAI = async (text, timeSeconds, wpm, compScore, audioDataUrl) => {
    const apiKey = EXTERNAL_GEMINI_API_KEY || ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const parts = [
      { text: `Sen şefkatli bir öğretmensin. Öğrenci performansı:
      Metin: "${text}"
      Hız: ${wpm} wpm. Skor: 2/${compScore}.
      JSON formatında 1-5 arası puanla ve şefkatli geri bildirim yaz:
      { "akicilik": 4, "telaffuz": 5, "anlama": 5, "okuma_hizi": 4, "geribildirim": "..." }` }
    ];

    if (audioDataUrl) {
      try {
        parts.push({ inlineData: { mimeType: "audio/webm", data: audioDataUrl.split(',')[1] } });
      } catch (e) {
        console.error("Audio error", e);
      }
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Eval API hatası");
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) {
      return { 
        akicilik: wpm > 30 ? 5 : 4, 
        telaffuz: 5, 
        anlama: compScore === 2 ? 5 : (compScore === 1 ? 4 : 3), 
        okuma_hizi: wpm > 40 ? 5 : (wpm > 20 ? 4 : 3), 
        geribildirim: "Harika bir okuma yaptın! Pratik yapmaya devam ettikçe daha da hızlanacaksın. 🌟" 
      };
    }
  };

  const handleGenerateAIHomework = async () => {
    if (!aiTopic) {
      showTeacherMessage("❌ Lütfen yapay zekanın ödev üreteceği bir konu yazın.");
      return;
    }
    setIsGeneratingHomework(true);
    try {
      const aiData = await callGeminiAPI(aiTopic, '2'); 
      setHwForm({
        text: aiData.text,
        q1: aiData.questions[0].q, q1o1: aiData.questions[0].options[0], q1o2: aiData.questions[0].options[1], q1o3: aiData.questions[0].options[2], q1c: aiData.questions[0].correct,
        q2: aiData.questions[1].q, q2o1: aiData.questions[1].options[0], q2o2: aiData.questions[1].options[1], q2o3: aiData.questions[1].options[2], q2c: aiData.questions[1].correct,
      });
      showTeacherMessage("✨ Yapay zeka ödev taslağını hazırladı! Aşağıdan kontrol edip sınıfa gönderebilirsiniz.");
    } catch (err) {
      showTeacherMessage("❌ Ödev oluşturulurken hata oluştu.");
    } finally {
      setIsGeneratingHomework(false);
    }
  };

  const validateStudent = () => {
    if (!studentName || !studentPassword) {
      setLoginError('Lütfen adını seç ve şifreni gir.'); 
      return false;
    }
    const matchedStudent = students.find(s => s.name === studentName);
    if (!matchedStudent) {
      setLoginError('Sınıf listesinde adın bulunamadı.'); return false;
    }
    if (matchedStudent.password !== studentPassword) {
      setLoginError('Hatalı şifre! Lütfen şifreni tekrar gir.'); return false;
    }
    setLoginError('');
    return true;
  };

  const saveProfileDataLocally = async () => {
    if (!user || !rememberMe) return;
    try {
      const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
      const profileData = { 
        studentName, studentPassword, avatar: studentAvatar, 
        interest: combinedInterest || 'Uzay', level,
        streak: savedProfile?.streak || 0, lastReadingDate: savedProfile?.lastReadingDate || null
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), profileData);
      setSavedProfile(profileData);
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  const clearProfile = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'));
      setSavedProfile(null);
      setRememberMe(false);
      setStudentName('');
      setStudentPassword('');
      setStudentAvatar('🐶');
      setSelectedTopics([]);
      setCustomTopic('');
    } catch (e) {
      console.error("Error deleting profile", e);
    }
  };

  const handleStartFreeReading = async () => {
    if (!validateStudent()) return;
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) {
      setLoginError('Lütfen en az bir ilgi alanı seç veya yaz.'); return;
    }
    await saveProfileDataLocally();
    await startReadingSession(combinedInterest, level, false);
  };

  const handleStartHomework = async () => {
    if (!validateStudent()) return;
    if (!activeHomework) return;
    await saveProfileDataLocally();
    await startReadingSession('Sınıf Ödevi', 'Ödev', true);
  };

  const handleSavedProfileStartReading = async () => {
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) {
      setLoginError('Lütfen en az bir ilgi alanı seç veya yaz.'); return;
    }
    await saveProfileDataLocally();
    await startReadingSession(combinedInterest, level, false);
  };

  const handleProfileHomework = async () => {
    await startReadingSession('Sınıf Ödevi', 'Ödev', true);
  };

  const startReadingSession = async (currentInterest, currentLevel, isHomework) => {
    setInterest(currentInterest);
    setLevel(currentLevel);
    setAnswers({});
    setHasRetried(false);
    setAudioUrl(null);
    setIsReadingFinished(false);
    
    if (isHomework) {
      setStoryData(activeHomework);
      setView('reading-ready');
    } else {
      setIsGeneratingStory(true);
      try {
        const aiData = await callGeminiAPI(currentInterest, currentLevel);
        setStoryData(aiData);
        setView('reading-ready');
      } catch (err) {
        setLoginError("Hikaye oluşturulurken bir hata oluştu. Lütfen tekrar dene.");
        setView('student-setup');
      } finally {
        setIsGeneratingStory(false);
      }
    }
  };

  const beginTimer = async (withRecording = false) => {
    if (withRecording) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
         setMicError("Cihazınız ses kaydını desteklemiyor. Lütfen 'Sessiz Oku' seçeneğini kullanın.");
         setTimeout(() => setMicError(''), 5000);
         return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            setAudioUrl(reader.result);
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        setMicError("Mikrofon izni alınamadı. Lütfen tarayıcıdan izin verin veya 'Sessiz Oku' seçeneğini kullanın.");
        setTimeout(() => setMicError(''), 5000);
        return;
      }
    }
    setStartTime(Date.now());
    setView('reading-active');
  };

  const finishReading = () => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }

    const endTime = Date.now();
    const timeSpentSeconds = (endTime - startTime) / 1000;
    const wordCount = storyData.text.split(/\s+/).length;
    const wpm = Math.round((wordCount / timeSpentSeconds) * 60);

    setTempStats({ words: wordCount, timeSeconds: Math.round(timeSpentSeconds), wpm: wpm });
    setIsReadingFinished(true);
  };

  const checkAnswers = () => {
    let correctCount = 0;
    storyData.questions.forEach(q => {
      if (answers[q.id] === q.correct) correctCount++;
    });

    if (correctCount < 2 && !hasRetried) {
      setView('retry-prompt');
    } else {
      calculateFinalResult();
    }
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const calculateFinalResult = async () => {
    try {
      let correctCount = 0;
      storyData.questions.forEach(q => {
        if (answers[q.id] === q.correct) correctCount++;
      });

      setView('evaluating');
      setIsEvaluating(true);

      const aiEvaluation = await evaluateReadingWithAI(
        storyData.text, 
        tempStats.timeSeconds, 
        tempStats.wpm, 
        correctCount, 
        audioUrl
      );

      let currentStreak = savedProfile?.streak || 0;
      const todayStr = getTodayStr();
      const lastReading = savedProfile?.lastReadingDate;

      if (lastReading) {
        const d1 = new Date(lastReading);
        const d2 = new Date(todayStr);
        d1.setHours(0,0,0,0);
        d2.setHours(0,0,0,0);
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1; 
        } else if (diffDays > 1) {
          currentStreak = 1; 
        } 
      } else {
        currentStreak = 1;
      }

      if (user && savedProfile) {
        const newProfile = { ...savedProfile, streak: currentStreak, lastReadingDate: todayStr };
        setSavedProfile(newProfile);
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profileData', 'saved'), newProfile, { merge: true });
      }

      const safeAudioUrl = audioUrl || null;

      const newResult = {
        name: studentName,
        avatar: studentAvatar,
        interest: interest,
        level: level,
        words: tempStats.words,
        timeSeconds: tempStats.timeSeconds,
        wpm: tempStats.wpm,
        compScore: correctCount,
        audioUrl: safeAudioUrl,
        aiEvaluation: aiEvaluation,
        streakAchieved: currentStreak,
        date: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
        timestamp: serverTimestamp()
      };

      setReadingResult(newResult);
      setIsEvaluating(false);
      setView('result');

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult);
      } catch (e) {
        console.error("Firestore kayit hatasi: ", e);
      }
    } catch (criticalError) {
      console.error("Karne olusturulurken kritik hata:", criticalError);
      setReadingResult({
        name: studentName, avatar: studentAvatar, interest: interest, level: level,
        wpm: tempStats.wpm, compScore: Object.keys(answers).length, streakAchieved: 1,
        aiEvaluation: { geribildirim: "Harika okudun! 🌟", telaffuz: 5, akicilik: 5, anlama: 5, okuma_hizi: 5 }
      });
      setIsEvaluating(false);
      setView('result');
    }
  };

  const handleRetry = () => {
    setHasRetried(true);
    setAnswers({});
    setView('reading-active');
  };

  const resetStudent = () => {
    setStoryData(null); setStartTime(null); setTempStats(null);
    setAnswers({}); setReadingResult(null); setHasRetried(false);
    setAudioUrl(null); setIsReadingFinished(false);
    
    if (!savedProfile) {
      setStudentName(''); setSelectedTopics([]); setCustomTopic('');
      setLevel('1'); setStudentPassword(''); setLoginError('');
      setStudentAvatar('🐶');
    }
    setView('student-setup');
  };

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    if (teacherPassword === actualTeacherPassword) {
      setTeacherTab('students'); 
      setView('teacher');
      setTeacherPassword('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handlePublishHomework = async () => {
    if (!hwForm.text || !hwForm.q1 || !hwForm.q2) {
      showTeacherMessage("❌ Lütfen metni ve soruları eksiksiz doldurun."); return;
    }
    const newHomework = {
      text: hwForm.text,
      questions: [
        { id: 1, q: hwForm.q1, options: [hwForm.q1o1, hwForm.q1o2, hwForm.q1o3], correct: hwForm.q1c },
        { id: 2, q: hwForm.q2, options: [hwForm.q2o1, hwForm.q2o2, hwForm.q2o3], correct: hwForm.q2c }
      ],
      timestamp: serverTimestamp()
    };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current'), newHomework);
      showTeacherMessage("✅ Ödev tüm sınıfa başarıyla gönderildi!");
      setTeacherTab('stats');
    } catch (err) {
      showTeacherMessage("❌ Ödev gönderilirken bir hata oluştu.");
    }
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderStars = (score) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-6 h-6 md:w-8 md:h-8 ${i < score ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
    ));
  };

  const getStudentProgressData = () => {
    const studentMap = {};
    stats.forEach(s => {
      if (!studentMap[s.name]) {
        studentMap[s.name] = { name: s.name, avatar: s.avatar, readings: [], totalWpm: 0, totalComp: 0 };
      }
      studentMap[s.name].readings.push(s);
      studentMap[s.name].totalWpm += s.wpm;
      studentMap[s.name].totalComp += s.compScore;
    });
    
    return Object.values(studentMap).map(st => ({
      ...st,
      avgWpm: Math.round(st.totalWpm / st.readings.length),
      avgComp: (st.totalComp / st.readings.length).toFixed(1),
      lastReading: st.readings[0] 
    }));
  };

  const renderTeacherDashboard = () => {
    const progressData = getStudentProgressData();

    return (
      <div className="max-w-6xl mx-auto bg-white/95 rounded-[3rem] shadow-2xl border-8 border-emerald-200 animate-fade-in mt-12 overflow-hidden min-h-[600px]">
        <div className="bg-emerald-500 p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-sm"><BarChart3 className="w-10 h-10" /></div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black">Öğretmen Paneli</h2>
              <p className="text-emerald-100 mt-2 font-bold text-lg">1/A Sınıfı Canlı Veri Akışı</p>
            </div>
          </div>
          <button onClick={() => setView('student-setup')} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-4 rounded-full font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2 border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 shadow-lg">
            <ArrowLeft className="w-5 h-5" /> Öğrenci Ekranına Dön
          </button>
        </div>

        <div className="flex flex-wrap border-b-4 border-emerald-100 bg-emerald-50">
          {['students', 'progress', 'stats', 'homework', 'settings'].map(tab => (
            <button key={tab} onClick={() => setTeacherTab(tab)} className={`flex-1 py-4 px-2 font-black capitalize transition-all text-sm sm:text-base md:text-lg ${teacherTab === tab ? 'bg-white text-emerald-700 border-b-8 border-emerald-500' : 'text-emerald-600/70 hover:bg-emerald-100/50'}`}>
              {tab === 'students' ? 'Öğrenciler' : tab === 'progress' ? 'Gelişim Takibi' : tab === 'stats' ? 'Son İşlemler' : tab === 'homework' ? 'Ödev Gönder' : 'Ayarlar'}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-10 overflow-x-auto min-h-[500px]">
          
          {teacherTab === 'students' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <h3 className="text-3xl font-black text-emerald-800 mb-8 flex items-center gap-3">
                <Users className="text-emerald-500 w-8 h-8" /> Sınıf Yönetimi
              </h3>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-emerald-100 shadow-sm mb-8">
                 <h4 className="font-black text-xl text-emerald-700 mb-4">Yeni Öğrenci Ekle</h4>
                 <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Öğrenci Adı Soyadı" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400 font-bold" />
                    <input type="text" placeholder="Şifre" value={newStudentPassword} onChange={e=>setNewStudentPassword(e.target.value)} className="w-full md:w-32 p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400 font-bold text-center" />
                    <button onClick={handleAddStudent} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl transition-colors">Ekle</button>
                 </div>
                 {teacherMsg && <p className="text-emerald-600 font-bold mt-4 animate-fade-in">{teacherMsg}</p>}
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-emerald-100 shadow-sm">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h4 className="font-black text-xl text-emerald-700">Sınıf Listesi ({students.length} Öğrenci)</h4>
                    {students.length === 0 && (
                      <button onClick={handleLoadDefaultClass} className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-6 py-3 rounded-full font-bold transition-colors">
                        1/A Varsayılan Listesini Yükle
                      </button>
                    )}
                 </div>
                 
                 <div className="space-y-4">
                    {students.map(s => (
                       <div key={s.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-100 gap-4 hover:border-emerald-300 transition-colors">
                          <span className="font-bold text-lg text-emerald-900 flex-1 w-full text-center md:text-left">{s.name}</span>
                          <div className="flex items-center gap-2 w-full md:w-auto">
                             <input 
                               type="text" 
                               value={editingPasswords[s.id] !== undefined ? editingPasswords[s.id] : s.password} 
                               onChange={(e) => setEditingPasswords({...editingPasswords, [s.id]: e.target.value})}
                               className="p-3 rounded-lg border-2 border-emerald-200 font-bold text-center w-24 md:w-32 focus:outline-none focus:border-emerald-400 flex-1 md:flex-none"
                             />
                             <button onClick={() => handleUpdatePassword(s.id, editingPasswords[s.id] !== undefined ? editingPasswords[s.id] : s.password)} className="bg-sky-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-sky-600 transition-colors">Kaydet</button>
                             <button onClick={() => handleDeleteStudent(s.id, s.name)} className="bg-rose-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors">Sil</button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {teacherTab === 'progress' && (
            <div className="animate-fade-in">
              {!selectedStudentForProgress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {progressData.length === 0 && <div className="col-span-full text-center py-10 text-emerald-600/50 text-xl font-bold">Henüz öğrenci kaydı yok.</div>}
                  {progressData.map(st => (
                    <div key={st.name} onClick={() => setSelectedStudentForProgress(st)} className="bg-white border-4 border-emerald-100 rounded-[2rem] p-6 hover:border-emerald-300 hover:shadow-lg cursor-pointer transition-all active:scale-95 group">
                      <div className="flex items-center gap-4 mb-4 border-b-2 border-emerald-50 pb-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl overflow-hidden shadow-sm">
                          {st.avatar?.startsWith('data:image') ? <img src={st.avatar} alt="ava" className="w-full h-full object-cover"/> : st.avatar}
                        </div>
                        <div>
                          <h3 className="font-black text-2xl text-emerald-800 group-hover:text-emerald-600">{st.name}</h3>
                          <p className="text-slate-500 font-medium">{st.readings.length} Okuma</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold text-slate-700 mb-2">
                        <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500"/> Ort. Hız:</span>
                        <span className="text-emerald-600">{st.avgWpm} wpm</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold text-slate-700">
                        <span className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500"/> Ort. Doğru:</span>
                        <span className="text-amber-600">{st.avgComp} / 2</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <button onClick={() => setSelectedStudentForProgress(null)} className="mb-6 font-bold text-emerald-600 flex items-center gap-2 hover:text-emerald-800">
                    <ArrowLeft className="w-5 h-5"/> Listeye Dön
                  </button>
                  <div className="bg-emerald-50 p-8 rounded-[2rem] border-4 border-emerald-200 mb-8 flex flex-col md:flex-row items-center gap-8">
                     <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-6xl shadow-xl border-8 border-emerald-100 overflow-hidden">
                        {selectedStudentForProgress.avatar?.startsWith('data:image') ? <img src={selectedStudentForProgress.avatar} alt="ava" className="w-full h-full object-cover"/> : selectedStudentForProgress.avatar}
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl font-black text-emerald-800 mb-4">{selectedStudentForProgress.name} Öğrenme Karnesi</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                           <span className="bg-white px-5 py-3 rounded-2xl font-bold text-emerald-700 shadow-sm border-2 border-emerald-100">Ort. Hız: {selectedStudentForProgress.avgWpm}</span>
                           <span className="bg-white px-5 py-3 rounded-2xl font-bold text-amber-700 shadow-sm border-2 border-amber-100">Ort. Doğru: {selectedStudentForProgress.avgComp}/2</span>
                           <span className="bg-white px-5 py-3 rounded-2xl font-bold text-sky-700 shadow-sm border-2 border-sky-100">Toplam Okuma: {selectedStudentForProgress.readings.length}</span>
                        </div>
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 mb-6">Geçmiş Okumalar ve Yapay Zeka Geri Bildirimleri</h3>
                  <div className="space-y-6">
                    {selectedStudentForProgress.readings.map((r, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border-4 border-slate-100 shadow-sm">
                         <div className="flex flex-col md:flex-row justify-between mb-4 border-b-2 border-slate-50 pb-4">
                           <div>
                             <span className="font-bold text-slate-400 text-sm">{r.date}</span>
                             <h4 className="font-black text-xl text-indigo-700 capitalize mt-1">{r.interest} <span className="text-sm font-bold text-sky-500 ml-2">Seviye {r.level}</span></h4>
                           </div>
                           <div className="flex gap-4 mt-2 md:mt-0 font-bold text-lg">
                             <span className="text-amber-600">{r.wpm} wpm</span>
                             <span className="text-emerald-600">{r.compScore} Doğru</span>
                           </div>
                         </div>
                         {r.aiEvaluation && (
                           <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 mt-4">
                             <p className="italic font-bold text-indigo-800 mb-4">"{r.aiEvaluation.geribildirim}"</p>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center"><div className="text-sm font-bold text-indigo-600 mb-1">Telaffuz</div><div className="flex justify-center gap-0.5">{renderStars(r.aiEvaluation.telaffuz)}</div></div>
                                <div className="text-center"><div className="text-sm font-bold text-indigo-600 mb-1">Akıcılık</div><div className="flex justify-center gap-0.5">{renderStars(r.aiEvaluation.akicilik)}</div></div>
                                <div className="text-center"><div className="text-sm font-bold text-indigo-600 mb-1">Anlama</div><div className="flex justify-center gap-0.5">{renderStars(r.aiEvaluation.anlama)}</div></div>
                                <div className="text-center"><div className="text-sm font-bold text-indigo-600 mb-1">Hız</div><div className="flex justify-center gap-0.5">{renderStars(r.aiEvaluation.okuma_hizi)}</div></div>
                             </div>
                           </div>
                         )}
                         {r.audioUrl && (
                           <div className="mt-4 pt-4 border-t-2 border-slate-50">
                             <span className="text-sm font-bold text-slate-500 mb-2 block">🎙️ Ses Kaydı:</span>
                             <audio src={r.audioUrl} controls className="h-10 w-full md:w-1/2 rounded-full" />
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {teacherTab === 'stats' && (
            <div className="animate-fade-in">
              <h3 className="text-3xl font-black text-emerald-800 mb-8 flex items-center gap-3">
                <BarChart3 className="text-emerald-500 w-8 h-8" /> Son Okumalar
              </h3>
              {stats.length === 0 ? (
                <div className="text-center py-20 text-emerald-600/50">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6" />
                  <p className="text-xl font-bold">Veriler Bekleniyor... Öğrenciler okudukça buraya düşecek.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border-4 border-emerald-100 overflow-hidden shadow-inner">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-800 font-black text-lg border-b-4 border-emerald-100">
                        <th className="p-5">Tarih</th>
                        <th className="p-5">Öğrenci Adı</th>
                        <th className="p-5">Konu</th>
                        <th className="p-5 text-center">Seviye</th>
                        <th className="p-5 text-center">Doğru</th>
                        <th className="p-5 text-center text-amber-600">Dakikada Kelime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((row) => (
                        <tr key={row.id} className="border-b-2 border-emerald-50 hover:bg-emerald-50/50 transition-colors font-bold text-slate-700">
                          <td className="p-5 text-slate-500 font-medium">{row.date}</td>
                          <td className="p-5 text-emerald-700 flex items-center gap-3 text-xl">
                            <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                              {row.avatar?.startsWith('data:image') ? <img src={row.avatar} className="w-full h-full object-cover"/> : row.avatar || <User className="w-5 h-5 text-emerald-600" />}
                            </div>
                            {row.name}
                          </td>
                          <td className="p-5 capitalize">{row.interest}</td>
                          <td className="p-5 text-center text-sky-600 text-xl">{row.level}</td>
                          <td className="p-5 text-center text-emerald-600 text-xl">{row.compScore} / 2</td>
                          <td className="p-5 text-center text-amber-600 text-2xl flex items-center justify-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-500" /> {row.wpm}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {teacherTab === 'homework' && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <h3 className="text-3xl font-black text-emerald-800 mb-8 flex items-center gap-3">
                <FileText className="text-emerald-500 w-8 h-8" /> Yeni Görev Oluştur
              </h3>
              <div className="bg-gradient-to-r from-sky-100 to-indigo-100 p-8 rounded-[2rem] border-4 border-white shadow-lg mb-10">
                <h4 className="font-black text-indigo-800 flex items-center gap-3 mb-4 text-2xl">
                  <Sparkles className="w-8 h-8 text-amber-500" /> Yapay Zeka Asistanı
                </h4>
                <p className="text-lg text-indigo-700 mb-6 font-medium">Siz konuyu yazın, dünyanın en iyi çocuk yazarı sizin için 1. sınıf seviyesinde harika bir hikaye ve sorular hazırlasın.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="flex-1 p-5 text-xl font-bold border-4 border-indigo-200 rounded-2xl focus:outline-none focus:border-indigo-400" placeholder="Örn: Güneş sistemi, Yardımlaşma..." />
                  <button onClick={handleGenerateAIHomework} disabled={isGeneratingHomework} className="bg-indigo-600 text-white font-black text-xl py-5 px-10 rounded-2xl border-b-[6px] border-indigo-800 active:border-b-0 active:translate-y-[6px] disabled:bg-indigo-400 disabled:border-indigo-500 disabled:translate-y-0 transition-all shadow-xl flex justify-center items-center gap-3">
                    {isGeneratingHomework ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    {isGeneratingHomework ? 'YAZILIYOR...' : 'ÜRET ✨'}
                  </button>
                </div>
              </div>
              <div className="space-y-8 bg-emerald-50/50 p-8 rounded-[2rem] border-4 border-emerald-100">
                <div>
                  <label className="block font-black text-emerald-800 text-xl mb-4">📖 Okuma Metni</label>
                  <textarea value={hwForm.text} onChange={e => setHwForm({...hwForm, text: e.target.value})} className="w-full p-6 text-lg font-medium border-4 border-emerald-200 rounded-[1.5rem] focus:outline-none focus:border-emerald-400 h-48 bg-white" placeholder="Öğrencilerin okumasını istediğiniz metni buraya yazın..." />
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border-4 border-sky-100 shadow-sm">
                  <label className="block font-black text-sky-800 text-xl mb-4 flex items-center gap-2"><span className="bg-sky-200 text-sky-700 w-8 h-8 rounded-full flex items-center justify-center">1</span> Soru 1</label>
                  <input value={hwForm.q1} onChange={e => setHwForm({...hwForm, q1: e.target.value})} className="w-full p-4 text-lg font-bold mb-4 border-4 border-slate-100 rounded-xl focus:border-sky-300 outline-none" placeholder="1. Soruyu yazın..." />
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input value={hwForm.q1o1} onChange={e => setHwForm({...hwForm, q1o1: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-sky-300 outline-none" placeholder="A Şıkkı" />
                    <input value={hwForm.q1o2} onChange={e => setHwForm({...hwForm, q1o2: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-sky-300 outline-none" placeholder="B Şıkkı" />
                    <input value={hwForm.q1o3} onChange={e => setHwForm({...hwForm, q1o3: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-sky-300 outline-none" placeholder="C Şıkkı" />
                  </div>
                  <div className="flex items-center gap-4 text-lg font-black text-slate-700 bg-slate-50 p-4 rounded-xl">
                    Doğru Cevap: <select value={hwForm.q1c} onChange={e => setHwForm({...hwForm, q1c: Number(e.target.value)})} className="p-2 border-4 border-slate-200 rounded-xl font-bold bg-white outline-none cursor-pointer"><option value={0}>A Şıkkı</option><option value={1}>B Şıkkı</option><option value={2}>C Şıkkı</option></select>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border-4 border-amber-100 shadow-sm">
                  <label className="block font-black text-amber-800 text-xl mb-4 flex items-center gap-2"><span className="bg-amber-200 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center">2</span> Soru 2</label>
                  <input value={hwForm.q2} onChange={e => setHwForm({...hwForm, q2: e.target.value})} className="w-full p-4 text-lg font-bold mb-4 border-4 border-slate-100 rounded-xl focus:border-amber-300 outline-none" placeholder="2. Soruyu yazın..." />
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input value={hwForm.q2o1} onChange={e => setHwForm({...hwForm, q2o1: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-amber-300 outline-none" placeholder="A Şıkkı" />
                    <input value={hwForm.q2o2} onChange={e => setHwForm({...hwForm, q2o2: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-amber-300 outline-none" placeholder="B Şıkkı" />
                    <input value={hwForm.q2o3} onChange={e => setHwForm({...hwForm, q2o3: e.target.value})} className="flex-1 p-4 font-bold border-4 border-slate-100 rounded-xl focus:border-amber-300 outline-none" placeholder="C Şıkkı" />
                  </div>
                  <div className="flex items-center gap-4 text-lg font-black text-slate-700 bg-slate-50 p-4 rounded-xl">
                    Doğru Cevap: <select value={hwForm.q2c} onChange={e => setHwForm({...hwForm, q2c: Number(e.target.value)})} className="p-2 border-4 border-slate-200 rounded-xl font-bold bg-white outline-none cursor-pointer"><option value={0}>A Şıkkı</option><option value={1}>B Şıkkı</option><option value={2}>C Şıkkı</option></select>
                  </div>
                </div>
                {teacherMsg && <div className="text-emerald-700 font-bold text-center mb-4">{teacherMsg}</div>}
                <button onClick={handlePublishHomework} className="w-full py-6 bg-emerald-500 text-white font-black text-2xl rounded-[2rem] border-b-[8px] border-emerald-700 active:border-b-0 active:translate-y-[8px] transition-all shadow-xl flex justify-center items-center gap-3 mt-4">
                  <Send className="w-8 h-8" /> ÖDEVİ SINIFLA PAYLAŞ 🚀
                </button>
              </div>
            </div>
          )}

          {teacherTab === 'settings' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <h3 className="text-3xl font-black text-emerald-800 mb-8 flex items-center gap-3">
                <Settings className="text-emerald-500 w-8 h-8" /> Öğretmen Ayarları
              </h3>
              
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border-4 border-emerald-100 shadow-sm mb-8">
                 <h4 className="font-black text-xl text-emerald-700 mb-4">Öğretmen Paneli Şifresini Değiştir</h4>
                 <p className="text-emerald-600 mb-6 font-medium">Öğretmen paneline öğrenci veya izinsiz girişleri engellemek için varsayılan şifreyi değiştirebilirsiniz.</p>
                 <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Yeni Şifre (Örn: 9876)" value={newTeacherPasswordInput} onChange={e=>setNewTeacherPasswordInput(e.target.value)} className="flex-1 p-4 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400 font-bold" />
                    <button onClick={handleUpdateTeacherPassword} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl transition-colors">Şifreyi Güncelle</button>
                 </div>
                 {teacherMsg && <p className="text-emerald-600 font-bold mt-4 animate-fade-in">{teacherMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans flex flex-col relative overflow-x-hidden pt-8 pb-12">
      {!['teacher-login', 'teacher'].includes(view) && (
        <button onClick={() => setShowProfileModal(true)} className="absolute top-4 left-4 flex items-center gap-3 bg-white/95 p-2 pr-6 rounded-full shadow-xl border-4 border-white z-50 transition-transform active:scale-95">
           <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-sky-100 border-2 border-sky-300 text-2xl">
             {savedProfile?.avatar?.startsWith('data:image') ? <img src={savedProfile.avatar} className="w-full h-full object-cover"/> : (savedProfile?.avatar || studentAvatar)}
           </div>
           <span className="font-black text-sky-800 text-xl tracking-tight">{savedProfile ? savedProfile.studentName.split(' ')[0] : 'Giriş'}</span>
        </button>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-[2rem] p-8 max-w-md w-full relative border-8 border-sky-300 max-h-[90vh] overflow-y-auto shadow-2xl">
             <button onClick={()=>setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
             <h3 className="text-2xl font-black text-sky-800 mb-6 text-center">Profil Ayarları</h3>
             <div className="flex flex-wrap justify-center gap-3 mb-8">
                {PREDEFINED_AVATARS.map(ava => (
                  <button key={ava} onClick={() => handleAvatarChange(ava)} className={`w-14 h-14 text-2xl rounded-full border-4 transition-all ${studentAvatar === ava ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md scale-110' : 'border-slate-100 bg-white hover:border-sky-300'}`}>{ava}</button>
                ))}
             </div>
             <div className="border-t pt-6 text-center">
                {savedProfile && <button onClick={()=>{clearProfile(); setShowProfileModal(false)}} className="text-rose-500 font-black underline hover:text-rose-700">Oturumu Kapat</button>}
             </div>
           </div>
        </div>
      )}

      <div className="flex-1 w-full px-4">
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="max-w-xl mx-auto bg-white/95 p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-8 border-sky-300 animate-fade-in mt-20 relative">
             <button onClick={()=>setView('teacher-login')} className="absolute top-4 right-4 w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform hover:brightness-110"><BarChart3 /></button>
             <div className="text-center mb-8">
               <h2 className="text-3xl sm:text-4xl font-black text-sky-600 mb-2">1/A Sınıf Asistanı</h2>
               <p className="text-sky-800/70 font-bold">Öğrenme Macerasına Hoş Geldin!</p>
             </div>
             <div className="space-y-6">
                <div className="bg-sky-50 p-5 sm:p-6 rounded-2xl border-4 border-sky-100">
                   <div className="mb-4 text-left">
                      <label className="block text-lg font-black text-sky-800 mb-2">Ad Soyad</label>
                      <select value={studentName} onChange={e=>{setStudentName(e.target.value); setLoginError('')}} className="w-full p-4 border-4 border-sky-200 rounded-xl font-bold bg-white outline-none focus:border-fuchsia-400 appearance-none cursor-pointer">
                         <option value="">İsmini Seç...</option>
                         {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className="text-left">
                      <label className="block text-lg font-black text-sky-800 mb-2">Şifre</label>
                      <input type="password" value={studentPassword} onChange={e=>{setStudentPassword(e.target.value); setLoginError('')}} className="w-full p-4 border-4 border-sky-200 rounded-xl text-center text-2xl tracking-[0.8em] sm:tracking-[1em] bg-white outline-none focus:border-fuchsia-400 font-bold" placeholder="••••" maxLength={4} />
                   </div>
                   {loginError && <p className="text-rose-500 font-bold text-center mt-3 animate-bounce">{loginError}</p>}
                </div>

                {activeHomework && (
                  <div className="p-4 sm:p-6 bg-amber-300 rounded-2xl sm:rounded-[2rem] border-b-[4px] sm:border-b-[8px] border-amber-500 relative overflow-hidden shadow-xl">
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-900 mb-1 sm:mb-2 relative z-10">📚 Yeni Ödevin Var!</h3>
                    <p className="text-amber-800 font-bold text-sm sm:text-lg mb-4 relative z-10">Öğretmeninin gönderdiği görevi yap.</p>
                    <button onClick={handleStartHomework} className="w-full bg-white text-amber-600 text-xl font-black py-3 rounded-xl shadow-lg hover:scale-105 transition-all">GÖREVİ BAŞLAT 🚀</button>
                  </div>
                )}

                <div className="bg-sky-50 p-5 sm:p-6 rounded-2xl border-4 border-sky-100">
                   <label className="block text-lg font-black text-sky-800 mb-4">Ne Okumak İstersin?</label>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {PREDEFINED_TOPICS.map(t => (
                        <button key={t} onClick={() => setSelectedTopics(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-b-4 font-bold text-sm sm:text-base transition-all ${selectedTopics.includes(t) ? 'bg-fuchsia-500 text-white border-fuchsia-700 scale-105 shadow-md' : 'bg-white border-sky-300 hover:bg-sky-50'}`}>{t}</button>
                      ))}
                   </div>
                   <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="w-full text-base sm:text-xl p-3 sm:p-4 border-2 sm:border-4 border-sky-200 rounded-xl sm:rounded-2xl focus:border-fuchsia-400 bg-white focus:outline-none text-sky-800 font-bold placeholder:font-normal placeholder:text-sky-300 mb-4" placeholder="Veya başka bir şey yaz..." />
                   
                   <label className="block text-lg font-black text-sky-800 mb-2 mt-2">Okuma Seviyesi</label>
                   <div className="flex gap-2">
                      {[{id: '1', label: 'Kolay 🐢'}, {id: '2', label: 'Orta 🐇'}, {id: '3', label: 'Zor 🐆'}].map(lvl => (
                        <button key={lvl.id} onClick={() => setLevel(lvl.id)} className={`flex-1 py-3 rounded-xl border-b-4 font-black transition-all ${level === lvl.id ? 'bg-amber-400 text-amber-900 border-amber-600 scale-105 shadow-md' : 'bg-white border-sky-200 hover:bg-sky-50'}`}>{lvl.label}</button>
                      ))}
                   </div>
                </div>

                <div onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 sm:border-4 border-sky-100 cursor-pointer">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border-2 sm:border-4 transition-colors ${rememberMe ? 'bg-fuchsia-500 border-fuchsia-500' : 'bg-white border-sky-300'}`}>
                    {rememberMe && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                  </div>
                  <div>
                    <label className="text-sky-800 font-black block text-sm sm:text-base cursor-pointer">Beni bu telefonda hatırla</label>
                    <p className="text-sky-600 font-medium text-xs sm:text-sm">Avatarını seçmek için işaretle!</p>
                  </div>
                </div>

                <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-5 sm:py-6 rounded-2xl text-2xl font-black border-b-8 border-sky-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl hover:brightness-110">HİKAYEMİ OLUŞTUR ✨</button>
             </div>
          </div>
        )}

        {isGeneratingStory && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl border-8 border-sky-300 text-center flex flex-col items-center justify-center min-h-[400px] mt-20 animate-fade-in">
             <Loader2 className="w-20 h-20 text-sky-500 animate-spin mb-6" />
             <h2 className="text-2xl sm:text-3xl font-black text-sky-600 mb-2">Metin Yazılıyor...</h2>
             <p className="text-sky-800 font-bold">Senin için <strong>{interest || selectedTopics.join(', ') || customTopic}</strong> hakkında yepyeni bir macera yazıyoruz! Lütfen bekle...</p>
          </div>
        )}

        {view === 'reading-ready' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-8 sm:p-12 rounded-[3rem] shadow-2xl border-8 border-amber-300 mt-20 text-center animate-fade-in">
             <div className="text-6xl sm:text-7xl mb-6">✨</div>
             <h2 className="text-3xl sm:text-4xl font-black text-amber-600 mb-4 text-center">Hazır mısın?</h2>
             <p className="text-lg sm:text-xl text-amber-900 font-bold mb-8 leading-relaxed text-center">Senin için <strong className="text-sky-600">{interest}</strong> hakkında çok tatlı bir metin hazırladım.</p>
             
             {micError && (
               <div className="bg-rose-100 border-4 border-rose-300 text-rose-700 p-4 rounded-2xl font-bold mb-6 animate-pulse text-sm sm:text-lg shadow-sm">
                 🎙️ {micError}
               </div>
             )}

             <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => beginTimer(false)} className="flex-1 bg-sky-500 text-white py-4 sm:py-5 rounded-2xl text-xl font-black border-b-4 border-sky-700 active:scale-95 transition-transform shadow-lg">SESSİZ OKU 📖</button>
                <button onClick={() => beginTimer(true)} className="flex-1 bg-rose-500 text-white py-4 sm:py-5 rounded-2xl text-xl font-black border-b-4 border-rose-700 flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"><Mic className="w-6 h-6" /> SESLİ OKU</button>
             </div>
          </div>
        )}

        {view === 'reading-active' && (
          <div className="max-w-4xl mx-auto mt-12 space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
             <div className="bg-[#fdfbf7] p-6 sm:p-14 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-8 border-sky-200 relative">
                {isRecording && <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full font-black flex items-center gap-2 animate-pulse text-xs sm:text-base border-2 border-white shadow-md"><Mic className="w-4 h-4 sm:w-5 sm:h-5" /> KAYDEDİLİYOR...</div>}
                <p className="text-xl sm:text-4xl leading-[2.8rem] sm:leading-[4rem] font-bold text-slate-800 whitespace-pre-wrap">{storyData.text}</p>
             </div>
             {!isReadingFinished && <div className="flex justify-center"><button onClick={finishReading} className="bg-emerald-500 text-white py-5 px-12 sm:py-6 sm:px-16 rounded-full text-3xl sm:text-4xl font-black shadow-[0_8px_0_0_#047857] active:shadow-none active:translate-y-2 transition-all hover:brightness-105">BİTİRDİM! 🎉</button></div>}
             {isReadingFinished && (
               <div className="bg-white p-6 sm:p-8 rounded-[2rem] border-8 border-fuchsia-300 space-y-8 sm:space-y-10 shadow-xl animate-fade-in">
                 <h2 className="text-2xl sm:text-3xl font-black text-fuchsia-600 text-center">Soruları Cevapla 🧠</h2>
                 {storyData.questions.map((q, idx) => (
                   <div key={q.id} className="bg-fuchsia-50 p-5 sm:p-6 rounded-2xl border-4 border-fuchsia-100 relative">
                     <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-fuchsia-400 text-white w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full font-black text-xl sm:text-2xl shadow-md border-2 border-white">{idx + 1}</div>
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg sm:text-2xl font-black text-fuchsia-900 mt-1 text-left">{q.q}</h3>
                       <button onClick={() => playAudio(q.q)} className="bg-sky-400 text-white p-3 rounded-full shadow-md"><Volume2 className="w-6 h-6"/></button>
                     </div>
                     <div className="flex flex-col gap-3">
                        {q.options.map((opt, optIdx) => (
                          <button key={optIdx} onClick={() => setAnswers({...answers, [q.id]: optIdx})} className={`p-4 rounded-xl font-bold text-base sm:text-lg border-b-4 transition-all leading-tight text-left active:translate-y-1 ${answers[q.id] === optIdx ? 'bg-emerald-500 text-white border-emerald-700 scale-102 shadow-md' : 'bg-white border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100'}`}>
                            {opt}
                          </button>
                        ))}
                     </div>
                   </div>
                 ))}
                 <button onClick={checkAnswers} disabled={Object.keys(answers).length < 2} className="w-full bg-sky-500 text-white py-5 sm:py-6 rounded-2xl text-2xl sm:text-3xl font-black border-b-8 border-sky-700 disabled:opacity-50 transition-all active:translate-y-1 hover:brightness-110 shadow-lg">KARNEMİ GÖSTER 🏆</button>
               </div>
             )}
          </div>
        )}

        {view === 'retry-prompt' && (
          <div className="max-w-xl mx-auto bg-white/95 p-6 sm:p-10 rounded-[2rem] shadow-2xl border-4 sm:border-8 border-amber-400 text-center animate-fade-in mt-16">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">🤔</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-700 mb-4 sm:mb-6">Küçük Bir Hata!</h2>
            <p className="text-lg sm:text-2xl text-amber-900 font-bold mb-6 sm:mb-10 leading-relaxed">Bazı soruları yanlış cevapladın. İstersen metni <strong>bir kez daha</strong> dikkatlice okuyup cevaplarını düzeltebilirsin!</p>
            <div className="flex flex-col gap-4 sm:gap-5">
              <button onClick={handleRetry} className="bg-amber-500 text-white text-xl sm:text-2xl font-black py-4 sm:py-6 rounded-2xl sm:rounded-[2rem] border-b-[4px] sm:border-b-[8px] border-amber-700 active:border-b-0 active:translate-y-[4px] transition-all shadow-xl">EVET, TEKRAR OKUYAYIM 📖</button>
              <button onClick={calculateFinalResult} className="bg-slate-200 text-slate-600 hover:text-slate-800 text-lg sm:text-xl font-black py-3 sm:py-5 rounded-2xl sm:rounded-[2rem] border-b-[4px] sm:border-b-[6px] border-slate-300 active:border-b-0 active:translate-y-[4px] transition-all">HAYIR, KARNEMİ GÖSTER</button>
            </div>
          </div>
        )}

        {view === 'evaluating' && (
          <div className="max-w-md mx-auto bg-white/95 p-12 rounded-[3rem] shadow-2xl border-8 border-indigo-300 text-center flex flex-col items-center justify-center min-h-[400px] mt-20 animate-fade-in">
             <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
             <h2 className="text-2xl font-black text-indigo-600">Öğretmen Değerlendiriyor...</h2>
             <p className="font-bold text-indigo-800 mt-2">Okumanı dinliyorum, harika iş çıkardın!</p>
          </div>
        )}

        {view === 'result' && (
          <div className="max-w-2xl mx-auto bg-white/95 p-8 sm:p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 mt-12 animate-fade-in text-center space-y-6 sm:space-y-8">
             <div className="relative inline-block">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-sky-100 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-inner border-4 border-sky-200 overflow-hidden">
                    {readingResult.avatar?.startsWith('data:image') ? <img src={readingResult.avatar} className="w-full h-full object-cover"/> : readingResult.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white px-3 py-1 rounded-full font-black flex items-center gap-1 text-sm sm:text-base shadow-md border-2 border-white animate-bounce"><Flame className="w-4 h-4 sm:w-5 sm:h-5" /> {readingResult.streakAchieved}</div>
             </div>
             <div>
                <h2 className="text-3xl sm:text-4xl font-black text-sky-600">Tebrikler {readingResult.name.split(' ')[0]}!</h2>
                <p className="text-lg sm:text-xl font-bold text-slate-600 mt-2 text-center">Yapay Zeka Karnen Hazır 🏆</p>
             </div>
             <div className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-5 sm:p-6 rounded-2xl border-4 border-indigo-100 italic font-bold text-indigo-900 text-base sm:text-lg leading-relaxed shadow-inner">"{readingResult.aiEvaluation.geribildirim}"</div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-2 border-slate-50"><span className="font-bold text-slate-500">Okuma Hızı</span><span className="text-amber-500 font-black text-xl">{readingResult.wpm} wpm</span></div>
                <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-2 border-slate-50"><span className="font-bold text-slate-500">Doğru Cevap</span><span className="text-emerald-500 font-black text-xl">{readingResult.compScore}/2</span></div>
             </div>
             <button onClick={()=>{resetStudent(); setView('student-setup')}} className="w-full bg-sky-500 text-white py-5 rounded-2xl text-xl sm:text-2xl font-black border-b-8 border-sky-700 shadow-lg active:scale-98 transition-transform hover:brightness-110">YENİDEN OYNA 🎮</button>
          </div>
        )}

        {view === 'teacher-login' && (
           <div className="max-w-md mx-auto bg-white/95 p-8 sm:p-10 rounded-[2rem] shadow-2xl border-8 border-emerald-200 mt-20 animate-fade-in">
              <h2 className="text-3xl font-black text-emerald-600 text-center mb-8">Öğretmen Girişi</h2>
              <form onSubmit={handleTeacherLogin} className="space-y-6 text-center">
                 <label className="block text-emerald-800 font-bold mb-2">Yönetici Şifresi</label>
                 <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} className="w-full p-4 border-4 border-emerald-100 rounded-xl text-center text-4xl tracking-[0.8em] sm:tracking-[1em] focus:border-emerald-400 outline-none font-bold bg-white" placeholder="••••" maxLength={4} />
                 {passwordError && <p className="text-rose-500 font-bold animate-pulse">Hatalı Şifre!</p>}
                 <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-xl text-2xl font-black border-b-6 border-emerald-700 active:translate-y-1 shadow-lg mt-4 transition-all hover:brightness-105">GİRİŞ YAP 🚀</button>
                 <button type="button" onClick={()=>setView('student-setup')} className="text-slate-400 font-bold mt-4 hover:text-slate-600 transition-colors">Geri Dön</button>
              </form>
           </div>
        )}

        {view === 'teacher' && renderTeacherDashboard()}
      </div>
    </div>
  );
}
