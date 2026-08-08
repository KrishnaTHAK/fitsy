import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown runtime error',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fitsy runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="runtime-error">
          <div className="runtime-error__card">
            <span className="eyebrow">Runtime Error</span>
            <h1>The app hit a browser error instead of rendering.</h1>
            <p>{this.state.errorMessage}</p>
            <p>
              Refresh the page once. If this stays visible, send me the exact message shown here and
              I will fix the source directly.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
