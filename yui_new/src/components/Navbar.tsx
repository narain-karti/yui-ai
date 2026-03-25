import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = ['Home', 'Problems', 'Solutions', 'Impact', 'Moats', 'Investment'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="container-custom mx-auto">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-display font-bold tracking-tighter">
              Yui AI<span className="text-accent">.</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {links.map((link) => (
                <Link
                  key={link}
                  to={location.pathname === '/' ? `#${link.toLowerCase()}` : `/#${link.toLowerCase()}`}
                  className="text-secondary hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link}
                </Link>
              ))}
              <Link
                to="/plan"
                className={`transition-colors px-3 py-2 rounded-md text-sm font-medium relative ${
                  location.pathname === '/plan' ? 'text-accent' : 'text-secondary hover:text-primary'
                }`}
              >
                Plan Your Journey
                {location.pathname === '/plan' && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-bg bg-primary hover:bg-white transition-colors"
            >
              Let's Talk
            </a>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-primary hover:bg-surface focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-surface border-b border-white/5"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-secondary hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
