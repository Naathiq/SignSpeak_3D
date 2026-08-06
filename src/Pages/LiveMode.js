import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../../Model/xbot.glb';
import ybot from '../../Model/ybot.glb';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function LiveMode() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed] = useState(0.15); // A bit faster for live
  const [pause] = useState(400); // Shorter pause for live

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  const {
    finalTranscript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [lastProcessedLength, setLastProcessedLength] = useState(0);

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
    ref.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ref.renderer.setClearColor(0x000000, 0); // transparent background if needed

    ref.camera = new THREE.PerspectiveCamera(
        30,
        1, // We'll update aspect ratio dynamically
        0.1,
        1000
    )

    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) {
      canvasContainer.innerHTML = "";
      canvasContainer.appendChild(ref.renderer.domElement);
      // set initial size
      ref.camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
      ref.camera.updateProjectionMatrix();
      ref.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
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
          if ( child.type === 'SkinnedMesh' ) {
            child.frustumCulled = false;
          }
        });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
        ref.renderer.render(ref.scene, ref.camera);
      },
      (xhr) => {
      },
      (error) => {
        console.error('An error happened loading the model:', error);
      }
    );

    // Auto-start listening in live mode
    SpeechRecognition.startListening({continuous: true});

    return () => {
      SpeechRecognition.stopListening();
    }

  }, [ref, bot]);

  ref.animate = () => {
    if(ref.animations.length === 0){
        ref.pending = false;
      return ;
    }
    requestAnimationFrame(ref.animate);
    if(ref.animations[0].length){
        if(!ref.flag) {
          if(ref.animations[0][0]==='add-text'){
            setText(prev => prev + ref.animations[0][1]);
            ref.animations.shift();
          }
          else{
            for(let i=0;i<ref.animations[0].length;){
              let [boneName, action, axis, limit, sign] = ref.animations[0][i]
              const bone = ref.avatar.getObjectByName(boneName);
              if (!bone) { i++; continue; }
              if(sign === "+" && bone[action][axis] < limit){
                  bone[action][axis] += speed;
                  bone[action][axis] = Math.min(bone[action][axis], limit);
                  i++;
              }
              else if(sign === "-" && bone[action][axis] > limit){
                  bone[action][axis] -= speed;
                  bone[action][axis] = Math.max(bone[action][axis], limit);
                  i++;
              }
              else{
                  ref.animations[0].splice(i, 1);
              }
            }
          }
        }
    }
    else {
      ref.flag = true;
      setTimeout(() => {
        ref.flag = false
      }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  }

  const signWord = (word) => {
    if (!word) return;
    const str = word.toUpperCase();
    if(words[str]){
      ref.animations.push(['add-text', str+' ']);
      words[str](ref);
    }
    else{
      for(const [index, ch] of str.split('').entries()){
        if(index === str.length-1)
          ref.animations.push(['add-text', ch+' ']);
        else 
          ref.animations.push(['add-text', ch]);
        
        if (alphabets[ch]) {
          alphabets[ch](ref);
        }
      }
    }
    
    if(!ref.pending) {
      ref.pending = true;
      ref.animate();
    }
  }

  // Process new words as they are confirmed
  useEffect(() => {
    if (finalTranscript.length > lastProcessedLength) {
      const newText = finalTranscript.substring(lastProcessedLength).trim();
      if (newText) {
        const strWords = newText.split(' ');
        for(let word of strWords){
           signWord(word);
        }
      }
      setLastProcessedLength(finalTranscript.length);
    }
  }, [finalTranscript, lastProcessedLength]);

  const startListening = () =>{
    SpeechRecognition.startListening({continuous: true});
  }

  const stopListening = () =>{
    SpeechRecognition.stopListening();
  }

  const handleReset = () => {
    resetTranscript();
    setLastProcessedLength(0);
    setText("");
    ref.animations = [];
    defaultPose(ref);
  }

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      if(ref.camera && ref.renderer && document.getElementById("canvas-container")) {
        const container = document.getElementById("canvas-container");
        ref.camera.aspect = container.clientWidth / container.clientHeight;
        ref.camera.updateProjectionMatrix();
        ref.renderer.setSize(container.clientWidth, container.clientHeight);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='max-w-screen-2xl mx-auto px-4 py-8 mt-16 w-full flex flex-col h-[calc(100vh-100px)]'>
      <div className='flex flex-wrap gap-4 justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Live Mode</h1>
          <p className='text-gray-500 mt-1'>Talk normally, and the avatar will sign in real-time.</p>
        </div>
        
        <div className='flex flex-wrap items-center gap-3'>
          {!SpeechRecognition.browserSupportsSpeechRecognition() && (
            <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
              Browser not supported
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${listening ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-800'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${listening ? 'bg-orange-500 animate-[pulse_1s_infinite]' : 'bg-gray-500'}`}></span>
            {listening ? 'Listening...' : 'Paused'}
          </span>
          <button 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm ${listening ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-orange-500 text-white hover:bg-orange-600'}`} 
            onClick={listening ? stopListening : startListening}
          >
            {listening ? 'Pause' : 'Start'}
          </button>
          <button 
            className='px-4 py-2 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm' 
            onClick={handleReset}
          >
            Clear
          </button>
        </div>
      </div>

      <div className='flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0'>
        {/* Main Avatar Area */}
        <div className='lg:col-span-3 bg-gray-100 rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative'>
          
          <div id='canvas-container' className='flex-grow w-full h-full cursor-grab active:cursor-grabbing'>
            {/* Canvas injected here */}
          </div>
          
          {/* Subtitles Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-3/4 flex flex-col items-center pointer-events-none max-h-32 overflow-hidden">
            {interimTranscript && (
              <div className="text-lg md:text-2xl font-medium text-white bg-black/60 px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl text-center mb-2 pointer-events-auto">
                <span className="opacity-80">{finalTranscript.length > 80 ? '...' + finalTranscript.slice(-80) : finalTranscript}</span>
                <span className="text-orange-400"> {interimTranscript}</span>
              </div>
            )}
            {!interimTranscript && finalTranscript && (
              <div className="text-lg md:text-2xl font-medium text-white bg-black/60 px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl text-center pointer-events-auto">
                {finalTranscript.length > 80 ? '...' + finalTranscript.slice(-80) : finalTranscript}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className='lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6'>
          <div className='bg-white p-6 rounded-3xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Avatar</h3>
            <div className='grid grid-cols-2 gap-3 mb-6'>
              <button 
                className={`py-3 rounded-xl border-2 font-medium text-sm transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${bot === xbot ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`} 
                onClick={() => setBot(xbot)} 
              >
                Male
              </button>
              <button 
                className={`py-3 rounded-xl border-2 font-medium text-sm transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${bot === ybot ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`} 
                onClick={() => setBot(ybot)} 
              >
                Female
              </button>
            </div>

            <div className="mt-4 mb-6">
               <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2'>Custom Avatar (.glb)</label>
               <input 
                 type="file" 
                 accept=".glb,.gltf" 
                 onChange={(e) => {
                     const file = e.target.files[0];
                     if (file) {
                         setBot(URL.createObjectURL(file));
                     }
                 }}
                 className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100'
               />
            </div>
            
            <div className='space-y-4'>
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                  <i className="fa fa-tachometer mr-2 opacity-75"></i>
                  The animation speed is optimized for real-time speech.
                </p>
              </div>
            </div>
          </div>
          
          <div className='bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-grow flex flex-col min-h-[200px]'>
            <div className="flex items-center justify-between mb-4">
              <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider'>Transcript Log</h3>
            </div>
            <div className="flex-grow bg-gray-50 rounded-2xl p-5 border border-gray-100 overflow-y-auto font-mono text-sm text-gray-700 leading-relaxed shadow-inner">
              {finalTranscript ? finalTranscript : <span className="text-gray-400 italic">Waiting for speech...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMode;
