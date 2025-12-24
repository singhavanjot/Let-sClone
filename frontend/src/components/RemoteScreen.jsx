/**
 * Remote Screen Component
 * Displays the remote desktop video stream
 */

import { useRef, useEffect, useState } from 'react';
import { FiMaximize, FiMinimize, FiSettings } from 'react-icons/fi';

function RemoteScreen({
  stream,
  onContainerRef,
  showControls = true,
  className = ''
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Pass container ref to parent
  useEffect(() => {
    if (containerRef.current && onContainerRef) {
      onContainerRef(containerRef.current);
    }
  }, [onContainerRef]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoSize({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        remote-screen relative bg-black rounded-lg overflow-hidden
        ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}
        ${className}
      `}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
              <FiSettings className="w-8 h-8 text-gray-500 animate-spin-slow" />
            </div>
            <p className="text-gray-400">Waiting for screen share...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && stream && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {videoSize.width > 0 && (
                <span>{videoSize.width} × {videoSize.height}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-white transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <FiMinimize className="w-5 h-5" />
                ) : (
                  <FiMaximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RemoteScreen;
