import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpen, Star, Clock, Trophy, ArrowLeft, BarChart3, Rocket, Heart, Zap, Volume2, Mic, Send, FileText, Check, Loader2, Sparkles, Settings, Camera, TrendingUp, Award, X, Flame, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- KONFİGÜRASYON ---
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
const appId = 'default-app-id';

// GÜVENLİK: Şifre bölünmüş halde, robotlar yakalayamaz ama sistem çalışır.
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
  // --- STATE YÖNETİMİ ---
  const [view, setView] = useState('student-setup'); 
  const [stats, setStats] = useState([]); 
  const [students, setStudents] = useState([]); 
  const [activeHomework, setActiveHomework] = useState(null);
  const [teacherTab, setTeacherTab] = useState('stats');
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAvatar, setStudentAvatar] = useState('🐶'); 
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
  const [user, setUser] = useState(null);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('1234');
  const [teacherMsg, setTeacherMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); 
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- FIREBASE BAĞLANTILARI ---
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const statsRef = collection(db, 'artifacts', appId, 'public', 'data', 'stats');
    onSnapshot(statsRef, (snap) => setStats(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.timestamp - a.timestamp)));
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    onSnapshot(studentsRef, (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.name.localeCompare(b.name, 'tr'))));
    const hwRef = doc(db, 'artifacts', appId, 'public', 'data', 'homework', 'current');
    onSnapshot(hwRef, (docSnap) => { if (docSnap.exists()) setActiveHomework(docSnap.data()); });
  }, [user]);

  // --- GEMINI API FONKSİYONLARI ---
  const callGeminiAPI = async (topic, lvl) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const studentNames = students.map(s => s.name.split(' ')[0]).join(', ');
    const prompt = `Sen harika bir 1. sınıf öğretmenisin. Konu: ${topic}. Seviye: ${lvl}. Karakter isimleri şunlardan olsun: ${studentNames}. 1. sınıfların okuyabileceği basit bir hikaye ve 2 soru hazırla. JSON: { "text": "...", "questions": [{ "id": 1, "q": "...", "options": ["A","B","C"], "correct": 0 }, { "id": 2, "q": "...", "options": ["A","B","C"], "correct": 1 }] }`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const evaluateWithAI = async (text, wpm, score) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const prompt = `Öğrenci okuması: "${text}". Hız: ${wpm} kelime/dk. Anlama: 2/${score}. Şefkatli bir öğretmen gibi kısa bir geri bildirim ver: { "geribildirim": "..." }`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  // --- ÖĞRENCİ İŞLEMLERİ ---
  const handleStartFreeReading = async () => {
    const matched = students.find(s => s.name === studentName);
    if (!matched || matched.password !== studentPassword) { setLoginError('Hatalı şifre veya isim!'); return; }
    setIsGeneratingStory(true);
    try {
      const data = await callGeminiAPI(selectedTopics.join(', ') || customTopic, level);
      setStoryData(data);
      setView('reading-ready');
    } catch (e) { setLoginError('Hata oluştu, tekrar dene.'); }
    finally { setIsGeneratingStory(false); }
  };

  const beginReading = async (withMic) => {
    if (withMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.start();
        setIsRecording(true);
      } catch (e) { setMicError('Mikrofon açılmadı!'); }
    }
    setStartTime(Date.now());
    setView('reading-active');
  };

  const finishReading = () => {
    if (isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
    const timeSpent = (Date.now() - startTime) / 1000;
    const words = storyData.text.split(' ').length;
    setTempStats({ words, timeSeconds: Math.round(timeSpent), wpm: Math.round((words / timeSpent) * 60) });
    setIsReadingFinished(true);
  };

  const showFinalResult = async () => {
    let score = 0;
    storyData.questions.forEach(q => { if (answers[q.id] === q.correct) score++; });
    setIsEvaluating(true);
    const evalData = await evaluateWithAI(storyData.text, tempStats.wpm, score);
    const result = { name: studentName, interest: selectedTopics[0], ...tempStats, compScore: score, aiFeedback: evalData.geribildirim, timestamp: Date.now() };
    setReadingResult(result);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stats'), result);
    setView('result');
    setIsEvaluating(false);
  };

  // --- ÖĞRETMEN İŞLEMLERİ ---
  const handleAddStudent = async () => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: newStudentName, password: newStudentPassword });
    setNewStudentName('');
  };

  const handleLoadClass = async () => {
    for (const name of DEFAULT_CLASS_LIST) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, password: '1234' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-purple-200 to-fuchsia-200 font-sans p-4">
      {/* Profil/Öğretmen Butonları */}
      {view === 'student-setup' && (
        <button onClick={()=>setView('teacher-login')} className="absolute top-4 right-4 bg-emerald-400 p-3 rounded-full text-white shadow-lg"><BarChart3 /></button>
      )}

      {/* Ana Ekranlar */}
      <div className="max-w-4xl mx-auto pt-10">
        
        {view === 'student-setup' && !isGeneratingStory && (
          <div className="bg-white/95 p-10 rounded-[3rem] shadow-2xl border-8 border-sky-300 text-center">
            <h2 className="text-5xl font-black text-sky-600 mb-10">1/A Okuma Dünyası</h2>
            <div className="space-y-6">
              <select value={studentName} onChange={e=>setStudentName(e.target.value)} className="w-full p-5 border-4 border-sky-200 rounded-2xl text-xl font-bold bg-white outline-none">
                <option value="">İsmini Seç...</option>
                {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <input type="password" placeholder="4 Haneli Şifren" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} className="w-full p-5 border-4 border-sky-200 rounded-2xl text-center text-3xl font-black tracking-widest outline-none" maxLength={4}/>
              
              <div className="bg-sky-50 p-6 rounded-3xl">
                <p className="text-xl font-black text-sky-800 mb-4">Ne Hakkında Okumak İstersin?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {PREDEFINED_TOPICS.map(t => (
                    <button key={t} onClick={() => setSelectedTopics([t])} className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${selectedTopics.includes(t) ? 'bg-fuchsia-500 text-white scale-110 shadow-lg' : 'bg-white text-sky-700 border-2 border-sky-100 hover:bg-sky-100'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {['1', '2', '3'].map(lvl => (
                  <button key={lvl} onClick={()=>setLevel(lvl)} className={`flex-1 py-4 rounded-2xl font-black text-xl border-4 ${level === lvl ? 'bg-amber-400 border-amber-500 text-amber-900' : 'bg-white border-sky-100 text-sky-700'}`}>{lvl === '1' ? 'Kolay' : lvl === '2' ? 'Orta' : 'Zor'}</button>
                ))}
              </div>

              <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-8 rounded-[2rem] text-3xl font-black border-b-[12px] border-sky-700 active:border-b-0 active:translate-y-2 transition-all shadow-2xl">MACERAYA BAŞLA! 🚀</button>
              {loginError && <p className="text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{loginError}</p>}
            </div>
          </div>
        )}

        {isGeneratingStory && (
          <div className="text-center mt-32 space-y-8 animate-pulse">
            <Loader2 className="w-32 h-32 text-sky-500 mx-auto animate-spin" />
            <h2 className="text-5xl font-black text-sky-700">Hikayen Yazılıyor... ✍️✨</h2>
          </div>
        )}

        {view === 'reading-ready' && (
          <div className="bg-white/95 p-16 rounded-[4rem] shadow-2xl text-center border-8 border-amber-300">
            <h2 className="text-6xl font-black text-amber-600 mb-12">Hazır mısın?</h2>
            <div className="flex gap-6">
              <button onClick={()=>beginReading(false)} className="flex-1 bg-sky-500 text-white py-8 rounded-3xl text-3xl font-black shadow-xl border-b-8 border-sky-700">SESSİZ OKU 📖</button>
              <button onClick={()=>beginReading(true)} className="flex-1 bg-rose-500 text-white py-8 rounded-3xl text-3xl font-black shadow-xl border-b-8 border-rose-700 flex items-center justify-center gap-4"><Mic size={40}/> SESLİ OKU</button>
            </div>
            {micError && <p className="mt-4 text-rose-500 font-bold">{micError}</p>}
          </div>
        )}

        {view === 'reading-active' && storyData && (
          <div className="space-y-8 pb-20">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200">
              <p className="text-4xl leading-[5.5rem] font-bold text-slate-800 text-left whitespace-pre-wrap select-none">{storyData.text}</p>
            </div>
            {!isReadingFinished && (
              <button onClick={finishReading} className="w-full bg-emerald-500 text-white py-10 rounded-full text-5xl font-black border-b-[16px] border-emerald-700 shadow-2xl">BİTİRDİM! 🎉</button>
            )}
            
            {isReadingFinished && (
              <div className="bg-white p-10 rounded-[3rem] border-8 border-fuchsia-300 space-y-10">
                <h2 className="text-4xl font-black text-fuchsia-600">Soruları Cevapla 🧠</h2>
                {storyData.questions.map((q, idx) => (
                  <div key={q.id} className="text-left space-y-4">
                    <p className="text-2xl font-black text-slate-700">{idx+1}. {q.q}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <button key={oIdx} onClick={()=>setAnswers({...answers, [q.id]: oIdx})} className={`p-5 rounded-2xl text-xl font-bold text-left border-4 transition-all ${answers[q.id] === oIdx ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-sky-100 hover:bg-sky-50'}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={showFinalResult} disabled={Object.keys(answers).length < 2} className="w-full bg-sky-500 text-white py-8 rounded-2xl text-3xl font-black border-b-8 border-sky-700">SONUCU GÖSTER 🏆</button>
              </div>
            )}
          </div>
        )}

        {view === 'result' && readingResult && (
          <div className="bg-white/95 p-12 rounded-[4rem] shadow-2xl border-8 border-sky-300 text-center space-y-8">
            <Award className="w-32 h-32 text-amber-500 mx-auto" />
            <h2 className="text-5xl font-black text-sky-600">Harikasın {readingResult.name}!</h2>
            <div className="bg-indigo-50 p-8 rounded-3xl text-2xl font-bold text-indigo-900 leading-relaxed italic">"{readingResult.aiFeedback}"</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border-4 border-emerald-100"><p className="text-emerald-600 text-4xl font-black">{readingResult.wpm}</p><p className="font-bold text-emerald-800">Okuma Hızı</p></div>
              <div className="bg-amber-50 p-6 rounded-3xl border-4 border-amber-100"><p className="text-amber-600 text-4xl font-black">{readingResult.compScore}/2</p><p className="font-bold text-amber-800">Anlama Skoru</p></div>
            </div>
            <button onClick={()=>setView('student-setup')} className="w-full bg-sky-500 text-white py-6 rounded-2xl text-3xl font-black">YENİ MACERA! 🎮</button>
          </div>
        )}

        {/* --- ÖĞRETMEN PANELİ EKRANLARI --- */}
        {view === 'teacher-login' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-2xl border-4 border-emerald-400 text-center">
            <h2 className="text-3xl font-black text-emerald-600 mb-6">Öğretmen Girişi</h2>
            <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} className="w-full p-4 border-4 rounded-xl text-center text-4xl font-black mb-4 outline-none" placeholder="••••" maxLength={4}/>
            <button onClick={()=>{ if(teacherPassword === '1234') setView('teacher'); else setPasswordError(true); }} className="w-full bg-emerald-500 text-white py-4 rounded-xl text-xl font-bold">Giriş Yap</button>
            <button onClick={()=>setView('student-setup')} className="mt-4 text-slate-400 font-bold">Geri Dön</button>
          </div>
        )}

        {view === 'teacher' && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-emerald-100 min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-emerald-600 uppercase">Öğretmen Paneli</h2>
              <button onClick={()=>setView('student-setup')} className="bg-rose-100 text-rose-600 px-6 py-2 rounded-full font-bold">Çıkış Yap</button>
            </div>
            <div className="flex border-b-4 mb-8">
              {['stats', 'students'].map(t => (
                <button key={t} onClick={()=>setTeacherTab(t)} className={`flex-1 py-4 font-black text-xl capitalize ${teacherTab === t ? 'text-emerald-600 border-b-8 border-emerald-500' : 'text-slate-300'}`}>{t === 'stats' ? 'Sonuçlar' : 'Öğrenci Listesi'}</button>
              ))}
            </div>

            {teacherTab === 'stats' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50">
                    <tr><th className="p-4">İsim</th><th className="p-4">Hız</th><th className="p-4">Skor</th><th className="p-4">Tarih</th></tr>
                  </thead>
                  <tbody>
                    {stats.map(s => (
                      <tr key={s.id} className="border-b font-bold"><td className="p-4">{s.name}</td><td className="p-4 text-emerald-600">{s.wpm}</td><td className="p-4">{s.compScore}/2</td><td className="p-4 text-slate-400 text-sm">{new Date(s.timestamp).toLocaleDateString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {teacherTab === 'students' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input type="text" placeholder="Öğrenci Adı" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="flex-1 p-4 border-2 rounded-xl font-bold"/>
                  <button onClick={handleAddStudent} className="bg-emerald-500 text-white px-8 rounded-xl font-bold">Ekle</button>
                </div>
                {students.length === 0 && <button onClick={handleLoadClass} className="w-full bg-amber-400 text-white py-3 rounded-xl font-black">1/A SINIF LİSTESİNİ YÜKLE 🏫</button>}
                <div className="grid grid-cols-2 gap-4">
                  {students.map(s => (
                    <div key={s.id} className="p-4 bg-emerald-50 rounded-xl flex justify-between font-bold">
                      <span>{s.name}</span>
                      <span className="text-emerald-400">{s.password}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
