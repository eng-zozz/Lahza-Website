import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Building intelligent systems that move businesses forward — AI automation,
            chatbots, and custom platforms.
          </p>
          <ul className="space-y-2 pt-2 text-sm text-muted-foreground">
            <li>
              <a href={BRAND.phoneHref} dir="ltr" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4 text-primary" /> {BRAND.phone}
              </a>
            </li>
            <li>
              <a href={BRAND.emailHref} className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4 text-primary" /> {BRAND.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {BRAND.location}
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/case-studies" className="hover:text-foreground">Case Studies</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND.name} — All rights reserved.
      </div>
    </footer>
  );
}
