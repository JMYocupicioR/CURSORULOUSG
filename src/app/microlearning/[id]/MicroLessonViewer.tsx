"use client"

import { MicroLesson } from "@/lib/data"
import MuxPlayer from "@mux/mux-player-react"

export function MicroLessonViewer({ lesson }: { lesson: MicroLesson }) {
  // Extract Mux Playback ID from a URL or use it directly
  const extractMuxId = (url: string | null) => {
    if (!url) return null;
    
    // Check if it's already an ID (alphanumeric with some dashes/underscores, no slashes or colons)
    if (/^[a-zA-Z0-9_\-]+$/.test(url)) {
      return url;
    }
    
    // Try to extract from mux URLs (player.mux.com or stream.mux.com)
    // Matches e.g. https://player.mux.com/3e7XPFmef3AH1P5A8XUBu4ep9JcjeLh5tcZNlcnYPHl
    // or https://stream.mux.com/3e7X...m3u8
    const match = url.match(/\/([a-zA-Z0-9_\-]+)(?:\.m3u8|\?|$)/);
    if (match && match[1]) {
      // Avoid extracting "assets" or "environments" from other mux dashboard links accidentally
      if (match[1] !== 'assets' && match[1] !== 'environments') {
        return match[1];
      }
    }
    
    // If we can't figure it out, just return the raw string and let MuxPlayer complain
    return url;
  }

  const playbackId = extractMuxId(lesson.video_url);

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl bg-black aspect-video relative">
      {playbackId ? (
        <MuxPlayer
          streamType="on-demand"
          playbackId={playbackId}
          metadata={{
            video_title: lesson.title,
            viewer_user_id: "student", 
          }}
          primaryColor="#00b4d8"
          secondaryColor="#FFFFFF"
          className="w-full h-full object-contain"
          controls
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-6 text-center">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">broken_image</span>
          <p className="font-semibold text-lg">El video aún no está disponible.</p>
          <p className="text-sm mt-2 opacity-80">El enlace proporcionado no es un video válido de Mux o está siendo procesado.</p>
        </div>
      )}
    </div>
  )
}
