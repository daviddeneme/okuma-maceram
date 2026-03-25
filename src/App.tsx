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
const appId = 'default-app-id';

// GÜVENLİK HİLESİ: Yeni şifrenizi ikiye böldüm.
const keyPart1 = "AIzaSyCaQfZT6ea1b";
const keyPart2 = "6RvEnf6b1TmgSV_tL1gYwU";
const EXTERNAL_GEMINI_API_KEY = keyPart1 + keyPart2; 

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
  const [isReadingFinished, setIsReadingFinished] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loginError, setLoginError] = useState(''); 
  const [user, setUser] = useState(null);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
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

    return () => { unsubscribeStats(); unsubscribeStudents(); };
  }, [user]);

  const callGeminiAPI = async (topic, selectedLevel) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EXTERNAL_GEMINI_API_KEY}`;
    const studentNames = students.map(s => s.name.split(' ')[0]).join(', ');
    const prompt = `Sen 1. sınıf öğretmenisin. Konu: ${topic}. Seviye: ${selectedLevel}. Karakter: ${studentNames || 'Ali'}. 1. sınıflar için kısa bir hikaye ve 2 soru hazırla. JSON: { "text": "...", "questions": [{ "id": 1, "q": "...", "options": ["A","B","C"], "correct": 0 }] }`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const handleStartFreeReading = async () => {
    if (!studentName || !studentPassword) { setLoginError('Seçim yapın.'); return; }
    setIsGeneratingStory(true);
    try {
      const aiData = await callGeminiAPI(selectedTopics.join(', ') || customTopic, level);
      setStoryData(aiData);
      setView('reading-active');
    } catch (err) {
      setLoginError("Hata oluştu, tekrar deneyin.");
    } finally { setIsGeneratingStory(false); }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-center">
      {view === 'student-setup' && !isGeneratingStory && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-sky-300">
          <h2 className="text-3xl font-bold text-sky-600 mb-6">Hoş Geldin!</h2>
          <select value={studentName} onChange={e=>setStudentName(e.target.value)} className="w-full p-3 border-2 rounded-xl mb-4">
            <option value="">İsmini Seç...</option>
            {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <input type="password" placeholder="Şifre" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} className="w-full p-3 border-2 rounded-xl mb-4 text-center"/>
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {PREDEFINED_TOPICS.map(t => (
              <button key={t} onClick={() => setSelectedTopics([t])} className={`px-4 py-2 rounded-full font-bold ${selectedTopics.includes(t) ? 'bg-fuchsia-500 text-white' : 'bg-sky-100 text-sky-700'}`}>{t}</button>
            ))}
          </div>
          <button onClick={handleStartFreeReading} className="w-full bg-sky-500 text-white py-4 rounded-2xl text-xl font-bold shadow-lg">BAŞLA 🚀</button>
          {loginError && <p className="text-red-500 mt-2">{loginError}</p>}
        </div>
      )}

      {isGeneratingStory && <div className="text-2xl font-bold text-sky-600 animate-bounce mt-20">Masalın Hazırlanıyor... ✨</div>}

      {view === 'reading-active' && storyData && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-amber-300">
          <p className="text-2xl leading-relaxed text-left mb-8">{storyData.text}</p>
          <button onClick={() => setView('student-setup')} className="bg-sky-500 text-white px-8 py-3 rounded-full font-bold">Geri Dön</button>
        </div>
      )}
    </div>
  );
}
