import { PureComponent, createElement } from 'preact/compat';

import scrollSpy from './scroll-spy';
import defaultScroller from './scroller';

const PRESERVED_PROPS = ['to', 'containerId', 'container', 'activeClass', 'spy', 'horizontal', 'smooth', 'offset', 'delay', 'isDynamic', 'onClick', 'duration', 'absolute', 'onSetActive', 'onSetInactive', 'ignoreCancelEvents', 'spyThrottle'];

export default (Component, customScroller) => {

  const scroller = customScroller || defaultScroller;

  class Link extends PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        active: false
      };
    }

    scrollTo = (to, props) => {
      scroller.scrollTo(to, { ...this.state, ...props });
    }

    handleClick = (event) => {

      /*
       * give the posibility to override onClick
       */

      if (this.props.onClick) {
        this.props.onClick(event);
      }

      /*
       * dont bubble the navigation
       */

      if (event.stopPropagation) event.stopPropagation();
      if (event.preventDefault) event.preventDefault();

      /*
       * do the magic!
       */
      this.scrollTo(this.props.to, this.props);

    }

    getScrollSpyContainer() {
      let containerId = this.props.containerId;
      let container = this.props.container;

      if (containerId && !container) {
        return document.getElementById(containerId);
      }

      if (container && container.nodeType) {
        return container;
      }

      return document;
    }

    componentDidMount() {
      if (this.props.spy) {
        let scrollSpyContainer = this.getScrollSpyContainer();

        if (!scrollSpy.isMounted(scrollSpyContainer)) {
          scrollSpy.mount(scrollSpyContainer, this.props.spyThrottle);
        }

        scrollSpy.addSpyHandler(this.spyHandler, scrollSpyContainer);

        this.setState({
          container: scrollSpyContainer
        });

      }
    }
    componentWillUnmount() {
      scrollSpy.unmount(this.stateHandler, this.spyHandler);
    }
    render() {
      let className = "";

      if (this.state && this.state.active) {
        className = ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim();
      } else {
        className = this.props.className;
      }

      let props = { ...this.props };

      for (const prop of PRESERVED_PROPS) {
        if (props.hasOwnProperty(prop)) {
          props[prop] = undefined;
        }
      }

      props.className = className;
      props.onClick = this.handleClick;


      return createElement(Component, props);
    }
  };

  Link.defaultProps = { offset: 0 };

  return Link;
}
