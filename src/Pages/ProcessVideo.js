import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';
import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GoogleGenAI } from '@google/genai';

function ProcessVideo() {
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.15);
  const [pause, setPause] = useState(400);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  
  const componentRef = useRef({});
  const { current: ref } = componentRef;
  const videoRef = useRef(null);
  const lastPlayedWordIndex = useRef(-1);

  // Initialize Three.js
  useEffect(() => {
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];
    ref.characters = [];

    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xdddddd);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 20, 0);
    ref.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 5, 5);
    ref.scene.add(dirLight);

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Adjusted camera aspect ratio to fit side-by-side
    ref.camera = new THREE.PerspectiveCamera(
        30,
        1, // We will manually update this based on container width later
        0.1,
        1000
    );
    
    const container = document.getElementById("canvas-container");
    if(container) {
       ref.renderer.setSize(container.clientWidth, container.clientHeight);
       ref.camera.aspect = container.clientWidth / container.clientHeight;
       ref.camera.updateProjectionMatrix();
       container.innerHTML = "";
       container.appendChild(ref.renderer.domElement);
    }

    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;

    ref.controls = new OrbitControls(ref.camera, ref.renderer.domElement);
    ref.controls.target.set(0, 1.4, 0);
    ref.controls.addEventListener('change', () => {
        ref.renderer.render(ref.scene, ref.camera);
    });

    let loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type === 'SkinnedMesh') {
            child.frustumCulled = false;
          }
        });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
        ref.animate(); // Start animation loop
      },
      undefined,
      (error) => console.error(error)
    );
  }, [ref, bot]);

  ref.animate = () => {
    if (ref.animations.length === 0) {
      ref.pending = false;
      requestAnimationFrame(ref.animate);
      ref.renderer.render(ref.scene, ref.camera);
      return;
    }
    
    if (ref.animations[0].length) {
      if (!ref.flag) {
        if (ref.animations[0][0] === 'add-text') {
          ref.animations.shift();
        } else {
          for (let i = 0; i < ref.animations[0].length; ) {
            let [boneName, action, axis, limit, sign] = ref.animations[0][i];
            let bone = ref.avatar.getObjectByName(boneName);
            if (!bone) { i++; continue; }
            
            if (sign === "+" && bone[action][axis] < limit) {
              bone[action][axis] += speed;
              bone[action][axis] = Math.min(bone[action][axis], limit);
              i++;
            } else if (sign === "-" && bone[action][axis] > limit) {
              bone[action][axis] -= speed;
              bone[action][axis] = Math.max(bone[action][axis], limit);
              i++;
            } else {
              ref.animations[0].splice(i, 1);
            }
          }
        }
      }
    } else {
      ref.flag = true;
      setTimeout(() => {
        ref.flag = false;
      }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
    requestAnimationFrame(ref.animate);
  };

  const handleResize = () => {
      const container = document.getElementById("canvas-container");
      if(container && ref.renderer && ref.camera) {
          ref.camera.aspect = container.clientWidth / container.clientHeight;
          ref.camera.updateProjectionMatrix();
          ref.renderer.setSize(container.clientWidth, container.clientHeight);
      }
  };

  useEffect(() => {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const queueWordSign = (wordText) => {
    const cleanWord = wordText.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanWord) return;
    
    if (words[cleanWord]) {
      ref.animations.push(['add-text', cleanWord + ' ']);
      words[cleanWord](ref);
    } else {
      for (const [index, ch] of cleanWord.split('').entries()) {
        ref.animations.push(['add-text', ch + (index === cleanWord.length - 1 ? ' ' : '')]);
        if(alphabets[ch]) {
            alphabets[ch](ref);
        }
      }
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setTranscript([]);
      setCurrentSubtitle("");
      lastPlayedWordIndex.current = -1;
      
      // Reset Avatar
      ref.animations = [];
      defaultPose(ref);
    }
  };

  const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const extractSubtitles = async () => {
    if (!videoFile) return;
    
    setIsProcessing(true);
    try {
      const isVideoTooLarge = videoFile.size > 10 * 1024 * 1024; // > 10MB 
      if(isVideoTooLarge) {
          alert('Video is too large. Please upload videos under 10MB because of browser and API limits.');
          setIsProcessing(false);
          return;
      }
      
      const base64Data = await fileToBase64(videoFile);
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const prompt = "Transcribe the audio in this video snippet and return a JSON array of words. Every object in the array MUST have the properties 'word' (string), 'start' (start time in seconds as number), and 'end' (end time in seconds as number). Only output the valid JSON array without any markdown formatting around it.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            { text: prompt },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: videoFile.type
                }
            }
        ],
        config: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
      });
      
      let textResponse = response.text;
      // Strip markdown codeblocks if they exist
      if(textResponse.startsWith('```')) {
          textResponse = textResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
      }
      
      const jsonTranscript = JSON.parse(textResponse);
      setTranscript(jsonTranscript);
      alert('Subtitles extracted successfully! Play the video to see the magic.');
    } catch (err) {
      console.error(err);
      alert('Failed to extract subtitles (' + err.message + '). Make sure the video has clear speech and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || transcript.length === 0) return;
    const currentTime = videoRef.current.currentTime;
    
    // Find active subtitle
    let activeWord = null;
    let activeIndex = -1;
    for (let i = 0; i < transcript.length; i++) {
        if (currentTime >= transcript[i].start && currentTime <= transcript[i].end + 0.5) { // Added small buffer
            activeWord = transcript[i];
            activeIndex = i;
        } else if (currentTime < transcript[i].start) {
            break; // Since it's ordered by time, we can stop searching
        }
    }
    
    if (activeWord) {
        setCurrentSubtitle(activeWord.word);
        if (activeIndex > lastPlayedWordIndex.current) {
            // New word reached
            queueWordSign(activeWord.word);
            lastPlayedWordIndex.current = activeIndex;
        }
    } else {
        setCurrentSubtitle("");
    }
  };
  
  const handleSeek = () => {
      const currentTime = videoRef.current.currentTime;
      // Reset the queued animations when user seeks
      ref.animations = [];
      setCurrentSubtitle("");
      
      // Update lastPlayedWordIndex based on current time
      let newIndex = -1;
      for (let i = 0; i < transcript.length; i++) {
          if (currentTime >= transcript[i].start) {
              newIndex = i;
          } else {
              break;
          }
      }
      lastPlayedWordIndex.current = newIndex;
  };

  return (
    <div className='max-w-screen-2xl mx-auto px-4 py-8 mt-16'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        
        {/* Left Control Panel */}
        <div className='lg:col-span-3 space-y-6'>
          
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
             <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Video Upload</h3>
             <input 
                 type="file" 
                 accept="video/*" 
                 onChange={handleVideoUpload}
                 className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 mb-4'
             />
             <button
                 onClick={extractSubtitles}
                 disabled={!videoFile || isProcessing}
                 className={`w-full font-medium py-3 px-4 rounded-xl transition-colors ${!videoFile ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
             >
                 {isProcessing ? 'Processing AI Magic...' : 'Extract Subtitles'}
             </button>
          </div>

          {/* Avatar Selection */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Select Avatar</h3>
            <div className='grid grid-cols-2 gap-4'>
              <button 
                className={`py-3 rounded-xl border-2 font-medium transition-all ${bot === xbot ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`} 
                onClick={() => setBot(xbot)} 
              >
                Male
              </button>
              <button 
                className={`py-3 rounded-xl border-2 font-medium transition-all ${bot === ybot ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`} 
                onClick={() => setBot(ybot)} 
              >
                Female
              </button>
            </div>

            <div className='mt-6 space-y-4'>
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Sign Speed</label>
                  <span className='text-sm font-medium text-gray-900'>{Math.round(speed*100)/100}x</span>
                </div>
                <Slider
                  axis="x" xmin={0.05} xmax={0.50} xstep={0.01} x={speed} y={50} ymin={0} ymax={100} ystep={1}
                  onChange={({ x }) => setSpeed(x)}
                  styles={{ track: { width: '100%' }, active: { backgroundColor: '#f97316' }, thumb: { width: 16, height: 16 } }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Center: Video and Avatar Side by Side */}
        <div className='lg:col-span-9'>
          <div className='bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full'>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]'>
                <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    {videoUrl ? (
                         <video 
                             ref={videoRef}
                             src={videoUrl}
                             controls
                             className="w-full max-h-full"
                             onTimeUpdate={handleTimeUpdate}
                             onSeeked={handleSeek}
                         />
                    ) : (
                         <span className="text-gray-500">Upload a video to start</span>
                    )}
                    {currentSubtitle && (
                        <div className="absolute bottom-16 left-0 right-0 text-center">
                            <span className="bg-black bg-opacity-70 text-white font-medium px-4 py-2 rounded-lg text-lg">
                                {currentSubtitle}
                            </span>
                        </div>
                    )}
                </div>
                
                <div id='canvas-container' className='w-full rounded-xl overflow-hidden bg-gray-100 relative'>
                    {/* Canvas will be injected here */}
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                         <span className="bg-orange-500 text-white font-bold px-4 py-2 rounded-full uppercase tracking-wider text-sm shadow-lg">
                             Sign Translation
                         </span>
                    </div>
                </div>
            </div>
            
            <div className='mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-grow'>
              <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>Extracted Transcript ({transcript.length} words)</h3>
              <p className='text-sm leading-relaxed text-gray-600 max-h-32 overflow-y-auto'>
                {transcript.length > 0 ? transcript.map(t => t.word).join(" ") : <span className="italic text-gray-400">Waiting for video upload and subtitle extraction...</span>}
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProcessVideo;
