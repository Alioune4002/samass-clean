'use client';

import Link from 'next/link';
import { FaWhatsapp, FaFacebookF, FaBars, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      setCartCount(savedCart ? JSON.parse(savedCart).length : 0);
    };
    updateCartCount(); 
    window.addEventListener('storage', updateCartCount); 
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  return (
    <nav className="bg-emerald-800 text-white p-2 sm:p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">🌿SAMASS🍂</h1>
        <div className="sm:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-2xl">
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <div className={`sm:flex ${isMenuOpen ? 'block' : 'hidden'} w-full sm:w-auto`}>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 mt-2 sm:mt-0">
            <Link href="/" className="hover:text-emerald-200 text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link href="/shop" className="hover:text-emerald-200 text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>Boutique</Link>
            <Link href="/contact" className="hover:text-emerald-200 text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            {/* <Link href="/cart" className="hover:text-emerald-200 text-sm sm:text-base" onClick={() => setIsMenuOpen(false)}>Panier ({cartCount})</Link> */}
          </div>
        </div>
      </div>
    </nav>
  );
}
