import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2
} from 'lucide-react';

const CustomVideoPlayer = forwardRef(({
  src, className = "", onClick, autoPlay = false, loop = false, muted = false, hideControls = false, minimalControls = false, autoPlayOnView = false, playPauseOnly = false
}, ref) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted || autoPlayOnView);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (videoRef.current) videoRef.current.pause();
    }
  }));

  // Intersection Observer for autoPlayOnView
  useEffect(() => {
    if (!autoPlayOnView || !videoRef.current) return;
    const video = videoRef.current;
    let observer;
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };
    observer = new window.IntersectionObserver(handleIntersection, { threshold: 0.8 });
    observer.observe(video);
    return () => {
      observer && observer.disconnect();
      video.pause();
    };
  }, [autoPlayOnView]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    let timeout;
    if (showControls && isPlaying && !hideControls && !minimalControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying, hideControls, minimalControls]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Video loading failed');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-play if specified
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play failed, that's okay
      });
    }
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (hideControls || autoPlayOnView) {
      if (onClick) onClick();
      return;
    }
    if (!minimalControls) {
      togglePlay();
      setShowControls(true);
    }
    if (onClick) onClick();
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center min-h-48`}>
        <div className="text-center text-secondary">
          <p>Video loading failed</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-primary text-primary-dark rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Aspect ratio wrapper (16:9)
  return (
    <div className={`relative w-full rounded-xl overflow-hidden bg-black z-0 ${className}`} style={{ aspectRatio: '16/9', maxWidth: '100%' }}>
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        muted={isMuted}
        className="w-full h-full object-cover rounded-xl select-none"
        onClick={handleVideoClick}
        onMouseEnter={() => !hideControls && !minimalControls && setShowControls(true)}
        onMouseLeave={() => isPlaying && !hideControls && !minimalControls && setShowControls(false)}
        draggable={false}
        tabIndex={-1}
        playsInline
        autoPlay={autoPlay}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Play/Pause only button at bottom left */}
      {playPauseOnly && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-4 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all z-10"
          style={{ pointerEvents: 'auto' }}
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>
      )}

      {/* Minimal controls for modal (top right, small) */}
      {!playPauseOnly && minimalControls && !isLoading && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
            <button
              onClick={togglePlay}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all video-controls-button pointer-events-auto"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all video-controls-button pointer-events-auto"
              tabIndex={0}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          {/* Progress bar at the bottom (interactive) */}
          <div
            className="absolute left-0 right-0 bottom-0 h-1 bg-black/30 cursor-pointer"
            onClick={e => {
              if (!duration || !videoRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const newTime = percentage * duration;
              videoRef.current.currentTime = newTime;
            }}
            onMouseDown={e => {
              if (!duration || !videoRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const onMove = moveEvent => {
                const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const moveX = Math.max(rect.left, Math.min(clientX, rect.right));
                const percentage = (moveX - rect.left) / rect.width;
                const newTime = percentage * duration;
                videoRef.current.currentTime = newTime;
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
              window.addEventListener('touchmove', onMove);
              window.addEventListener('touchend', onUp);
            }}
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </>
      )}

      {/* Controls overlay (hidden if hideControls or minimalControls) */}
      {!playPauseOnly && !hideControls && !minimalControls && (showControls || !isPlaying) && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl pointer-events-none">
          {/* Top controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleMute}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            {/* Progress bar */}
            <div 
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3 video-progress-bar transition-all"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Time and volume controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 video-player-range"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CustomVideoPlayer; 