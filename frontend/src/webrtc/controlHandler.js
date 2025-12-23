/**
 * Remote Control Handler
 * Handles mouse and keyboard events for remote control
 */

/**
 * Mouse event types
 */
export const MouseEventType = {
  MOVE: 'mousemove',
  DOWN: 'mousedown',
  UP: 'mouseup',
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  SCROLL: 'scroll',
  CONTEXTMENU: 'contextmenu'
};

/**
 * Keyboard event types
 */
export const KeyboardEventType = {
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',
  KEYPRESS: 'keypress'
};

/**
 * Create a remote control handler for the viewer
 */
export class RemoteControlHandler {
  constructor(options = {}) {
    this.targetElement = options.targetElement;
    this.videoWidth = options.videoWidth || 1920;
    this.videoHeight = options.videoHeight || 1080;
    this.onControlEvent = options.onControlEvent;
    this.enabled = true;
    
    // Bound handlers for cleanup
    this.boundHandlers = {
      mouseMove: this.handleMouseMove.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      click: this.handleClick.bind(this),
      doubleClick: this.handleDoubleClick.bind(this),
      contextMenu: this.handleContextMenu.bind(this),
      wheel: this.handleWheel.bind(this),
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this)
    };
  }

  /**
   * Start listening for control events
   */
  start() {
    if (!this.targetElement) {
      console.error('No target element specified');
      return;
    }

    // Mouse events
    this.targetElement.addEventListener('mousemove', this.boundHandlers.mouseMove);
    this.targetElement.addEventListener('mousedown', this.boundHandlers.mouseDown);
    this.targetElement.addEventListener('mouseup', this.boundHandlers.mouseUp);
    this.targetElement.addEventListener('click', this.boundHandlers.click);
    this.targetElement.addEventListener('dblclick', this.boundHandlers.doubleClick);
    this.targetElement.addEventListener('contextmenu', this.boundHandlers.contextMenu);
    this.targetElement.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

    // Keyboard events (on document for better capture)
    document.addEventListener('keydown', this.boundHandlers.keyDown);
    document.addEventListener('keyup', this.boundHandlers.keyUp);

    // Prevent default browser behaviors
    this.targetElement.style.cursor = 'none'; // Hide cursor
    this.targetElement.tabIndex = 0; // Make focusable
    this.targetElement.focus();
  }

  /**
   * Stop listening for control events
   */
  stop() {
    if (!this.targetElement) return;

    // Remove mouse events
    this.targetElement.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    this.targetElement.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    this.targetElement.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.targetElement.removeEventListener('click', this.boundHandlers.click);
    this.targetElement.removeEventListener('dblclick', this.boundHandlers.doubleClick);
    this.targetElement.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
    this.targetElement.removeEventListener('wheel', this.boundHandlers.wheel);

    // Remove keyboard events
    document.removeEventListener('keydown', this.boundHandlers.keyDown);
    document.removeEventListener('keyup', this.boundHandlers.keyUp);

    // Restore cursor
    this.targetElement.style.cursor = 'default';
  }

  /**
   * Enable/disable control events
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.targetElement.style.cursor = enabled ? 'none' : 'default';
  }

  /**
   * Update video dimensions for coordinate calculation
   */
  updateVideoDimensions(width, height) {
    this.videoWidth = width;
    this.videoHeight = height;
  }

  /**
   * Calculate relative coordinates
   */
  getRelativeCoordinates(event) {
    const rect = this.targetElement.getBoundingClientRect();
    
    // Get position relative to element
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to relative coordinates (0-1)
    const relX = x / rect.width;
    const relY = y / rect.height;
    
    // Convert to video coordinates
    const videoX = Math.round(relX * this.videoWidth);
    const videoY = Math.round(relY * this.videoHeight);
    
    return { x: videoX, y: videoY, relX, relY };
  }

  /**
   * Send control event
   */
  sendEvent(eventData) {
    if (!this.enabled || !this.onControlEvent) return;
    this.onControlEvent(eventData);
  }

  // Mouse event handlers
  handleMouseMove(event) {
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.MOVE,
      x: coords.x,
      y: coords.y,
      timestamp: Date.now()
    });
  }

  handleMouseDown(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.DOWN,
      x: coords.x,
      y: coords.y,
      button: event.button,
      timestamp: Date.now()
    });
  }

  handleMouseUp(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.UP,
      x: coords.x,
      y: coords.y,
      button: event.button,
      timestamp: Date.now()
    });
  }

  handleClick(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.CLICK,
      x: coords.x,
      y: coords.y,
      button: event.button,
      timestamp: Date.now()
    });
  }

  handleDoubleClick(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.DBLCLICK,
      x: coords.x,
      y: coords.y,
      button: event.button,
      timestamp: Date.now()
    });
  }

  handleContextMenu(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.CONTEXTMENU,
      x: coords.x,
      y: coords.y,
      timestamp: Date.now()
    });
  }

  handleWheel(event) {
    event.preventDefault();
    const coords = this.getRelativeCoordinates(event);
    this.sendEvent({
      type: MouseEventType.SCROLL,
      x: coords.x,
      y: coords.y,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      timestamp: Date.now()
    });
  }

  // Keyboard event handlers
  handleKeyDown(event) {
    // Don't capture if focus is on an input element
    if (document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();
    this.sendEvent({
      type: KeyboardEventType.KEYDOWN,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      timestamp: Date.now()
    });
  }

  handleKeyUp(event) {
    if (document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();
    this.sendEvent({
      type: KeyboardEventType.KEYUP,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      timestamp: Date.now()
    });
  }
}

/**
 * Execute control event on host
 * This simulates mouse/keyboard events on the host machine
 * Note: Browser cannot actually move the real system cursor
 * This would need a native companion app for full functionality
 */
export class ControlEventExecutor {
  constructor() {
    this.lastMousePosition = { x: 0, y: 0 };
  }

  /**
   * Execute a control event
   * Note: Web browsers have security restrictions that prevent
   * actually controlling the host machine. This is a placeholder
   * that would need a native application for real control.
   */
  execute(event) {
    console.log('Received control event:', event);
    
    switch (event.type) {
      case MouseEventType.MOVE:
        this.lastMousePosition = { x: event.x, y: event.y };
        // Would need native app to move cursor
        break;
        
      case MouseEventType.DOWN:
      case MouseEventType.UP:
      case MouseEventType.CLICK:
      case MouseEventType.DBLCLICK:
        // Would need native app to simulate clicks
        break;
        
      case MouseEventType.SCROLL:
        // Would need native app to simulate scrolling
        break;
        
      case KeyboardEventType.KEYDOWN:
      case KeyboardEventType.KEYUP:
        // Would need native app to simulate key presses
        break;
        
      default:
        console.warn('Unknown event type:', event.type);
    }
  }
}

export default RemoteControlHandler;
