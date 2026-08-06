import './App.css'
import React from "react";
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom'
import Convert from './Pages/Convert';
import LearnSign from './Pages/LearnSign';
import Video from './Pages/Video';
import ProcessVideo from './Pages/ProcessVideo';
import Room from './Pages/Room';
import ClassDashboard from './Pages/ClassDashboard';
import LiveMode from './Pages/LiveMode';
import HomePage from './Pages/HomePage';
import Navbar from './Components/Navbar';

function App() {
  return(
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route exact path='/sign-kit/dashboard' element={<HomePage />} />
          <Route exact path='/sign-kit/convert' element={<Convert />} />
          <Route exact path='/sign-kit/live' element={<LiveMode />} />
          <Route exact path='/sign-kit/learn-sign' element={<LearnSign />} />
          <Route exact path='/sign-kit/video/:videoId' element={<Video />} />
          <Route exact path='/sign-kit/process-video' element={<ProcessVideo />} />
          <Route exact path='/sign-kit/class' element={<ClassDashboard />} />
          <Route path='/room/:roomId' element={<Room />} />
          <Route exact path='*' element={<Navigate to='/sign-kit/dashboard'/>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;