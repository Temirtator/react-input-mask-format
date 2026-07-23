import React from "react";

interface ChildrenWrapperProps extends Record<string, unknown> {
  children: React.ReactElement;
}

export default class InputMaskChildrenWrapper extends React.Component<ChildrenWrapperProps> {
  render() {
    const { children, ...props } = this.props;
    return React.cloneElement(children, props);
  }
}
