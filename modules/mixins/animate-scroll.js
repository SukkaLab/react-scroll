import smooth from './smooth';
import cancelEvents from './cancel-events';
import events from './scroll-events';

/*
 * Function helper
 */
const functionWrapper = (value) => typeof value === 'function' ? value : function () { return value; };

/*
 * Helper function to never extend 60fps on the webpage.
 */
const requestAnimationFrameHelper = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame;

const makeData = () => ({
  currentPosition: 0,
  startPosition: 0,
  targetPosition: 0,
  progress: 0,
  duration: 0,
  cancel: false,

  target: null,
  containerElement: null,
  to: null,
  start: null,
  delta: null,
  percent: null,
  delayTimeout: null
});

const pageXOffsetSupported = 'pageXOffset' in window;
const isCSS1CompatMode = (document.compatMode || "") === "CSS1Compat";

const currentPositionX = (options) => {
  const containerElement = options.data.containerElement;
  if (containerElement && containerElement !== document && containerElement !== document.body) {
    return containerElement.scrollLeft;
  } else {
    return pageXOffsetSupported ? window.pageXOffset : isCSS1CompatMode ?
      document.documentElement.scrollLeft : document.body.scrollLeft;
  }
};

const currentPositionY = (options) => {
  const containerElement = options.data.containerElement;
  if (containerElement && containerElement !== document && containerElement !== document.body) {
    return containerElement.scrollTop;
  } else {
    return pageXOffsetSupported ? window.pageYOffset : isCSS1CompatMode ?
      document.documentElement.scrollTop : document.body.scrollTop;
  }
};

const animateScroll = (easing, options, timestamp) => {
  const data = options.data;

  // Cancel on specific events
  if (!options.ignoreCancelEvents && data.cancel) {
    if (events.registered['end']) {
      events.registered['end'](data.to, data.target, data.currentPositionY);
    }
    return
  };

  data.delta = Math.round(data.targetPosition - data.startPosition);

  if (data.start === null) {
    data.start = timestamp;
  }

  data.progress = timestamp - data.start;

  data.percent = (data.progress >= data.duration ? 1 : easing(data.progress / data.duration));

  data.currentPosition = data.startPosition + Math.ceil(data.delta * data.percent);

  if (data.containerElement && data.containerElement !== document && data.containerElement !== document.body) {
    if (options.horizontal) {
      data.containerElement.scrollLeft = data.currentPosition;
    } else {
      data.containerElement.scrollTop = data.currentPosition;
    }
  } else {
    if (options.horizontal) {
      window.scrollTo(data.currentPosition, 0);
    } else {
      window.scrollTo(0, data.currentPosition);
    }
  }

  if (data.percent < 1) {
    let easedAnimate = animateScroll.bind(null, easing, options);
    requestAnimationFrameHelper.call(window, easedAnimate);
    return;
  }

  if (events.registered['end']) {
    events.registered['end'](data.to, data.target, data.currentPosition);
  }

};

const setContainer = (options) => {
  options.data.containerElement = !options
    ? null
    : options.containerId
      ? document.getElementById(options.containerId)
      : options.container && options.container.nodeType
        ? options.container
        : document;
};

const animateTopScroll = (scrollOffset, options, to, target) => {
  options.data = options.data || makeData();

  window.clearTimeout(options.data.delayTimeout);

  cancelEvents.subscribe(() => {
    options.data.cancel = true;
  });

  setContainer(options);

  options.data.start = null;
  options.data.cancel = false;
  options.data.startPosition = options.horizontal ? currentPositionX(options) : currentPositionY(options);
  options.data.targetPosition = options.absolute
    ? scrollOffset
    : scrollOffset + options.data.startPosition;

  if (options.data.startPosition === options.data.targetPosition) {
    if (events.registered['end']) {
      events.registered['end'](options.data.to, options.data.target, options.data.currentPosition);
    }
    return;
  }

  options.data.delta = Math.round(options.data.targetPosition - options.data.startPosition);

  options.data.duration = functionWrapper(options.duration)(options.data.delta);
  options.data.duration = isNaN(parseFloat(options.data.duration)) ? 1000 : parseFloat(options.data.duration);
  options.data.to = to;
  options.data.target = target;

  let easing = smooth[options.smooth] || smooth.defaultEasing;
  let easedAnimate = animateScroll.bind(null, easing, options);

  if (options && options.delay > 0) {
    options.data.delayTimeout = window.setTimeout(() => {
      if (events.registered['begin']) {
        events.registered['begin'](options.data.to, options.data.target);
      }
      requestAnimationFrameHelper.call(window, easedAnimate);
    }, options.delay);
    return;
  }

  if (events.registered['begin']) {
    events.registered['begin'](options.data.to, options.data.target);
  }
  requestAnimationFrameHelper.call(window, easedAnimate);

};

export default {
  animateTopScroll,
};
