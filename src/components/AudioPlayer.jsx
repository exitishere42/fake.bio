import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function AudioPlayer({ audioUrl, isEnabled, autoPlay = false }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [showControls, setShowControls] = useState(false)
  const audioRef = useRef(null)
  const buttonRef = useRef(null)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0, width: 0 })

  // Lautstärke und Loop einstellen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.loop = true
    }
  }, [volume])

  // Autoplay beim ersten Laden einmalig versuchen
  useEffect(() => {
    if (isEnabled && audioUrl && autoPlay && !isMuted) {
      setIsPlaying(true)
    }
  }, [isEnabled, audioUrl, autoPlay])

  // Play / Pause Steuerung mit sauberem Abfangen von Autoplay-Blockaden
  useEffect(() => {
    if (audioRef.current && isEnabled && audioUrl) {
      if (isPlaying && !isMuted) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Autoplay von Browser blockiert oder unterbrochen:', err)
            setIsPlaying(false) // Verhindert die Endlosschleife!
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, isMuted, isEnabled, audioUrl])

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const header = document.querySelector('header')
        if (header) {
          const headerRect = header.getBoundingClientRect()
          const headerBottom = headerRect.bottom
          const headerRight = headerRect.right
          const headerLeft = headerRect.left

          const minTop = headerBottom + 16
          let sliderLeft = rect.left + rect.width / 2

          const sliderHalfWidth = 175
          if (sliderLeft - sliderHalfWidth < headerLeft) {
            sliderLeft = headerLeft + sliderHalfWidth + 10
          }
          if (sliderLeft + sliderHalfWidth > headerRight) {
            sliderLeft = headerRight - sliderHalfWidth - 10
          }

          setButtonPosition({
            top: minTop,
            left: sliderLeft,
            width: rect.width
          })
        } else {
          setButtonPosition({
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
            width: rect.width
          })
        }
      }
    }

    if (showControls) {
      setTimeout(() => updatePosition(), 0)
      const interval = setInterval(updatePosition, 100)
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        clearInterval(interval)
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [showControls])

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setIsPlaying(true)
    } else {
      setIsMuted(true)
      setIsPlaying(false)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
      setIsPlaying(true)
    }
  }

  if (!isEnabled || !audioUrl) return null

  return (
      <>
        <audio ref={audioRef} src={audioUrl} preload="auto" />
        <div className="relative">
          <button
              ref={buttonRef}
              onClick={toggleMute}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all flex-shrink-0 ${
                  isMuted || !isPlaying
                      ? 'bg-white/10 border border-white/20 text-gray-400'
                      : 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
              } hover:scale-110 active:scale-95`}
              title={isMuted || !isPlaying ? 'Unmute / Play audio' : 'Mute audio'}
          >
            {isMuted || !isPlaying ? (
                <VolumeX className="w-5 h-5" />
            ) : (
                <Volume2 className="w-5 h-5" />
            )}
          </button>

          {showControls && buttonPosition.top > 0 && buttonPosition.left > 0 && (
              <div className="fixed bg-black backdrop-blur-xl border-2 border-white/40 rounded-lg shadow-2xl z-[99999] transition-all duration-300 ease-out overflow-hidden" style={{
                width: '350px',
                padding: '10px 20px',
                height: '40px',
                minWidth: '350px',
                maxWidth: '350px',
                top: `${buttonPosition.top}px`,
                left: `${buttonPosition.left}px`,
                transform: 'translate(-50%, 0)',
                zIndex: 99999
              }}>
                <div className="flex items-center gap-3 w-full h-full">
                  <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="slider flex-1 min-w-0"
                  />
                  <span className="text-xs text-gray-400 w-10 text-right whitespace-nowrap flex-shrink-0">
                {Math.round(volume * 100)}%
              </span>
                </div>
              </div>
          )}
        </div>
      </>
  )
}