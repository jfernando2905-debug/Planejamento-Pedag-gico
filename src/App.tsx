import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  db, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  User,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { 
  WeeklyPlanning, 
  SavedLesson, 
  Lesson,
  Story, 
  Song, 
  Game, 
  SchoolSettings, 
  UserProfile,
  BibleLesson
} from './types';
import { SAMPLE_PLANNING, SAMPLE_LESSONS, SAMPLE_STORIES, SAMPLE_SONGS, SAMPLE_GAMES } from './data/sampleData';
import { SAMPLE_BIBLE_LESSONS } from './data/sampleBibleLessons';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PlanningEditor } from './components/PlanningEditor';
import { PlanningList } from './components/PlanningList';
import { LessonBank } from './components/LessonBank';
import { StoryBank } from './components/StoryBank';
import { SongBank } from './components/SongBank';
import { GameBank } from './components/GameBank';
import { BnccExplorer } from './components/BnccExplorer';
import { BibleBank } from './components/BibleBank';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { PwaReloadPrompt } from './components/PwaReloadPrompt';
import { LoginGate } from './components/LoginGate';
import { getWeekDates, buildDefaultRoutineForDay } from './lib/dateUtils';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Data States
  const [plannings, setPlannings] = useState<WeeklyPlanning[]>([SAMPLE_PLANNING]);
  const [currentPlanning, setCurrentPlanning] = useState<WeeklyPlanning>(SAMPLE_PLANNING);
  const [lessons, setLessons] = useState<SavedLesson[]>(SAMPLE_LESSONS);
  const [stories, setStories] = useState<Story[]>(SAMPLE_STORIES);
  const [songs, setSongs] = useState<Song[]>(SAMPLE_SONGS);
  const [games, setGames] = useState<Game[]>(SAMPLE_GAMES);
  const [bibleLessons, setBibleLessons] = useState<BibleLesson[]>(SAMPLE_BIBLE_LESSONS);

  const [settings, setSettings] = useState<SchoolSettings | null>({
    userId: 'default-user',
    schoolName: 'Escola de Educação Infantil Cristão de Curitiba',
    logoUrl: '',
    teacherName: 'Profe Camila',
    city: 'Curitiba',
    state: 'PR',
    phone: '(41) 99999-9999',
    defaultClass: 'KINDER 3'
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  // PWA Install Prompt & Network State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Listen for PWA Install Event & Auto-prompt on load
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone || 
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      (window as any).deferredPwaPrompt = e;
      setPwaModalOpen(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      (window as any).deferredPwaPrompt = null;
      setPwaModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ((window as any).deferredPwaPrompt) {
      setInstallPrompt((window as any).deferredPwaPrompt);
    }

    const timer = setTimeout(() => {
      if (!isStandalone) {
        setPwaModalOpen(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallPwa = () => {
    const activePrompt = installPrompt || (window as any).deferredPwaPrompt;
    if (activePrompt) {
      activePrompt.prompt();
      activePrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
          (window as any).deferredPwaPrompt = null;
          setPwaModalOpen(false);
        }
      });
    } else {
      setPwaModalOpen(true);
    }
  };

  // Load local settings on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('schoolSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.warn("Error parsing schoolSettings from localStorage:", e);
      }
    }
  }, []);

  // Firebase Auth Listener & Firestore Data Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const uProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'usuario@escola.com',
          displayName: firebaseUser.displayName || 'Professor(a)',
          photoURL: firebaseUser.photoURL || undefined,
          isAnonymous: firebaseUser.isAnonymous
        };
        setUser(uProfile);

        // Fetch School Settings from Firestore
        try {
          const settingsQuery = query(collection(db, 'settings'), where('userId', '==', firebaseUser.uid));
          const settingsSnap = await getDocs(settingsQuery);
          if (!settingsSnap.empty) {
            const fetchedSettings = settingsSnap.docs[0].data() as SchoolSettings;
            setSettings(fetchedSettings);
            localStorage.setItem('schoolSettings', JSON.stringify(fetchedSettings));
          }
        } catch (e) {
          console.warn("Could not fetch user settings from Firestore:", e);
        }

        // Load Firestore User Plannings
        try {
          const q = query(collection(db, 'plannings'), where('userId', '==', firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          const docs: WeeklyPlanning[] = [];
          querySnapshot.forEach((docSnap) => {
            docs.push({ id: docSnap.id, ...docSnap.data() } as WeeklyPlanning);
          });
          if (docs.length > 0) {
            setPlannings(docs);
            setCurrentPlanning(docs[0]);
          }
        } catch (err) {
          console.log("Firestore fetch fallback:", err);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save Planning to Firebase
  const handleSavePlanningFirebase = async (planningToSave: WeeklyPlanning) => {
    // Local Update first
    const exists = plannings.some(p => p.id === planningToSave.id);
    let updatedList: WeeklyPlanning[];
    if (exists) {
      updatedList = plannings.map(p => p.id === planningToSave.id ? planningToSave : p);
    } else {
      updatedList = [planningToSave, ...plannings];
    }
    setPlannings(updatedList);
    setCurrentPlanning(planningToSave);

    // Sync to Firestore if logged in
    if (user && db) {
      try {
        const docRef = doc(db, 'plannings', planningToSave.id);
        await setDoc(docRef, {
          ...planningToSave,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        alert("Planejamento salvo com sucesso no Firebase!");
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `plannings/${planningToSave.id}`);
        alert("Planejamento salvo localmente no aplicativo!");
      }
    } else {
      alert("Planejamento salvo no seu navegador!");
    }
  };

  // Duplicate Planning
  const handleDuplicatePlanning = (planning: WeeklyPlanning) => {
    const duplicated: WeeklyPlanning = {
      ...planning,
      id: `planning-${Date.now()}`,
      week: `${planning.week} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPlannings([duplicated, ...plannings]);
    setCurrentPlanning(duplicated);
    setActiveTab('novo-planejamento');
  };

  // Delete Planning
  const handleDeletePlanning = async (id: string) => {
    const updated = (plannings || []).filter(p => p && p.id !== id);
    setPlannings(updated);

    if (currentPlanning?.id === id) {
      if (updated.length > 0) {
        setCurrentPlanning(updated[0]);
      } else {
        handleCreateNewPlanning();
      }
    }

    if (user && db) {
      try {
        await deleteDoc(doc(db, 'plannings', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `plannings/${id}`);
      }
    }
  };

  // Save School Settings
  const handleSaveSettings = async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    localStorage.setItem('schoolSettings', JSON.stringify(newSettings));

    if (user && db) {
      try {
        await setDoc(doc(db, 'settings', user.uid), newSettings, { merge: true });
      } catch (err) {
        console.warn("Error saving settings to Firestore:", err);
      }
    }

    if (currentPlanning) {
      const updated = {
        ...currentPlanning,
        schoolName: newSettings.schoolName || currentPlanning.schoolName,
        teacher: newSettings.teacherName || currentPlanning.teacher,
        className: currentPlanning.className || newSettings.defaultClass
      };
      setCurrentPlanning(updated);
      setPlannings(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  // New Fresh Planning Creation with pre-filled routines and schedules (13:00 to 17:15)
  const handleCreateNewPlanning = () => {
    const weekData = getWeekDates();
    const newPlanning: WeeklyPlanning = {
      id: `planning-${Date.now()}`,
      userId: user?.uid || 'default-user',
      schoolName: settings?.schoolName || 'Escola de Educação Infantil Cristão de Curitiba',
      className: settings?.defaultClass || 'KINDER 3',
      year: new Date(weekData.monday).getFullYear().toString(),
      teacher: settings?.teacherName || 'Profe Camila',
      period: 'Vespertino',
      week: weekData.weekLabel,
      startDate: weekData.startDateIso,
      endDate: weekData.endDateIso,
      generalTheme: 'Planejamento Semanal Pedagógico',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: {
        segunda: { 
          dayName: 'Segunda-feira', 
          dateStr: weekData.daysDdMm.segunda, 
          subHeader: 'PEDAGÓGICA', 
          routine: buildDefaultRoutineForDay('seg'), 
          lessons: [] 
        },
        terca: { 
          dayName: 'Terça-feira', 
          dateStr: weekData.daysDdMm.terca, 
          subHeader: 'PEDAGÓGICA', 
          routine: buildDefaultRoutineForDay('ter'), 
          lessons: [] 
        },
        quarta: { 
          dayName: 'Quarta-feira', 
          dateStr: weekData.daysDdMm.quarta, 
          subHeader: 'PEDAGÓGICA', 
          routine: buildDefaultRoutineForDay('qua'), 
          lessons: [] 
        },
        quinta: { 
          dayName: 'Quinta-feira', 
          dateStr: weekData.daysDdMm.quinta, 
          subHeader: 'PEDAGÓGICA', 
          routine: buildDefaultRoutineForDay('qui'), 
          lessons: [] 
        },
        sexta: { 
          dayName: 'Sexta-feira', 
          dateStr: weekData.daysDdMm.sexta, 
          subHeader: 'PEDAGÓGICA', 
          routine: buildDefaultRoutineForDay('sex'), 
          lessons: [] 
        }
      }
    };
    
    // Set active draft without adding to saved plannings until explicitly saved
    setCurrentPlanning(newPlanning);
    setActiveTab('novo-planejamento');
  };

  // Discard local unsaved draft changes
  const handleDiscardChanges = () => {
    if (!currentPlanning) return;
    const saved = plannings.find(p => p.id === currentPlanning.id);
    if (saved) {
      setCurrentPlanning(saved);
    } else if (plannings.length > 0) {
      setCurrentPlanning(plannings[0]);
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse mb-4">
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 animate-pulse">
          Carregando sistema de planejamentos...
        </p>
      </div>
    );
  }

  // Mandatory Login Gate if user is not authenticated
  if (!user) {
    return (
      <LoginGate 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onLocalGuestLogin={() => {
          setUser({
            uid: 'guest-' + Date.now(),
            email: 'visitante@escola.com',
            displayName: 'Professor(a) Visitante',
            isAnonymous: true
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-blue-500 selection:text-white">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 font-extrabold text-xs px-4 py-2 text-center flex items-center justify-center gap-2 shadow-md animate-in fade-in sticky top-0 z-40">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>Você está navegando no modo offline. Seus dados e planejamentos salvos continuam acessíveis.</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        settings={settings}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => signOut(auth)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        installPrompt={installPrompt}
        onInstallPwa={handleInstallPwa}
        onNewPlanning={handleCreateNewPlanning}
      />

      {/* Main App Canvas */}
      <main className="lg:pl-64 w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            plannings={plannings}
            lessons={lessons}
            stories={stories}
            songs={songs}
            games={games}
            bibleLessons={bibleLessons}
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onSelectPlanning={(p) => {
              setCurrentPlanning(p);
              setActiveTab('novo-planejamento');
            }}
            onNewPlanning={handleCreateNewPlanning}
          />
        )}

        {activeTab === 'novo-planejamento' && (
          <PlanningEditor
            currentPlanning={currentPlanning}
            onChangePlanning={(updated) => {
              setCurrentPlanning(updated);
            }}
            onDiscardChanges={handleDiscardChanges}
            onSaveFirebase={handleSavePlanningFirebase}
            settings={settings}
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
            savedLessons={lessons}
            onSaveLessonToBank={(newSaved) => {
              setLessons([newSaved, ...lessons]);
            }}
            stories={stories}
            bibleLessons={bibleLessons}
            onClose={() => setActiveTab('planejamentos')}
          />
        )}

        {activeTab === 'planejamentos' && (
          <PlanningList
            plannings={plannings}
            onSelectPlanning={(p) => {
              setCurrentPlanning(p);
              setActiveTab('novo-planejamento');
            }}
            onDuplicatePlanning={handleDuplicatePlanning}
            onDeletePlanning={handleDeletePlanning}
            onNewPlanning={handleCreateNewPlanning}
            settings={settings}
          />
        )}

        {activeTab === 'banco-aulas' && (
          <LessonBank
            lessons={lessons || []}
            onSaveLesson={(l) => {
              const currentList = lessons || [];
              const exists = currentList.some(x => x && x.id === l.id);
              setLessons(exists ? currentList.map(x => x && x.id === l.id ? l : x) : [l, ...currentList]);
            }}
            onDeleteLesson={(id) => setLessons((lessons || []).filter(l => l && l.id !== id))}
            onToggleFavorite={(id) => setLessons((lessons || []).map(l => l && l.id === id ? { ...l, isFavorite: !l.isFavorite } : l))}
          />
        )}

        {activeTab === 'banco-historias' && (
          <StoryBank
            stories={stories || []}
            onSaveStory={(s) => {
              const currentList = stories || [];
              const exists = currentList.some(x => x && x.id === s.id);
              setStories(exists ? currentList.map(x => x && x.id === s.id ? s : x) : [s, ...currentList]);
            }}
            onDeleteStory={(id) => setStories((stories || []).filter(s => s && s.id !== id))}
          />
        )}

        {activeTab === 'banco-musicas' && (
          <SongBank
            songs={songs || []}
            onSaveSong={(s) => {
              const currentList = songs || [];
              const exists = currentList.some(x => x && x.id === s.id);
              setSongs(exists ? currentList.map(x => x && x.id === s.id ? s : x) : [s, ...currentList]);
            }}
            onDeleteSong={(id) => setSongs((songs || []).filter(s => s && s.id !== id))}
          />
        )}

        {activeTab === 'banco-brincadeiras' && (
          <GameBank
            games={games || []}
            onSaveGame={(g) => {
              const currentList = games || [];
              const exists = currentList.some(x => x && x.id === g.id);
              setGames(exists ? currentList.map(x => x && x.id === g.id ? g : x) : [g, ...currentList]);
            }}
            onDeleteGame={(id) => setGames((games || []).filter(g => g && g.id !== id))}
          />
        )}

        {(activeTab === 'banco-materiais' || activeTab === 'banco-biblico') && (
          <BibleBank
            bibleLessons={bibleLessons || []}
            onSaveBibleLesson={(bLesson) => {
              const currentList = bibleLessons || [];
              const exists = currentList.some(x => x && x.id === bLesson.id);
              setBibleLessons(exists ? currentList.map(x => x && x.id === bLesson.id ? bLesson : x) : [bLesson, ...currentList]);
            }}
            onDeleteBibleLesson={(id) => setBibleLessons((bibleLessons || []).filter(x => x && x.id !== id))}
            onToggleFavorite={(id) => setBibleLessons((bibleLessons || []).map(x => x && x.id === id ? { ...x, isFavorite: !x.isFavorite } : x))}
          />
        )}

        {activeTab === 'banco-bncc' && (
          <BnccExplorer />
        )}
      </main>

      {/* Global Modals */}
      <PwaReloadPrompt />
      <PwaInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        installPrompt={installPrompt}
        onInstallNative={handleInstallPwa}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        onSaveToBank={(lesson) => setLessons([lesson, ...lessons])}
        defaultClass={settings?.defaultClass || 'KINDER 3'}
        defaultTeacher={settings?.teacherName || 'Profe Camila'}
        onApplyPlanning={(newPlanning) => {
          setPlannings([newPlanning, ...plannings]);
          setCurrentPlanning(newPlanning);
          setActiveTab('novo-planejamento');
          setAiAssistantOpen(false);
        }}
        onApplyLesson={(lessonData) => {
          const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            subject: lessonData.subject || 'LINGUAGEM',
            time: '13:30 – 14:20',
            theme: lessonData.theme || lessonData.name || 'Aula Gerada por IA',
            objectives: lessonData.objectives || '',
            bnccCodes: lessonData.bnccCodes || [],
            development: lessonData.development || '',
            materials: lessonData.materials || [],
            notes: lessonData.notes || ''
          };

          // Automatically save AI lesson to lesson bank as well
          const savedAiLesson: SavedLesson = {
            id: `ai-lesson-${Date.now()}`,
            userId: 'current-user',
            name: lessonData.name || lessonData.theme || 'Aula Gerada por IA',
            subject: newLesson.subject,
            theme: newLesson.theme,
            objectives: newLesson.objectives,
            bnccCodes: newLesson.bnccCodes,
            development: newLesson.development,
            materials: newLesson.materials,
            notes: newLesson.notes,
            createdAt: new Date().toISOString()
          };
          setLessons(prev => [savedAiLesson, ...prev]);

          if (currentPlanning) {
            const dayKey = 'segunda';
            const currentDayObj = currentPlanning.days[dayKey];
            const updatedDay = {
              ...currentDayObj,
              lessons: [...(currentDayObj.lessons || []), newLesson]
            };
            const updatedPlanning = {
              ...currentPlanning,
              days: {
                ...currentPlanning.days,
                [dayKey]: updatedDay
              },
              updatedAt: new Date().toISOString()
            };
            setCurrentPlanning(updatedPlanning);
            setPlannings(plannings.map(p => p.id === updatedPlanning.id ? updatedPlanning : p));
          }
          setActiveTab('novo-planejamento');
          setAiAssistantOpen(false);
        }}
      />
    </div>
  );
}
