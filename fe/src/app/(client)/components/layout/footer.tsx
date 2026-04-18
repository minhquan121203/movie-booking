'use client'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-bg-primary to-bg-secondary border-t border-border py-12 mt-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <h4 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CineBooking
          </h4>

          {/* Social Icons */}
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 hover:opacity-80"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 hover:opacity-80"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 hover:opacity-80"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 hover:opacity-80"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-text-secondary">
            <a href="#" className="hover:text-primary transition-colors hover:opacity-80">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors hover:opacity-80">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors hover:opacity-80">
              Contact Us
            </a>
            <a href="#" className="hover:text-primary transition-colors hover:opacity-80">
              Help Center
            </a>
          </div>

          {/* Copyright */}
          <p className="text-text-secondary">© 2025 CineBooking. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
