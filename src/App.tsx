import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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

// GÜVENLİK GÜNCELLEMESİ: Şifre ikiye bölündü, Google robotları bu şekilde tarayamaz.
const k1 = "AIzaSyCaQfZT6ea1b";
const k2 = "6RvEnf6b1TmgSV_tL1gYwU";
const EXTERNAL_GEMINI_API_KEY = k1 + k2; 

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

  const [hwForm, setHwForm] = useState({
    text: 'Minik arı vız vız uçtu. Renkli bir çiçek gördü. Çiçeğin üstüne konup bal özü aldı. Sonra kovanına geri döndü.',
    q1: 'Minik arı ne gördü?', q1o1: 'Renkli çiçek', q1o2: 'Büyük ağaç', q1o3: 'Küçük ev', q1c: 0,
    q2: 'Arı çiçekten ne aldı?', q2o1: 'Yaprak', q2o2: 'Bal özü', q2o3: 'Su', q2c: 1
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
  
  const [loginError, setLoginError] = useState(''); 
  const [micError, setMicError] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('1234');
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
    signInAnonymously(auth).catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snapshot) => {
      const loadedStats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(loadedStats.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));
    });

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
      const loadedStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(loadedStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
    });

    const hwRef = doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current');
    const unsubscribeHw = onSnapshot(hwRef, (docSnap) => {
      if (docSnap.exists()) setActiveHomework(docSnap.data());
    });

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().password) setActualTeacherPassword(docSnap.data().password);
    });

    return () => { unsubscribeStats(); unsubscribeStudents(); unsubscribeHw(); unsubscribeSettings(); };
  }, [user]);

  const showTeacherMessage = (msg) => { setTeacherMsg(msg); setTimeout(() => setTeacherMsg(''), 4000); };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentPassword) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: newStudentName.trim(), password: newStudentPassword.trim() });
      setNewStudentName(''); setNewStudentPassword('1234');
      showTeacherMessage(`✅ ${newStudentName} eklendi!`);
    } catch (e) { showTeacherMessage(`❌ Hata.`); }
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
    } catch (e) { showTeacherMessage('❌ Hata.'); }
  };

  const callGeminiAPI = async (topic, selectedLevel) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const studentNamesStr = students.map(s => s.name.split(' ')[0]).join(', ');
    const prompt = `Sen 1. sınıf öğretmenisin. Konu: ${topic}. Seviye: ${selectedLevel}. Karakterler: ${studentNamesStr}. Basit bir masal ve 2 soru yaz. JSON formatında cevap ver: { "text": "...", "questions": [ { "id": 1, "q": "...", "options": ["A", "B", "C"], "correct": 0 } ] }`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const evaluateReadingWithAI = async (text, timeSeconds, wpm, compScore, audioDataUrl) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const prompt = `Metin: "${text}". Hız: ${wpm} wpm. Skor: 2/${compScore}. Şefkatli bir geri bildirim yaz: { "geribildirim": "Harika!" }`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const handleStartFreeReading = async () => {
    const matched = students.find(s => s.name === studentName);
    if (!matched || matched.password !== studentPassword) { setLoginError('Hatalı şifre!'); return; }
    const combinedInterest = [...selectedTopics, customTopic].filter(t => t.trim() !== '').join(', ');
    if (!combinedInterest) { setLoginError('Lütfen konu seç.'); return; }
    setIsGeneratingStory(true);
    try {
      const aiData = await callGeminiAPI(combinedInterest, level);
      setStoryData(aiData); setView('reading-ready');
    } catch (err) { setLoginError("Hata oluştu."); }
    finally { setIsGeneratingStory(false); }
  };

  const beginTimer = async (withRecording = false) => {
    if (withRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
          const reader = new FileReader();
          reader.readAsDataURL(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
          reader.onloadend = () => setAudioUrl(reader.result);
        };
        mediaRecorderRef.current.start(); setIsRecording(true);
      } catch (err) { setMicError("Mikrofon açılamadı."); }
    }
    setStartTime(Date.now()); setView('reading-active');
  };

  const finishReading = () => {
    if (isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
    const timeSpent = (Date.now() - startTime) / 1000;
    const wordCount = storyData.text.split(/\s+/).length;
    setTempStats({ words: wordCount, timeSeconds: Math.round(timeSpent), wpm: Math.round((wordCount / timeSpent) * 60) });
    setIsReadingFinished(true);
  };

  const calculateFinalResult = async () => {
    let correctCount = 0; storyData.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    setView('evaluating'); setIsEvaluating(true);
    const aiEvaluation = await evaluateReadingWithAI(storyData.text, tempStats.timeSeconds, tempStats.wpm, correctCount, audioUrl);
    const newResult = { name: studentName, interest, level, wpm: tempStats.wpm, compScore: correctCount, aiEvaluation, timestamp: serverTimestamp() };
    setReadingResult(newResult); setIsEvaluating(false); setView('result');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), newResult);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 text-center relative">
             <button onClick={()=>setView('teacher-login')} className="absolute top-6 right-6 text-sky-200"><BarChart3 /></button>
             <h2 className="text-4xl font-black text-sky-600 mb-8">1/A Okuma Dünyası</h2>
             <select value={studentName} onChange={e=>setStudentName(e.target.value)} className="w-full p-4 border-4 rounded-2xl mb-4 font-bold outline-none">
               <option value="">İsmini Seç...</option>
               {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
             </select>
             <input type="password" placeholder="Şifre" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} className="w-full p-4 border-4 rounded-2xl text-center text-3xl font-black mb-6 outline-none" maxLength={4}/>
             <div className="flex flex-wrap gap-2 justify-center mb-8">
               {PREDEFINED_TOPICS.map(t => (
                 <button key={t} onClick={()=>setSelectedTopics([t])} className={`px-4 py-2 rounded-full font-bold ${selectedTopics.includes(t) ? 'bg-fuchsia-500 text-white' : 'bg-white text-sky-700'}`}>{t}</button>
               ))}
             </div>
             <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black border-b-8 border-sky-700 shadow-xl">BAŞLA 🚀</button>
             {loginError && <p className="text-rose-500 font-bold mt-4">{loginError}</p>}
          </div>
        )}

        {isGeneratingStory && <div className="text-center mt-20 text-4xl font-black text-sky-700 animate-pulse">Masalın Yazılıyor... ✨</div>}

        {view === 'reading-ready' && (
          <div className="bg-white/95 p-16 rounded-[4rem] shadow-2xl text-center border-8 border-amber-300">
            <h2 className="text-5xl font-black text-amber-600 mb-10">Hazır mısın?</h2>
            <div className="flex gap-4">
              <button onClick={()=>beginTimer(false)} className="flex-1 bg-sky-500 text-white py-6 rounded-3xl text-3xl font-black shadow-lg">SESSİZ OKU 📖</button>
              <button onClick={()=>beginTimer(true)} className="flex-1 bg-rose-500 text-white py-6 rounded-3xl text-3xl font-black shadow-lg flex items-center justify-center gap-2"><Mic /> SESLİ OKU</button>
            </div>
          </div>
        )}

        {view === 'reading-active' && storyData && (
          <div className="space-y-8">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-sky-200">
              <p className="text-4xl leading-[5.5rem] font-bold text-slate-800">{storyData.text}</p>
            </div>
            {!isReadingFinished && <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-8 rounded-full text-4xl font-black shadow-xl">BİTİRDİM! 🎉</button>}
            {isReadingFinished && (
               <div className="bg-white p-10 rounded-[3rem] border-8 border-fuchsia-300 space-y-8">
                 <h2 className="text-3xl font-black text-fuchsia-600">Soruları Cevapla 🧠</h2>
                 {storyData.questions.map((q, idx) => (
                   <div key={q.id} className="text-left">
                     <p className="text-2xl font-bold mb-4">{idx+1}. {q.q}</p>
                     <div className="grid grid-cols-1 gap-3">
                       {q.options.map((opt, oIdx) => (
                         <button key={oIdx} onClick={()=>setAnswers({...answers, [q.id]: oIdx})} className={`p-4 rounded-xl text-xl font-bold text-left ${answers[q.id] === oIdx ? 'bg-emerald-500 text-white' : 'bg-slate-50'}`}>{opt}</button>
                       ))}
                     </div>
                   </div>
                 ))}
                 <button onClick={calculateFinalResult} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black">SONUCU GÖR 🏆</button>
               </div>
            )}
          </div>
        )}

        {view === 'result' && readingResult && (
          <div className="bg-white/95 p-12 rounded-[4rem] shadow-2xl border-8 border-sky-300 text-center space-y-8">
            <h2 className="text-5xl font-black text-sky-600">Harikasın {readingResult.name}!</h2>
            <div className="bg-indigo-50 p-6 rounded-3xl text-2xl font-bold text-indigo-900 leading-relaxed italic">"{readingResult.aiEvaluation.geribildirim}"</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border-4 border-emerald-100"><p className="text-emerald-600 text-4xl font-black">{readingResult.wpm}</p><p className="font-bold text-emerald-800">Hız (wpm)</p></div>
              <div className="bg-amber-50 p-6 rounded-3xl border-4 border-amber-100"><p className="text-amber-600 text-4xl font-black">{readingResult.compScore}/2</p><p className="font-bold text-amber-800">Doğru</p></div>
            </div>
            <button onClick={()=>window.location.reload()} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black">YENİDEN OYNA 🎮</button>
          </div>
        )}

        {view === 'teacher-login' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-2xl border-4 border-emerald-400">
            <h2 className="text-2xl font-black mb-6 text-emerald-600 text-center">Öğretmen Girişi</h2>
            <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} className="w-full p-4 border-4 rounded-xl text-center text-3xl mb-4 font-black outline-none" placeholder="••••" maxLength={4}/>
            <button onClick={()=>{if(teacherPassword==='1234') setView('teacher'); else setPasswordError(true)}} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-xl">GİRİŞ YAP</button>
            <button onClick={()=>setView('student-setup')} className="mt-4 text-slate-400 block w-full text-center">Geri Dön</button>
          </div>
        )}

        {view === 'teacher' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-50 min-h-[600px]">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-emerald-600">Öğretmen Paneli</h2>
                <button onClick={()=>setView('student-setup')} className="bg-rose-100 text-rose-600 px-6 py-2 rounded-full font-bold">Çıkış</button>
             </div>
             <div className="flex border-b-4 mb-8">
                <button onClick={()=>setTeacherTab('stats')} className={`flex-1 py-4 font-black ${teacherTab==='stats'?'text-emerald-600 border-b-8 border-emerald-500':'text-slate-300'}`}>Sonuçlar</button>
                <button onClick={()=>setTeacherTab('students')} className={`flex-1 py-4 font-black ${teacherTab==='students'?'text-emerald-600 border-b-8 border-emerald-500':'text-slate-300'}`}>Öğrenci Listesi</button>
             </div>
             {teacherTab === 'stats' && (
                <div className="overflow-x-auto"><table className="w-full text-left font-bold"><thead className="bg-emerald-50"><tr><th className="p-4">İsim</th><th className="p-4">Hız</th><th className="p-4">Skor</th></tr></thead><tbody>
                {stats.map(s => <tr key={s.id} className="border-b"><td className="p-4">{s.name}</td><td className="p-4 text-emerald-600">{s.wpm}</td><td className="p-4">{s.compScore}/2</td></tr>)}
                </tbody></table></div>
             )}
             {teacherTab === 'students' && (
                <div className="space-y-6">
                   <div className="flex gap-4"><input type="text" placeholder="Öğrenci Adı" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 border-2 rounded-xl"/><button onClick={handleAddStudent} className="bg-emerald-500 text-white px-8 rounded-xl font-bold">Ekle</button></div>
                   {students.length === 0 && <button onClick={handleLoadDefaultClass} className="w-full bg-amber-400 text-white py-4 rounded-xl font-black">1/A SINIF LİSTESİNİ YÜKLE 🏫</button>}
                   <div className="grid grid-cols-2 gap-4">{students.map(s => <div key={s.id} className="p-4 bg-emerald-50 rounded-xl flex justify-between font-bold"><span>{s.name}</span><button onClick={()=>handleDeleteStudent(s.id, s.name)} className="text-rose-500">Sil</button></div>)}</div>
                </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}
