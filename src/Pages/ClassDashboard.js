import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogIn, Video, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

const ClassDashboard = () => {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [authErrorMsg, setAuthErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        setErrorMsg('');
        setAuthErrorMsg('');
        const q = query(collection(db, 'meetings'), where('status', '==', 'active'));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const meetings = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.roomId) {
              meetings.push({
                id: doc.id,
                roomId: data.roomId,
                title: data.title,
                teacher: data.teacher
              });
            }
          });
          setActiveMeetings(meetings);
          setLoading(false);
          setErrorMsg('');
        }, (error) => {
          console.error("Error listening to meetings:", error);
          if (error.code === 'permission-denied') {
            setErrorMsg("Permission denied. Ask your teacher to update Firestore rules to allow student access.");
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
        });
        
        return () => unsubscribeSnapshot();
      } else {
        setActiveMeetings([]);
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
      if (err.code === 'auth/popup-blocked') {
        setAuthErrorMsg("Popups are blocked. Please click the 'Open in New Tab' icon in the top right to open this app in a new tab, then try signing in.");
      } else if (err.code === 'auth/cancelled-popup-request' || (err.message && err.message.includes('Pending promise was never set'))) {
        setAuthErrorMsg("Sign-in popup was closed. Please try again.");
      } else if (err.code === 'auth/network-request-failed') {
        setAuthErrorMsg("Network request failed. Your browser may be blocking cross-site tracking. Please open the app in a new tab.");
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/internal-error') {
        setAuthErrorMsg("Authentication is not enabled in your Firebase project. Please go to the Firebase Console -> Authentication -> Get Started, and enable the Google Sign-in provider.");
      } else {
        setAuthErrorMsg(`Failed to log in: ${err.message}`);
      }
    }
  };

  const joinClass = (e) => {
    e.preventDefault();
    if (serverUrl.trim().includes('aistudio.google.com')) {
      alert("Please do not use the aistudio.google.com link.\n\nGo to the Teacher's Dashboard in the other app and copy the exact 'Server URL' displayed there (it should look like https://ais-pre-...run.app).");
      return;
    }
    if (meetingId.trim()) {
      let url = `/room/${meetingId.trim()}?name=${user ? user.displayName : 'Student'}&role=viewer`;
      if (serverUrl.trim()) {
        url += `&serverUrl=${encodeURIComponent(serverUrl.trim())}`;
      }
      navigate(url);
    }
  };

  const joinJitsiMeeting = (roomId) => {
    window.open(`https://meet.jit.si/${roomId}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Virtual Classroom Dashboards</h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Connect in real-time with WebRTC video buffering and Sign Language support.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Live Meeting Dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <Video className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Classes</h3>
            <p className="text-gray-500 mb-8 flex-grow">
              Join active real-time classes directly via Jitsi Meet.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[160px] flex flex-col justify-center">
              {!user ? (
                 <div className="text-center">
                   {authErrorMsg && (
                     <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                       <p className="font-semibold mb-1">Sign-in Error</p>
                       <p>{authErrorMsg}</p>
                     </div>
                   )}
                   <p className="text-gray-600 mb-4 text-sm">Please sign in to view live classes and bypass permission errors.</p>
                   <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                     Sign in with Google
                   </button>
                 </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p>Checking for live classes...</p>
                </div>
              ) : errorMsg ? (
                <div className="text-center text-red-600 p-2 bg-red-50 rounded-lg text-sm border border-red-200">
                  <p className="font-semibold mb-1">Could not load classes</p>
                  <p>{errorMsg}</p>
                </div>
              ) : activeMeetings.length > 0 ? (
                <div className="space-y-4">
                  {activeMeetings.map((meeting) => (
                    <div key={meeting.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 tracking-wide mb-2">
                            <span className="w-2 h-2 mr-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            LIVE NOW
                          </span>
                          <h4 className="font-semibold text-gray-900">{meeting.title || 'Live Classroom'}</h4>
                          {meeting.teacher && <p className="text-sm text-gray-500">with {meeting.teacher}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => joinJitsiMeeting(meeting.roomId)}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No Active Class</p>
                  <p className="text-sm text-gray-400 mt-1">Waiting for the teacher to start a meeting...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Existing Student Dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Blind/Hearing Impaired</h3>
            <p className="text-gray-500 mb-8 flex-grow">
              Join an existing classroom session using the meeting ID provided by your teacher.
            </p>
            <form onSubmit={joinClass} className="space-y-4">
              <div>
                <label htmlFor="meetingId" className="sr-only">Meeting ID</label>
                <input
                  type="text"
                  id="meetingId"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter Meeting ID"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="serverUrl" className="sr-only">Teacher Server URL</label>
                <input
                  type="url"
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="Teacher's Server URL (optional)"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                disabled={!meetingId.trim()}
              >
                <LogIn className="w-5 h-5" />
                Join Class
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDashboard;
