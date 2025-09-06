'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function BotConfiguration() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
      {/* Circuit Pattern Background with longer lines and hollow circles - Behind everything */}
      <div className="absolute inset-0 opacity-40 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Radial gradient for fading center */}
            <radialGradient id="fadeCenter" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="40%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="100%" stopColor="#000e24" stopOpacity="1" />
            </radialGradient>
            
            <pattern id="circuitPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Longer lines with direction changes and hollow circles */}
              <g stroke="#012f78" strokeWidth="0.8" fill="none" opacity="0.6">
                {/* Line 1 - from left to center with angle */}
                <path d="M0,40 L80,40 L100,60" />
                <circle cx="100" cy="60" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 2 - from top to center with angle */}
                <path d="M40,0 L40,80 L60,100" />
                <circle cx="60" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 3 - from right to center with angle */}
                <path d="M200,60 L120,60 L100,80" />
                <circle cx="100" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 4 - from bottom to center with angle */}
                <path d="M60,200 L60,120 L80,100" />
                <circle cx="80" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 5 - from top-left to center */}
                <path d="M0,20 L60,20 L80,40" />
                <circle cx="80" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 6 - from top-right to center */}
                <path d="M200,20 L140,20 L120,40" />
                <circle cx="120" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 7 - from bottom-left to center */}
                <path d="M0,180 L60,180 L80,160" />
                <circle cx="80" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 8 - from bottom-right to center */}
                <path d="M200,180 L140,180 L120,160" />
                <circle cx="120" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 9 - diagonal from left */}
                <path d="M0,100 L50,100 L70,120" />
                <circle cx="70" cy="120" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 10 - diagonal from right */}
                <path d="M200,100 L150,100 L130,80" />
                <circle cx="130" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 11 - diagonal from top */}
                <path d="M100,0 L100,50 L120,70" />
                <circle cx="120" cy="70" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 12 - diagonal from bottom */}
                <path d="M100,200 L100,150 L80,130" />
                <circle cx="80" cy="130" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
              </g>
            </pattern>
          </defs>
          
          {/* Background with pattern */}
          <rect width="100%" height="100%" fill="url(#circuitPattern)" />
          
          {/* Fade out center area */}
          <rect width="100%" height="100%" fill="url(#fadeCenter)" />
        </svg>
      </div>

      <div className="relative z-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-6">
              <Image
                src="/Logo.png"
                alt="SYNAPBOT"
                width={150}
                height={38}
                className="h-9 w-auto"
              />
              <h1 className="text-3xl font-bold text-[#B7C2D6]">Configuración Bot</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] px-4 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-6">
                <div className="text-center">
                  <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-[#90e2f8] mb-4 bg-[#012f78]">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-[#B7C2D6] font-bold">🤖</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-[#B7C2D6] mb-2">Configuración del Bot</h2>
                  <p className="text-[#90e2f8] text-sm mb-6">Configura el comportamiento de tu asistente</p>
                </div>

                {/* Navigation Menu */}
                <div className="mt-6 bg-[#012f78] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => router.push('/settings/bot')}
                      className="w-full bg-[#0073ba] hover:bg-[#005a92] text-white py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Configuración Bot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
                {/* Header */}
                <div className="bg-[#012f78] px-6 py-4 border-b border-[#3ea0c9]">
                  <h2 className="text-xl font-semibold text-[#B7C2D6]">Configuración del Asistente</h2>
                  <p className="text-[#90e2f8] text-sm">Personaliza el comportamiento de tu bot de WhatsApp</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-[#90e2f8] text-6xl mb-4">🚧</div>
                    <h3 className="text-xl font-semibold text-[#B7C2D6] mb-2">Funcionalidad en Desarrollo</h3>
                    <p className="text-[#B7C2D6]">
                      Esta sección estará disponible próximamente. Aquí podrás configurar 
                      el comportamiento de tu asistente de WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}