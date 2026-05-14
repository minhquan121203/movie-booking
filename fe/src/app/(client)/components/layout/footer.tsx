'use client'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Film } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border mt-12">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md">
                <Film className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold bg-gradient-to-r from-violet-500 to-violet-300 bg-clip-text text-transparent">
                CineBooking
              </h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nền tảng đặt vé xem phim trực tuyến hàng đầu Việt Nam. Trải nghiệm đặt vé nhanh chóng, tiện lợi và an toàn.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Youtube, href: '#', label: 'Youtube' },
                { icon: Twitter, href: '#', label: 'Twitter' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-violet-600 flex items-center justify-center text-muted-foreground hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-md hover:shadow-violet-500/20"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h5 className="font-semibold text-foreground text-sm uppercase tracking-wider">Khám phá</h5>
            <ul className="space-y-2.5">
              {[
                { label: 'Phim đang chiếu', href: '/movies' },
                { label: 'Phim sắp chiếu', href: '/movies' },
                { label: 'Lịch chiếu', href: '/showtimes' },
                { label: 'Khuyến mãi', href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-violet-500/0 group-hover:bg-violet-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h5 className="font-semibold text-foreground text-sm uppercase tracking-wider">Hỗ trợ</h5>
            <ul className="space-y-2.5">
              {[
                { label: 'Trung tâm hỗ trợ', href: '#' },
                { label: 'Điều khoản sử dụng', href: '#' },
                { label: 'Chính sách bảo mật', href: '#' },
                { label: 'FAQ', href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-violet-500 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-violet-500/0 group-hover:bg-violet-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h5 className="font-semibold text-foreground text-sm uppercase tracking-wider">Liên hệ</h5>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <span>Tầng 5, Tòa nhà CineBooking, 123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-violet-500 shrink-0" />
                <span>1900 6868</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                <span>support@cinebooking.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
          <p className="text-xs text-muted-foreground">
            © 2025 CineBooking. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ in Vietnam
          </p>
        </div>
      </div>
    </footer>
  )
}
