import React from 'react';

interface KvellLogoProps {
  variant?: 'full' | 'compact' | 'crest-only' | 'horizontal-sm' | 'print';
  className?: string;
  theme?: 'dark' | 'light';
}

export const KvellLogo: React.FC<KvellLogoProps> = ({
  variant = 'full',
  className = '',
  theme = 'light',
}) => {
  // SVG Vector Crest of Karpaga Vinayaga / KVELL
  const CrestSVG = ({ size = 44 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm"
    >
      {/* Outer Golden Laurel Ring */}
      <circle cx="80" cy="80" r="74" fill="#ffffff" stroke="#c59b27" strokeWidth="4" />
      <circle cx="80" cy="80" r="68" fill="#f8fafc" stroke="#1e3a8a" strokeWidth="1.5" />

      {/* Top Banner Arch text area */}
      <path
        d="M 28 80 A 52 52 0 0 1 132 80"
        stroke="#1e3a8a"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />

      {/* Center Shield */}
      <path
        d="M 54 44 Q 80 40 106 44 Q 106 78 80 114 Q 54 78 54 44 Z"
        fill="#0f2648"
        stroke="#c59b27"
        strokeWidth="3"
      />

      {/* 5 Stars inside Shield */}
      <g fill="#f59e0b">
        <polygon points="80,48 81.5,52 85.5,52 82.5,54.5 83.5,58.5 80,56 76.5,58.5 77.5,54.5 74.5,52 78.5,52" transform="scale(0.7) translate(34, 18)" />
        <polygon points="80,48 81.5,52 85.5,52 82.5,54.5 83.5,58.5 80,56 76.5,58.5 77.5,54.5 74.5,52 78.5,52" transform="scale(0.6) translate(40, 26)" />
        <polygon points="80,48 81.5,52 85.5,52 82.5,54.5 83.5,58.5 80,56 76.5,58.5 77.5,54.5 74.5,52 78.5,52" transform="scale(0.6) translate(67, 26)" />
        <polygon points="80,48 81.5,52 85.5,52 82.5,54.5 83.5,58.5 80,56 76.5,58.5 77.5,54.5 74.5,52 78.5,52" transform="scale(0.5) translate(48, 38)" />
        <polygon points="80,48 81.5,52 85.5,52 82.5,54.5 83.5,58.5 80,56 76.5,58.5 77.5,54.5 74.5,52 78.5,52" transform="scale(0.5) translate(92, 38)" />
      </g>

      {/* KVELL Typography inside Shield */}
      <text
        x="80"
        y="67"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="13"
        letterSpacing="0.8"
      >
        KVELL
      </text>

      {/* Banner beneath KVELL */}
      <rect x="62" y="71" width="36" height="5.5" rx="1.5" fill="#f59e0b" />
      <text
        x="80"
        y="75"
        textAnchor="middle"
        fill="#0f2648"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="3.2"
        letterSpacing="0.2"
      >
        EDUCATIONAL LORE FOR LEARNING
      </text>

      {/* Open Book symbol inside shield */}
      <path
        d="M 68 83 Q 74 81 80 84 Q 86 81 92 83 L 92 92 Q 86 90 80 93 Q 74 90 68 92 Z"
        fill="#f8fafc"
        stroke="#c59b27"
        strokeWidth="1.2"
      />
      <line x1="80" y1="84" x2="80" y2="93" stroke="#c59b27" strokeWidth="1" />

      {/* Discipline Segments in surrounding wreath */}
      {/* Medicine (Green - Caduceus) */}
      <circle cx="36" cy="68" r="14" fill="#065f46" stroke="#c59b27" strokeWidth="1.5" />
      <path d="M 36 60 L 36 76 M 33 63 Q 39 65 33 69 Q 39 71 33 74" stroke="#ffffff" strokeWidth="1.2" fill="none" />
      <text x="36" y="79" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="700">MEDICINE</text>

      {/* Dentistry (Teal - Tooth) */}
      <circle cx="48" cy="102" r="13" fill="#0891b2" stroke="#c59b27" strokeWidth="1.5" />
      <path d="M 45 98 Q 48 95 51 98 Q 53 104 50 106 Q 48 102 46 106 Q 43 104 45 98 Z" fill="#ffffff" />
      <text x="48" y="112" textAnchor="middle" fill="#ffffff" fontSize="3.5" fontWeight="700">DENTISTRY</text>

      {/* Engineering (Orange - Cog/Gear) */}
      <circle cx="80" cy="132" r="14" fill="#ea580c" stroke="#c59b27" strokeWidth="1.5" />
      <circle cx="80" cy="130" r="5" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="2,2" />
      <text x="80" y="142" textAnchor="middle" fill="#ffffff" fontSize="3.5" fontWeight="700">ENGINEERING</text>

      {/* Nursing (Purple - Cross) */}
      <circle cx="112" cy="102" r="13" fill="#4338ca" stroke="#c59b27" strokeWidth="1.5" />
      <path d="M 110 97 H 114 V 100 H 117 V 104 H 114 V 107 H 110 V 104 H 107 V 100 H 110 Z" fill="#ffffff" />
      <text x="112" y="112" textAnchor="middle" fill="#ffffff" fontSize="3.8" fontWeight="700">NURSING</text>

      {/* Pharmacy (Emerald - Mortar) */}
      <circle cx="124" cy="68" r="14" fill="#047857" stroke="#c59b27" strokeWidth="1.5" />
      <path d="M 120 67 Q 124 72 128 67 L 127 72 H 121 Z M 122 63 L 126 69" stroke="#ffffff" strokeWidth="1" fill="#ffffff" />
      <text x="124" y="79" textAnchor="middle" fill="#ffffff" fontSize="3.5" fontWeight="700">PHARMACY</text>

      {/* Outer Banner Text: KARPAGA VINAYAGA */}
      <text x="80" y="24" textAnchor="middle" fill="#1e3a8a" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="1.2">
        KARPAGA VINAYAGA
      </text>

      {/* Bottom Ribbon */}
      <path d="M 40 148 Q 80 156 120 148 L 118 155 Q 80 162 42 155 Z" fill="#0f2648" stroke="#c59b27" strokeWidth="1" />
      <text x="80" y="153" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif" fontWeight="800" fontSize="5" letterSpacing="0.8">
        • DEEMED UNIVERSITY •
      </text>
    </svg>
  );

  // Variant: Crest only
  if (variant === 'crest-only') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <CrestSVG size={48} />
      </div>
    );
  }

  // Variant: Compact for Sidebar
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <CrestSVG size={40} />
        <div className="overflow-hidden leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black tracking-tight text-sm text-white font-sans uppercase">
              KARPAGA VINAYAGA
            </span>
          </div>
          <p className="text-[10px] text-amber-300 font-bold tracking-widest uppercase mt-0.5">
            DEEMED TO BE UNIVERSITY
          </p>
          <p className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5">
            KVCET • WORKLOAD INTELLIGENCE
          </p>
        </div>
      </div>
    );
  }

  // Variant: Horizontal Small for Header / Topbar
  if (variant === 'horizontal-sm') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <CrestSVG size={36} />
        <div className="leading-tight">
          <h2 className="text-xs font-black tracking-wide text-slate-900 uppercase">
            KARPAGA VINAYAGA
          </h2>
          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
            Deemed to be University &bull; KVCET
          </p>
        </div>
      </div>
    );
  }

  // Variant: Print / Report Header
  if (variant === 'print') {
    return (
      <div className={`flex items-center justify-center gap-5 py-2 ${className}`}>
        <CrestSVG size={68} />
        <div className="text-left">
          <h1 className="text-2xl font-black text-[#1e3a8a] tracking-tight uppercase leading-none font-sans">
            KARPAGA VINAYAGA
          </h1>
          <p className="text-xs font-bold text-[#b45309] tracking-wider uppercase mt-1">
            EDUCATIONAL LORE FOR LEARNING &bull; DEEMED TO BE UNIVERSITY
          </p>
          <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
            Karpaga Vinayaga College of Engineering & Technology (KVCET)
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            GST Road, Chinna Kolambakkam, Madhuranthagam Taluk, Chengalpattu - 603308, Tamil Nadu
          </p>
        </div>
      </div>
    );
  }

  // Default: Full Majestic Lockup
  const isDark = theme === 'dark';
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <CrestSVG size={52} />
      <div className="text-left leading-none">
        <h1
          className={`text-xl sm:text-2xl font-black tracking-tight font-sans uppercase leading-none ${
            isDark ? 'text-white' : 'text-[#1e3a8a]'
          }`}
        >
          KARPAGA VINAYAGA
        </h1>
        <div className="flex items-center gap-1.5 my-1">
          <div className="h-[1.5px] w-6 bg-amber-500 rounded" />
          <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
            EDUCATIONAL LORE FOR LEARNING
          </span>
          <div className="h-[1.5px] flex-1 bg-amber-500/60 rounded" />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
          <span className="uppercase text-amber-700 dark:text-amber-300">
            DEEMED TO BE UNIVERSITY
          </span>
          <span>&bull;</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">
            KVCET ACADEMIC
          </span>
        </div>
      </div>
    </div>
  );
};
