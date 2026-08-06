import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, FileText, Video as VideoIcon, User, LogIn, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [authErrorMsg, setAuthErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        setAuthErrorMsg('');
        
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Listen to today's schedule
        const qPeriods = query(
            collection(db, 'periods'), 
            where('teacherId', '==', currentUser.uid),
            where('date', '==', today)
        );
        
        const unsubPeriods = onSnapshot(qPeriods, (snapshot) => {
            const loadedPeriods = [];
            snapshot.forEach(doc => {
                loadedPeriods.push({ id: doc.id, ...doc.data() });
            });
            // Sort by time
            loadedPeriods.sort((a, b) => a.time.localeCompare(b.time));
            setPeriods(loadedPeriods);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching periods:", error);
            setLoading(false);
        });

        // Listen to students
        const qStudents = query(
            collection(db, 'students'),
            where('teacherId', '==', currentUser.uid)
        );

        const unsubStudents = onSnapshot(qStudents, (snapshot) => {
            const loadedStudents = [];
            snapshot.forEach(doc => {
                loadedStudents.push({ id: doc.id, ...doc.data() });
            });
            setStudents(loadedStudents);
        }, (error) => {
            console.error("Error fetching students:", error);
        });

        return () => {
            unsubPeriods();
            unsubStudents();
        };
      } else {
        setPeriods([]);
        setStudents([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      setAuthErrorMsg('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
      setAuthErrorMsg(`Failed to log in: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (err) {
        console.error("Logout failed:", err);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Good Morning, {user?.displayName?.split(' ')[0] || 'Student'}</h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {todayStr}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-medium">
                    <User className="w-5 h-5" />
                    <span>{students.length} Classmates</span>
                </div>
                {user && (
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Log Out">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Schedule Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {periods.length} Classes
                    </span>
                </div>

                {periods.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-1">No classes scheduled</h3>
                        <p className="text-gray-500">Enjoy your free day or add new classes to your schedule.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {periods.map((period, index) => (
                            <div key={period.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
                                
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                                                <Clock className="w-4 h-4" />
                                                {period.time}
                                            </span>
                                            {period.videoRecorded && (
                                                <span className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-50 px-2 py-1 rounded-lg">
                                                    <VideoIcon className="w-3 h-3" /> Recorded
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{period.subject}</h3>
                                        <p className="text-gray-600 font-medium mb-4">{period.topic}</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {period.book && (
                                                <div className="flex items-start gap-2">
                                                    <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium uppercase">Book</p>
                                                        <p className="text-sm text-gray-800">{period.book}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {period.homework && (
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium uppercase">Homework</p>
                                                        <p className="text-sm text-gray-800">{period.homework}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {period.materials && period.materials.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Materials Needed</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {period.materials.map((mat, i) => (
                                                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                                                            {mat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 md:mt-0 flex-shrink-0">
                                        <button 
                                            onClick={() => navigate('/sign-kit/class')}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium py-2.5 px-4 rounded-xl transition-colors"
                                        >
                                            Go to Class
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Classmates</h3>
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {students.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No classmates found.</p>
                    ) : (
                        <div className="space-y-4">
                            {students.slice(0, 5).map(student => (
                                <div key={student.id} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{student.name}</span>
                                        <span className="text-xs text-gray-500">Grade {student.grade}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {student.isHearingImpaired && (
                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold" title="Hearing Impaired">H</span>
                                        )}
                                        {student.isVisuallyImpaired && (
                                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold" title="Visually Impaired">V</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {students.length > 5 && (
                                <button className="w-full mt-2 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                                    View All {students.length} Classmates
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <VideoIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Live Session</h3>
                    <p className="text-blue-100 text-sm mb-6">Start a new classroom session or join an existing one.</p>
                    <button 
                        onClick={() => navigate('/sign-kit/class')}
                        className="w-full bg-white text-blue-600 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl transition-colors"
                    >
                        Open Dashboard
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
