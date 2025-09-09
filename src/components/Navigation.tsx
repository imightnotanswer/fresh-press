"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthButton from "./AuthButton";

export default function Navigation() {
    const { data: session, status } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const pathname = usePathname();

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Define admin users (you can add more email addresses here)
    const adminEmails = [
        "admin@freshlypressed.com", // Add your admin email here
        // Add more admin emails as needed
        "imightnotanswer@gmail.com"
    ];

    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    // Handle scroll detection with hysteresis to avoid flicker
    useEffect(() => {
        const SHOW_AT = 120; // show compact state after this
        const HIDE_AT = 60;  // return to expanded below this

        let ticking = false;
        const update = () => {
            const y = window.scrollY;
            setIsScrolled(prev => (prev ? y > HIDE_AT : y > SHOW_AT));
            ticking = false;
        };

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        };

        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        // Set initial mobile state
        handleResize();

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Close mobile menu when scrolling (only on desktop)
    useEffect(() => {
        if (isScrolled && !isMobile) {
            setIsMobileMenuOpen(false);
        }
    }, [isScrolled, isMobile]);

    // Edge case: if user scrolls back to the very top while the menu is open,
    // ensure the hamburger menu closes and layout recenters
    useEffect(() => {
        if (!isScrolled) {
            setIsMobileMenuOpen(false);
        }
    }, [isScrolled]);

    // Don't render until client-side
    if (!isClient) {
        return (
            <header className="cutting-edge-header">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center h-20 sm:h-24 lg:h-28 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                        <div className="w-10"></div>
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <div className="brand-scaler">
                                <Link href="/" className="cutting-edge-brand">
                                    Fresh Press
                                </Link>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center space-x-6 ml-auto">
                            <Link href="/newsletter" className="cutting-edge-nav">
                                Newsletter
                            </Link>
                            <div className="text-white text-sm font-medium uppercase tracking-wider">
                                Loading...
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className={`cutting-edge-header ${isScrolled && !isMobile ? 'scrolled' : ''} ${isMobile ? 'fixed top-0 left-0 right-0 w-full' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Header - Brand and Actions */}
                <div className={`relative flex justify-between items-center z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? 'h-12 sm:h-14 lg:h-20' : 'h-24 sm:h-28 lg:h-32'}`}>
                    {/* Left side - Hamburger menu (always visible on mobile, only when scrolled on desktop) */}
                    <div className={`${isMobile ? 'block' : (isScrolled ? 'block' : 'hidden')} w-10`}>
                        <button
                            className="text-white p-2 cursor-pointer hover:opacity-80 transition-opacity duration-150"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Center - Brand Logo */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <div className="brand-scaler">
                            <Link href="/" className="cutting-edge-brand">
                                Fresh Press
                            </Link>
                        </div>
                    </div>

                    {/* Right side actions - Desktop */}
                    <div className="hidden sm:flex items-center space-x-6 ml-auto">
                        <Link
                            href="/newsletter"
                            className="cutting-edge-nav"
                        >
                            Newsletter
                        </Link>
                        <AuthButton />
                    </div>

                    {/* Right side actions - Mobile avatar */}
                    <div className="flex sm:hidden items-center ml-auto">
                        <AuthButton />
                    </div>
                </div>

                {/* Bottom Header - Main Navigation collapses when scrolled */}
                <div className={`${isMobile ? 'hidden' : 'block'} transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-10 opacity-100'} origin-top`}>
                    <nav className="flex items-center justify-center h-12 px-2 space-x-8">
                        <Link
                            href="/reviews"
                            className={`cutting-edge-nav ${pathname.startsWith('/reviews') ? 'cutting-edge-nav-active' : ''}`}
                        >
                            Reviews
                        </Link>
                        <Link
                            href="/media"
                            className={`cutting-edge-nav ${pathname.startsWith('/media') ? 'cutting-edge-nav-active' : ''}`}
                        >
                            Media
                        </Link>
                        <Link
                            href="/contact"
                            className={`cutting-edge-nav ${pathname.startsWith('/contact') ? 'cutting-edge-nav-active' : ''}`}
                        >
                            Contact
                        </Link>
                    </nav>
                </div>

                {/* Mobile Menu Dropdown - Shows when hamburger is clicked */}
                <div className={`absolute top-full left-0 w-auto min-w-48 bg-black rounded-b-lg shadow-xl transition-all duration-300 z-30 -mt-px ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                    <nav className="flex flex-col py-2">
                        {isMobile && (
                            <Link
                                href="/newsletter"
                                className={`mobile-nav-item text-white text-sm font-medium uppercase tracking-wider transition-all duration-200 px-4 py-2 hover:bg-gray-800 mx-1 ${pathname.startsWith('/newsletter') ? 'text-gray-300 bg-gray-800' : ''}`}
                                style={{ position: 'relative' }}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Newsletter
                            </Link>
                        )}
                        <Link
                            href="/reviews"
                            className={`mobile-nav-item text-white text-sm font-medium uppercase tracking-wider transition-all duration-200 px-4 py-2 hover:bg-gray-800 mx-1 ${pathname.startsWith('/reviews') ? 'text-gray-300 bg-gray-800' : ''}`}
                            style={{ position: 'relative' }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Reviews
                        </Link>
                        <Link
                            href="/media"
                            className={`mobile-nav-item text-white text-sm font-medium uppercase tracking-wider transition-all duration-200 px-4 py-2 hover:bg-gray-800 mx-1 ${pathname.startsWith('/media') ? 'text-gray-300 bg-gray-800' : ''}`}
                            style={{ position: 'relative' }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Media
                        </Link>
                        <Link
                            href="/contact"
                            className={`mobile-nav-item text-white text-sm font-medium uppercase tracking-wider transition-all duration-200 px-4 py-2 hover:bg-gray-800 mx-1 ${pathname.startsWith('/contact') ? 'text-gray-300 bg-gray-800' : ''}`}
                            style={{ position: 'relative' }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        {isMobile && (
                            <div className="border-t border-gray-700 my-2"></div>
                        )}
                        {isMobile && (
                            <div className="px-4 py-2">
                                <AuthButton />
                            </div>
                        )}
                    </nav>
                </div>

                {/* Backdrop overlay when mobile menu is open */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-20"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </div>
        </header>
    );
}

// Spacer for fixed mobile header to avoid content jump
// Rendered only on client via Navigation parent usage
// (Removed MobileHeaderSpacer to avoid extra layout/compile issues)
