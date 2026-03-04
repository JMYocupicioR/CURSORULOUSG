"use client"

import { useState, useRef, useEffect } from "react"
import { MicroLesson } from "@/lib/data"
import MuxPlayer from "@mux/mux-player-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function MicroLessonFeed({ lessons }: { lessons: MicroLesson[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const index = Math.round(container.scrollTop / container.clientHeight)
      if (index !== activeIndex) {
        setActiveIndex(index)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      // Trigger once on mount
      handleScroll()
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [activeIndex])

  const extractMuxId = (url: string | null) => {
    if (!url) return null;
    if (/^[a-zA-Z0-9_\-]+$/.test(url)) return url;
    const match = url.match(/\/([a-zA-Z0-9_\-]+)(?:\.m3u8|\?|$)/);
    if (match && match[1] && match[1] !== 'assets' && match[1] !== 'environments') return match[1];
    return url;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black"
    >
      {/* Back Button Overlay */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg border border-white/10"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al Dashboard
        </Link>
      </div>

      {lessons.map((lesson, index) => {
        const playbackId = extractMuxId(lesson.video_url)
        const isActive = index === activeIndex

        return (
          <div 
            key={lesson.id} 
            className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black"
          >
            {playbackId ? (
              <MuxPlayer
                streamType="on-demand"
                playbackId={playbackId}
                metadata={{
                  video_title: lesson.title,
                  viewer_user_id: "student",
                }}
                primaryColor="#2DD4BF"
                secondaryColor="#FFFFFF"
                className={cn(
                  "w-full h-full transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                autoPlay={isActive ? "any" : false}
                muted={false}
                loop
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">broken_image</span>
                <p className="font-semibold text-lg text-white">Video no disponible</p>
              </div>
            )}

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pb-16 md:pb-16 bg-linear-to-t from-black via-black/50 to-transparent pointer-events-none flex items-end">
              <div className="max-w-3xl w-full pointer-events-auto pr-16 md:pr-24">
                <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-primary text-white uppercase tracking-wider mb-4 inline-block shadow-lg">
                  {lesson.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 drop-shadow-md">
                  {lesson.title}
                </h2>
                {lesson.description && (
                  <p className="text-gray-300 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl drop-shadow">
                    {lesson.description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-white/80">
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {lesson.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm animate-pulse">
                    <span className="material-symbols-outlined text-[16px]">swipe_up</span>
                    Desliza para el siguiente
                  </span>
                </div>
              </div>

              {/* Engagement Sidebar */}
              <div className="absolute right-4 md:right-8 bottom-24 flex flex-col items-center gap-6 pointer-events-auto">
                <button className="flex flex-col items-center gap-1 text-white hover:text-primary transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <span className="material-symbols-outlined text-2xl fill-none group-hover:fill-current">favorite</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold drop-shadow">Me gusta</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-white hover:text-primary transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <span className="material-symbols-outlined text-2xl">share</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold drop-shadow">Compartir</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        mux-player {
          --media-object-fit: contain;
        }
      `}</style>
    </div>
  )
}
