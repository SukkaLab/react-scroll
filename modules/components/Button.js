import ScrollLink from '../mixins/scroll-link';

const ButtonElement = (props) => (
  <input {...props}>
    {props.children}
  </input>
);

export default ScrollLink(ButtonElement);
