'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Settings,
  Share2,
  LogOut,
  Zap,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export function AcornBadgeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <div className={`rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-1 flex items-center justify-center shadow-xs shrink-0 ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
        <path d="M12 2C10.5 2 9 3 9 4.5C9 5.2 9.3 5.8 9.8 6.2C6.5 7.1 4 10.2 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 10.2 17.5 7.1 14.2 6.2C14.7 5.8 15 5.2 15 4.5C15 3 13.5 2 12 2ZM12 8C15.3 8 18 10.7 18 14C18 17.3 15.3 20 12 20C6.4 20 6 17.3 6 14C6 10.7 8.7 8 12 8Z" />
      </svg>
    </div>
  );
}

export function ScenicLandscapeIllustration({ className = 'w-full h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path d="M0 50 L0 25 Q75 5 150 20 T300 10 L300 50 Z" fill="#bbf7d0" opacity="0.6" />
      <path d="M0 50 L0 30 Q100 10 200 28 T300 15 L300 50 Z" fill="#86efac" opacity="0.8" />
      <path d="M0 50 L0 36 Q80 20 180 34 T300 24 L300 50 Z" fill="#22c55e" />
      <circle cx="220" cy="32" r="3" fill="#15803d" />
      <rect x="219.5" y="35" width="1" height="3" fill="#78350f" />
      <circle cx="75" cy="30" r="2.5" fill="#166534" />
      <rect x="74.5" y="32.5" width="1" height="2.5" fill="#78350f" />
      <path d="M125 28 L129 21 L129 28 Z" fill="#ffffff" />
      <path d="M122 29 L132 29 L130 31 L124 31 Z" fill="#0284c7" />
    </svg>
  );
}

interface CRMUserPopoverProps {
  onOpenInbox?: () => void;
}

export default function CRMUserPopover({ onOpenInbox }: CRMUserPopoverProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [availableForChats, setAvailableForChats] = useState(false);
  const [open, setOpen] = useState(false);

  const userName = user?.name || 'Felipe';
  const userEmail = user?.email || 'felipe-admin@avaliasolar.com.br';
  const firstInitial = userName.trim().charAt(0).toUpperCase() || 'F';

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#c2410c] text-white font-bold text-xs ring-2 ring-slate-700/80 hover:ring-orange-500 transition-all focus:outline-none select-none cursor-pointer"
          title={`${userName} (${userEmail})`}
        >
          <span>{firstInitial}</span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-[#0c1a30]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden font-sans text-slate-800 z-[2000] animate-in fade-in-80 zoom-in-95 duration-150"
      >
        {/* Profile Header */}
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#c2410c] text-white font-bold text-sm shrink-0">
            <span>{firstInitial}</span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate leading-tight">{userName}</h4>
            <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">{userEmail}</p>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Website Chats Toggle */}
        <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
          <span className="text-xs font-medium text-slate-700">Available for website chats</span>
          <button
            type="button"
            role="switch"
            aria-checked={availableForChats}
            onClick={() => setAvailableForChats(!availableForChats)}
            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer focus:outline-none ${
              availableForChats ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                availableForChats ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Navigation Action Links */}
        <div className="py-1">
          <Link
            href="/dashboard/sales/emails"
            onClick={() => {
              setOpen(false);
              onOpenInbox?.();
            }}
            className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Your inbox</span>
          </Link>

          <Link
            href="/dashboard/sales/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Your settings</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              alert('Copied referral code to clipboard!');
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>Refer a friend</span>
          </button>
        </div>

        {/* Trial Status Card Banner */}
        <div className="mx-3 my-2 p-3.5 bg-[#edf7ff] border border-sky-150 rounded-xl relative overflow-hidden text-slate-900 shadow-xs">
          <div className="flex items-start gap-3 relative z-10">
            <AcornBadgeIcon className="w-7 h-7 text-white" />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-slate-900 leading-tight">13 days left in your trial</h5>
              <p className="text-[11px] text-slate-600 leading-snug mt-1">
                Explore plans and find the best fit for your team before your trial ends.
              </p>
              <Link
                href="/dashboard/sales/settings/billing"
                onClick={() => setOpen(false)}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-sky-600 text-sky-600" />
                <span>Upgrade</span>
              </Link>
            </div>
          </div>

          {/* Bottom Landscape Graphic */}
          <div className="mt-2 -mx-3.5 -mb-3.5">
            <ScenicLandscapeIllustration className="w-full h-10" />
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Footer Logout Action */}
        <div className="p-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50/60 rounded-b-xl transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
            <span>Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
