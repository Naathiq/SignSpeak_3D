import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Hand } from 'lucide-react';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to='/sign-kit/convert' className="flex-shrink-0 flex items-center">
                            <div className="bg-orange-500 text-white rounded-lg p-1.5 mr-3 flex items-center justify-center">
                                <Hand className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-xl tracking-tight text-gray-900">Sign Kit</span>
                        </Link>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <Link 
                            to='/sign-kit/dashboard' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/dashboard') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to='/sign-kit/convert' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/convert') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Convert
                        </Link>
                        <Link 
                            to='/sign-kit/live' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/live') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Live Mode
                        </Link>
                        <Link 
                            to='/sign-kit/learn-sign' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/learn-sign') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Learn Sign
                        </Link>
                        <Link 
                            to='/sign-kit/process-video' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/process-video') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Process Video
                        </Link>
                        <Link 
                            to='/sign-kit/class' 
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/sign-kit/class') ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                        >
                            Classrooms
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="sm:hidden border-t border-gray-200">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link 
                            to='/sign-kit/dashboard' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/dashboard') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to='/sign-kit/convert' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/convert') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Convert
                        </Link>
                        <Link 
                            to='/sign-kit/live' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/live') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Live Mode
                        </Link>
                        <Link 
                            to='/sign-kit/learn-sign' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/learn-sign') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Learn Sign
                        </Link>
                        <Link 
                            to='/sign-kit/process-video' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/process-video') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Process Video
                        </Link>
                        <Link 
                            to='/sign-kit/class' 
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/sign-kit/class') ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
                            onClick={() => setIsOpen(false)}
                        >
                            Classrooms
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;