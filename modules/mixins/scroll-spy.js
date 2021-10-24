import { addPassiveEventListener } from './passive-event-listeners';

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
const { now } = Date;
function throttle(func, wait) {
  let timeout = null;
  let context;
  let args;
  let result;
  let previous = 0;

  const later = () => {
    previous = now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  return function () {
    const _now = now();
    const remaining = wait - (_now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = _now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}

// The eventHandler will execute at a rate of 15fps by default
const eventThrottler = (eventHandler, throttleAmount = 66) => throttle(eventHandler, throttleAmount);

const pageXOffsetSupported = 'pageXOffset' in window;
const isCSS1CompatMode = (document.compatMode || "") === "CSS1Compat";

const scrollSpy = {

  spyCallbacks: [],
  spySetState: [],
  scrollSpyContainers: [],

  mount(scrollSpyContainer, throttle) {
    if (scrollSpyContainer) {
      const eventHandler = eventThrottler((event) => {
        scrollSpy.scrollHandler(scrollSpyContainer);
      }, throttle);
      scrollSpy.scrollSpyContainers.push(scrollSpyContainer);
      addPassiveEventListener(scrollSpyContainer, 'scroll', eventHandler);
    }
  },

  isMounted(scrollSpyContainer) {
    return scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer) !== -1;
  },

  currentPositionX(scrollSpyContainer) {
    if (scrollSpyContainer === document) {
      return pageXOffsetSupported ? window.pageXOffset : isCSS1CompatMode ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
    } else {
      return scrollSpyContainer.scrollLeft;
    }
  },

  currentPositionY(scrollSpyContainer) {
    if (scrollSpyContainer === document) {
      return pageXOffsetSupported ? window.pageYOffset : isCSS1CompatMode ?
        document.documentElement.scrollTop : document.body.scrollTop;
    } else {
      return scrollSpyContainer.scrollTop;
    }
  },

  scrollHandler(scrollSpyContainer) {
    let callbacks = scrollSpy.scrollSpyContainers[scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer)].spyCallbacks || [];
    callbacks.forEach(c => c(scrollSpy.currentPositionX(scrollSpyContainer), scrollSpy.currentPositionY(scrollSpyContainer)));
  },

  addStateHandler(handler) {
    scrollSpy.spySetState.push(handler);
  },

  addSpyHandler(handler, scrollSpyContainer) {
    let container = scrollSpy.scrollSpyContainers[scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer)];

    if (!container.spyCallbacks) {
      container.spyCallbacks = [];
    }

    container.spyCallbacks.push(handler);

    handler(scrollSpy.currentPositionX(scrollSpyContainer), scrollSpy.currentPositionY(scrollSpyContainer));
  },

  updateStates() {
    scrollSpy.spySetState.forEach(s => s());
  },

  unmount(stateHandler, spyHandler) {
    scrollSpy.scrollSpyContainers.forEach(c => c.spyCallbacks && c.spyCallbacks.length && c.spyCallbacks.splice(c.spyCallbacks.indexOf(spyHandler), 1))

    if (scrollSpy.spySetState && scrollSpy.spySetState.length) {
      scrollSpy.spySetState.splice(scrollSpy.spySetState.indexOf(stateHandler), 1);
    }

    document.removeEventListener('scroll', scrollSpy.scrollHandler);
  },

  update: () => scrollSpy.scrollSpyContainers.forEach(c => scrollSpy.scrollHandler(c))
}

export default scrollSpy;
