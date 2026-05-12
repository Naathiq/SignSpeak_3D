import React from "react";

function Intro() {
  return (
    <section id="intro" className="py-24 bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Everything You Need, In One Place
        </h2>
        <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full mt-6 mb-8" />
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
          A comprehensive and aesthetic Indian Sign Language toolkit. Enjoy a
          minimalist yet deeply immersive interface with a wide range of features
          containing all functionalities that are necessary to work with ISL. Dive into our diverse services and elevate your experience!
        </p>
      </div>
    </section>
  );
}

export default Intro;
