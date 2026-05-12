import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function Convert() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBot(url);
    }
  };

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  let textFromAudio = React.createRef();
  let textFromInput = React.createRef();

  const {
    transcript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

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

    ref.camera = new THREE.PerspectiveCamera(
        30,
        (window.innerWidth * 0.57) / Math.max(400, window.innerHeight - 70),
        0.1,
        1000
    )
    ref.renderer.setSize(window.innerWidth * 0.57, Math.max(400, window.innerHeight - 70));

    document.getElementById("canvas").innerHTML = "";
    document.getElementById("canvas").appendChild(ref.renderer.domElement);

    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;

    ref.controls = new OrbitControls(ref.camera, ref.renderer.domElement);
    ref.controls.target.set(0, 1.4, 0);
    ref.controls.addEventListener('change', () => {
        ref.renderer.render(ref.scene, ref.camera);
    });

    let loader = new GLTFLoader();
    console.log('Loading bot model from URL:', bot);
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
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened loading the model:', error);
      }
    );

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
            setText(text + ref.animations[0][1]);
            ref.animations.shift();
          }
          else{
            for(let i=0;i<ref.animations[0].length;){
              let [boneName, action, axis, limit, sign] = ref.animations[0][i]
              if(sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit){
                  ref.avatar.getObjectByName(boneName)[action][axis] += speed;
                  ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                  i++;
              }
              else if(sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit){
                  ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
                  ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
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

  const sign = (inputRef) => {
    
    var str = inputRef.current.value.toUpperCase();
    var strWords = str.split(' ');
    setText('')

    for(let word of strWords){
      if(words[word]){
        ref.animations.push(['add-text', word+' ']);
        words[word](ref);
        
      }
      else{
        for(const [index, ch] of word.split('').entries()){
          if(index === word.length-1)
            ref.animations.push(['add-text', ch+' ']);
          else 
            ref.animations.push(['add-text', ch]);
          alphabets[ch](ref);
          
        }
      }
    }
  }

  const startListening = () =>{
    SpeechRecognition.startListening({continuous: true});
  }

  const stopListening = () =>{
    SpeechRecognition.stopListening();
  }

  return (
    <div className='max-w-screen-2xl mx-auto px-4 py-8 mt-16'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        
        {/* Left Control Panel */}
        <div className='lg:col-span-3 space-y-6'>
          
          {/* Avatar Selection */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Select Avatar</h3>
            <div className='grid grid-cols-2 gap-4'>
              <button 
                className={`py-3 rounded-xl border-2 font-medium transition-all ${bot === xbot ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`} 
                onClick={() => setBot(xbot)} 
              >
                Male Avatar
              </button>
              <button 
                className={`py-3 rounded-xl border-2 font-medium transition-all ${bot === ybot ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`} 
                onClick={() => setBot(ybot)} 
              >
                Female Avatar
              </button>
            </div>
            
            <div className='mt-4'>
              <label className='block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2'>
                Or Upload Custom (.glb)
              </label>
              <input 
                type="file" 
                accept=".glb" 
                onChange={handleAvatarUpload}
                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100'
              />
            </div>

            <div className='mt-6 space-y-4'>
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Speed</label>
                  <span className='text-sm font-medium text-gray-900'>{Math.round(speed*100)/100}x</span>
                </div>
                <Slider
                  axis="x" xmin={0.05} xmax={0.50} xstep={0.01} x={speed} y={50} ymin={0} ymax={100} ystep={1}
                  onChange={({ x }) => setSpeed(x)}
                  styles={{ track: { width: '100%' }, active: { backgroundColor: '#f97316' }, thumb: { width: 16, height: 16 } }}
                />
              </div>
              
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Pause</label>
                  <span className='text-sm font-medium text-gray-900'>{pause}ms</span>
                </div>
                <Slider
                  axis="x" xmin={0} xmax={2000} xstep={100} x={pause} y={50} ymin={0} ymax={100} ystep={1}
                  onChange={({ x }) => setPause(x)}
                  styles={{ track: { width: '100%' }, active: { backgroundColor: '#f97316' }, thumb: { width: 16, height: 16 } }}
                />
              </div>
            </div>
          </div>

          {/* Text Input Panel */}
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Input Text</h3>
            <textarea 
              rows={3} 
              ref={textFromInput} 
              placeholder='Type here to convert to sign language...' 
              className='w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none' 
            />
            <button 
              onClick={() => sign(textFromInput)} 
              className='w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors hidden sm:block'
            >
              Translate Text
            </button>
            <button 
              onClick={() => sign(textFromInput)} 
              className='w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors sm:hidden'
            >
              Translate
            </button>
          </div>

        </div>

        {/* Center Canvas */}
        <div className='lg:col-span-6'>
          <div className='bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full'>
            <div id='canvas' className='w-full rounded-xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[600px] flex items-center justify-center bg-gray-100'>
              {/* Canvas will be injected here */}
            </div>
            
            <div className='mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-grow'>
              <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>Currently Signing</h3>
              <p className='text-lg font-medium text-gray-900 min-h-[4rem]'>
                {text || <span className="text-gray-400 italic">Waiting for input...</span>}
              </p>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-2">
              Tip: Drag to rotate, scroll to zoom, right-click to pan.
            </p>
          </div>
        </div>

        {/* Right Voice Panel */}
        <div className='lg:col-span-3 space-y-6'>
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider'>Voice Input</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {listening ? 'Listening...' : 'Off'}
              </span>
            </div>
            {!SpeechRecognition.browserSupportsSpeechRecognition() && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                Your browser does not support speech recognition. Please try opening this app in a new tab using Chrome.
              </div>
            )}
            
            <div className='grid grid-cols-3 gap-2 mb-4'>
              <button 
                className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${listening ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
                onClick={startListening}
              >
                Start
              </button>
              <button 
                className='py-2 px-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors' 
                onClick={stopListening}
              >
                Stop
              </button>
              <button 
                className='py-2 px-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors' 
                onClick={resetTranscript}
              >
                Clear
              </button>
            </div>
            
            <textarea 
              readOnly 
              rows={4} 
              ref={textFromAudio} 
              value={transcript} 
              placeholder='Speak into your microphone...' 
              className='w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none' 
            />
            <button 
              onClick={() => sign(textFromAudio)} 
              className='w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors'
            >
              Translate Voice
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Convert;