import ScrollLink from '../mixins/scroll-link';

const LinkElement = (props) => (<a {...props}>{props.children}</a>)

export default ScrollLink(LinkElement)
