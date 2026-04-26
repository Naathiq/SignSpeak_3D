import '../App.css'
import axios from 'axios';
import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom'
import Slider from 'react-input-slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

const xbot = '/Models/xbot/xbot.glb';
const ybot = '/Models/ybot/ybot.glb';
const xbotPic = '/Models/xbot/xbot.png';
const ybotPic = '/Models/ybot/ybot.png';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Button, Modal } from "react-bootstrap";

import { baseURL } from '../Config/config'


function Video() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [invalidId, setInvalidId] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBot(url);
    }
  };

  const params = useParams()

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  let id = React.createRef();

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

    ref.camera = new THREE.PerspectiveCamera(
        30,
        (window.innerWidth * 0.57) / Math.max(400, window.innerHeight - 70),
        0.1,
        1000
    )

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
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

    id.current.value=params.videoId

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

  const sign = (str) => {
    str = str.toUpperCase();
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

  const animateFromID = () => {
      const videoID = id.current.value;
      axios.get(`${baseURL}/videos/${videoID}`).then((res) => {
        console.log(res.data)
        setTitle(res.data.title)
        setDesc(res.data.desc)
        sign(res.data.content);
      }).catch(err => {
        console.log(err)
        setInvalidId(true)
      });
  }

  return (
    <div className='max-w-screen-2xl mx-auto px-4 py-8 mt-16'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        
        {/* Left Side: Video Info */}
        <div className='lg:col-span-3 space-y-6'>
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Fetch Video</h3>
            <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block'>
              Video ID
            </label>
            <input 
              ref={id} 
              placeholder='Enter Video ID...' 
              className='w-full p-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none' 
            />
            <button 
              onClick={animateFromID} 
              className='w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-4'
            >
              Start Video
            </button>
            <div className='border-t border-gray-100 my-4'></div>
            {title && (
              <div className='mt-4 flex flex-col items-center justify-center text-center'>
                <h4 className='text-lg font-bold text-gray-900'>{title}</h4>
                <p className='text-sm text-gray-600 mt-1'>{desc}</p>
                
                <div className='w-full mt-6 text-left'>
                  <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block'>
                    Processed Text
                  </label>
                  <textarea 
                    rows={10} 
                    value={text} 
                    className='w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none' 
                    readOnly 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className='lg:col-span-6'>
          <div className='bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full'>
            <div id='canvas' className='w-full rounded-xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[600px] flex items-center justify-center bg-gray-100'>
              {/* Canvas will be injected here */}
            </div>
            
            <div className='mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-grow'>
              <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>Video Playback Active</h3>
              <p className='text-sm text-gray-600 italic'>
                The avatar will sign the contents of the chosen video ID.
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-2">
              Tip: Drag to rotate, scroll to zoom, right-click to pan.
            </p>
          </div>
        </div>

        {/* Right Settings Panel */}
        <div className='lg:col-span-3 space-y-6'>
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Select Avatar</h3>
            <div className='grid grid-cols-2 gap-4'>
              <img 
                src={xbotPic} 
                className={`bot-image w-full ${bot === xbot ? 'border-orange-500 shadow-md' : ''}`} 
                onClick={() => setBot(xbot)} 
                alt='Avatar 1: XBOT'
              />
              <img 
                src={ybotPic} 
                className={`bot-image w-full ${bot === ybot ? 'border-orange-500 shadow-md' : ''}`} 
                onClick={() => setBot(ybot)} 
                alt='Avatar 2: YBOT'
              />
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
        </div>

      </div>

      {invalidId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Invalid Video ID</h3>
            <p className="text-gray-600 mb-6">Please make sure that the video ID that you have entered is valid!</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setInvalidId(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Video;