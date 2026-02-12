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
  src, className = "", onClick, autoPlay = false, loop = false, muted = false, hideControls = false, minimalControls = false, autoPlayOnView = false, playPauseOnly = false, inModal = false
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
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // Default to 16:9
  const [isVertical, setIsVertical] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const stateLockRef = useRef(false);
  const userInteractedRef = useRef(false);
  const clickDebounceRef = useRef(false);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (videoRef.current) videoRef.current.pause();
    },
    play: () => {
      if (videoRef.current) videoRef.current.play();
    },
    currentTime: () => {
      return videoRef.current ? videoRef.current.currentTime : 0;
    }
  }));

  // Intersection Observer for autoPlayOnView with debouncing
  useEffect(() => {
    if (!autoPlayOnView || !videoRef.current || inModal || hideControls) return;
    const video = videoRef.current;
    let observer;
    
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        const wasIntersecting = isIntersecting;
        const isNowIntersecting = entry.isIntersecting;
        
        // Only process if the intersection state actually changed
        if (wasIntersecting !== isNowIntersecting) {
          setIsIntersecting(isNowIntersecting);
          
          // Clear any existing debounce timeout
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          
          // Debounce the play/pause actions to prevent rapid state changes
          debounceTimeoutRef.current = setTimeout(() => {
            // Don't auto-control if user has recently interacted
            if (userInteractedRef.current) {
              return;
            }
            
            // Don't auto-control if video is loading or has an error
            if (isLoading || error) {
              return;
            }
            
            // Don't auto-control if video is muted and user hasn't interacted
            if (isMuted && !userInteractedRef.current) {
              return;
            }
            
            // Don't auto-control if video is in fullscreen mode
            if (isFullscreen) {
              return;
            }
            
            // Don't auto-control if video is in a loop
            if (loop) {
              return;
            }
            
            // Don't change state if video is already in the desired state
            if (isNowIntersecting && isPlaying) {
              return; // Already playing, no need to change
            }
            if (!isNowIntersecting && !isPlaying) {
              return; // Already paused, no need to change
            }
            
            if (isNowIntersecting) {
              // Video came into view - only play if it's not already playing
              if (video.paused && !isPlaying) {
                video.muted = true;
                video.play().catch(() => {
                  // Auto-play failed, that's okay
                });
              }
            } else {
              // Video went out of view - only pause if it's currently playing
              if (!video.paused && isPlaying) {
                video.pause();
              }
            }
          }, 150); // 150ms debounce delay
        }
      });
    };
    
    observer = new window.IntersectionObserver(handleIntersection, { 
      threshold: 0.8,
      rootMargin: '50px' // Add some margin to prevent edge cases
    });
    observer.observe(video);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      observer && observer.disconnect();
      video.pause();
    };
  }, [autoPlayOnView, isIntersecting, isPlaying, isLoading, error, isMuted, isFullscreen, loop, inModal, hideControls]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    let timeout;
    if (showControls && isPlaying && !hideControls && !minimalControls && !inModal) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      clearTimeout(timeout);
      // Also clear state lock timeout if component unmounts
      if (stateLockRef.current) {
        stateLockRef.current = false;
      }
      // Clear click debounce
      if (clickDebounceRef.current) {
        clickDebounceRef.current = false;
      }
    };
  }, [showControls, isPlaying, hideControls, minimalControls, inModal]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      
      // Calculate aspect ratio and determine if vertical
      const aspectRatio = video.videoWidth / video.videoHeight;
      setVideoAspectRatio(aspectRatio);
      setIsVertical(aspectRatio < 1); // Vertical if width < height
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      // Only update state if it's actually different to prevent unnecessary re-renders
      if (!isPlaying) {
        setIsPlaying(true);
      }
      // Reset user interaction flag when video starts playing
      userInteractedRef.current = false;
    };
    
    const handlePause = () => {
      // Only update state if it's actually different to prevent unnecessary re-renders
      if (isPlaying) {
        setIsPlaying(false);
      }
      // Reset user interaction flag when video is paused
      userInteractedRef.current = false;
    };
    
    const handleEnded = () => {
      // Only update state if it's actually different to prevent unnecessary re-renders
      if (isPlaying) {
        setIsPlaying(false);
      }
    };
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
  }, [isPlaying]);

  // Auto-play if specified
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play failed, that's okay
      });
    }
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current && !stateLockRef.current) {
      // Set state lock to prevent rapid toggling
      stateLockRef.current = true;
      userInteractedRef.current = true; // Mark that user has interacted
      
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Play failed, reset state lock
          stateLockRef.current = false;
        });
      }
      
      // Release state lock after a short delay
      setTimeout(() => {
        stateLockRef.current = false;
      }, 300);
      
      // Reset user interaction flag after a longer delay
      setTimeout(() => {
        userInteractedRef.current = false;
      }, 2000);
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
    
    // Prevent rapid clicking
    if (clickDebounceRef.current) {
      return;
    }
    
    clickDebounceRef.current = true;
    setTimeout(() => {
      clickDebounceRef.current = false;
    }, 200);
    
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
      <div className={`${className} bg-muted dark:bg-muted-dark rounded-lg flex items-center justify-center min-h-48`}>
        <div className="text-center text-secondary dark:text-secondary-dark">
          <p>Video loading failed</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-primary dark:bg-primary-dark text-primary-dark dark:text-primary rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Dynamic styling based on video orientation
  const getContainerStyle = () => {
    if (inModal) {
      // In modal, allow more flexibility but still set reasonable limits
      if (isVertical) {
        return {
          maxWidth: '400px',
          maxHeight: '600px',
          aspectRatio: videoAspectRatio
        };
      } else {
        return {
          maxWidth: '100%',
          maxHeight: '500px',
          aspectRatio: videoAspectRatio
        };
      }
    } else {
      // In feed, constrain size more
      if (isVertical) {
        return {
          maxWidth: '280px',
          maxHeight: '400px',
          aspectRatio: videoAspectRatio
        };
      } else {
        return {
          maxWidth: '100%',
          maxHeight: '320px',
          aspectRatio: videoAspectRatio
        };
      }
    }
  };

  // Dynamic container classes
  const containerClasses = `relative w-full rounded-xl overflow-hidden bg-black custom-video-player ${className}`;

  return (
    <div className={containerClasses} style={getContainerStyle()}>
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        muted={isMuted}
        className="w-full h-full object-contain rounded-xl select-none"
        onClick={handleVideoClick}
        onMouseEnter={() => !hideControls && !minimalControls && !inModal && setShowControls(true)}
        onMouseLeave={() => isPlaying && !hideControls && !minimalControls && !inModal && setShowControls(false)}
        draggable={false}
        tabIndex={-1}
        playsInline
        autoPlay={autoPlay}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center z-[1]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Play/Pause only button at bottom left */}
      {playPauseOnly && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-4 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all z-[2] cursor-pointer touch-button"
          style={{ pointerEvents: 'auto' }}
          type="button"
          title={isPlaying ? 'Зогсоох' : 'Тоглуулах'}
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>
      )}

      {/* Minimal controls for modal (top right, small) */}
      {!playPauseOnly && minimalControls && !isLoading && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 pointer-events-none z-[2]">
            <button
              onClick={togglePlay}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all video-controls-button pointer-events-auto cursor-pointer touch-button"
              type="button"
              title={isPlaying ? 'Зогсоох' : 'Тоглуулах'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all video-controls-button pointer-events-auto cursor-pointer touch-button"
              tabIndex={0}
              type="button"
              title={isMuted ? 'Дуу идэвхжүүлэх' : 'Дуу унтраах'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          {/* Progress bar at the bottom (interactive) */}
          <div
            className="absolute left-0 right-0 bottom-0 h-1 bg-black/30 cursor-pointer z-[1]"
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
            title="Прогресс барих"
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </>
      )}

      {/* Controls overlay (hidden if hideControls or minimalControls) */}
      {!playPauseOnly && !hideControls && !minimalControls && (showControls || !isPlaying || inModal) && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl pointer-events-none z-[1]">
          {/* Top controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto z-[2]">
            <button
              onClick={toggleMute}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button cursor-pointer touch-button"
              type="button"
              title={isMuted ? 'Дуу идэвхжүүлэх' : 'Дуу унтраах'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button cursor-pointer touch-button"
              type="button"
              title={isFullscreen ? 'Бүтэн дэлгэцээс гарах' : 'Бүтэн дэлгэцээр харах'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto z-[2]">
            {/* Progress bar */}
            <div 
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3 video-progress-bar transition-all"
              onClick={handleProgressClick}
              title="Прогресс барих"
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
                  className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all video-controls-button cursor-pointer touch-button"
                  type="button"
                  title={isPlaying ? 'Зогсоох' : 'Тоглуулах'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="text-white text-sm cursor-default">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white cursor-default" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 video-player-range cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                  title="Дууны түвшин"
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