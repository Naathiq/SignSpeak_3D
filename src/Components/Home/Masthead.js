import React from "react";
import { ArrowDown } from "lucide-react";

function Masthead() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden min-h-screen flex items-center justify-center bg-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 block">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-400 opacity-20 transform skew-y-6 scale-150 origin-top-left -z-10 blur-3xl"></div>
        </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
          Welcome to <span className="text-orange-500">Sign Kit</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
          The complete toolkit for Indian Sign Language. Explore our range of features which have been carefully designed keeping in mind the specific needs of people related to ISL.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="#intro"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-gray-900 bg-white hover:bg-orange-50 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Get Started
            <ArrowDown className="ml-2 -mr-1 h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Masthead;
