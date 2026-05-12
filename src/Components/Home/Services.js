import React from "react";
import { Link } from "react-router-dom";
import { Repeat, GraduationCap, Video } from "lucide-react";

function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">Our Services</h2>
          <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full mb-8" />
          <p className="text-lg text-gray-600 leading-relaxed">
            A comprehensive and aesthetic Indian Sign Language toolkit. A
            minimalist yet informative interface. Wide range of features
            containing different functionalities that are necessary to work
            with ISL. Everything you need mapped out for you! <br className="hidden sm:block" /> Dive into our diverse services below.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-gray-50 rounded-3xl p-8 flex flex-col h-full border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Repeat className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Convert</h3>
            <p className="text-gray-600 mb-8 flex-grow">
              Want to convert audio or text into Indian Sign Language? Then, you are in the right place! Provide your audio by speaking into your mic or type the text that you want to convert into ISL and within a few clicks watch the magic happen!
            </p>
            <Link
              to="/sign-kit/convert"
              className="inline-flex justify-center items-center w-full bg-gray-900 text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
            >
              EXPLORE NOW
            </Link>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 flex flex-col h-full border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <GraduationCap className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Learn Sign</h3>
            <p className="text-gray-600 mb-8 flex-grow">
              Curious about Indian Sign Language? Then, learn ISL from us! Select a sign from the list, watch it as many times as you want and learn ISL. Learning something is always a good thing, you know!
            </p>
            <Link
              to="/sign-kit/learn-sign"
              className="inline-flex justify-center items-center w-full bg-gray-900 text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
            >
              EXPLORE NOW
            </Link>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 flex flex-col h-full border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Video className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Videos</h3>
            <p className="text-gray-600 mb-8 flex-grow">
              Interested in creating wonderful videos using Indian Sign Language? Upload your transcript as a text file, type your text in the provided area or speak through your mic and the system will automatically create a video using ISL for your content!
            </p>
            <Link
              to="/sign-kit/all-videos"
              className="inline-flex justify-center items-center w-full bg-gray-900 text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
            >
              EXPLORE NOW
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Services;
