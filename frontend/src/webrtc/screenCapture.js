/**
 * Screen Capture Utilities
 * Helper functions for screen capture and video handling
 */

/**
 * Get available screen capture sources
 * Note: This requires the user to select a source via the browser dialog
 * @returns {MediaStream} The screen capture stream
 */
export async function getScreenStream(options = {}) {
  const constraints = {
    video: {
      cursor: 'always',
      displaySurface: options.displaySurface || 'monitor',
      logicalSurface: true,
      ...(options.width && { width: { ideal: options.width } }),
      ...(options.height && { height: { ideal: options.height } }),
      ...(options.frameRate && { frameRate: { ideal: options.frameRate } })
    },
    audio: options.audio || false
  };

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Screen capture error:', error);
    throw error;
  }
}

/**
 * Check if screen capture is supported
 * @returns {boolean} Whether screen capture is supported
 */
export function isScreenCaptureSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

/**
 * Get video dimensions from stream
 * @param {MediaStream} stream - Media stream
 * @returns {Object} Width and height
 */
export function getStreamDimensions(stream) {
  const videoTrack = stream.getVideoTracks()[0];
  
  if (!videoTrack) {
    return { width: 0, height: 0 };
  }

  const settings = videoTrack.getSettings();
  return {
    width: settings.width || 0,
    height: settings.height || 0,
    frameRate: settings.frameRate || 0
  };
}

/**
 * Apply constraints to video track
 * @param {MediaStream} stream - Media stream
 * @param {Object} constraints - Video constraints
 */
export async function applyVideoConstraints(stream, constraints) {
  const videoTrack = stream.getVideoTracks()[0];
  
  if (!videoTrack) {
    throw new Error('No video track found');
  }

  try {
    await videoTrack.applyConstraints(constraints);
  } catch (error) {
    console.error('Failed to apply constraints:', error);
    throw error;
  }
}

/**
 * Create a quality preset configuration
 * @param {string} quality - Quality preset (low, medium, high, auto)
 * @returns {Object} Video constraints
 */
export function getQualityPreset(quality) {
  const presets = {
    low: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 15 }
    },
    medium: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24 }
    },
    high: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 }
    },
    auto: {
      // Let the browser decide
    }
  };

  return presets[quality] || presets.auto;
}

/**
 * Calculate aspect ratio
 * @param {number} width - Width
 * @param {number} height - Height
 * @returns {number} Aspect ratio
 */
export function calculateAspectRatio(width, height) {
  return width / height;
}

/**
 * Fit dimensions to container while maintaining aspect ratio
 * @param {number} srcWidth - Source width
 * @param {number} srcHeight - Source height
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Object} Fitted dimensions
 */
export function fitToContainer(srcWidth, srcHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  
  return {
    width: Math.floor(srcWidth * ratio),
    height: Math.floor(srcHeight * ratio)
  };
}
