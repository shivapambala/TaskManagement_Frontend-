import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty" role="alert" style={{ minHeight: '60vh' }}>
        <h3>Something went wrong</h3>
        <p>An unexpected error occurred. Reloading usually fixes it.</p>
        <button type="button" className="btn btn-primary btn-md" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    );
  }
}
