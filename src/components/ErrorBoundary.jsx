import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-app">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-secondary mb-1 font-mono">
              {this.state.error?.message}
            </p>
            <p className="text-xs text-muted mb-6">
              Rechargez la page ou cliquez sur Réessayer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-card-hover text-primary rounded-lg hover:opacity-90 text-sm border border-std"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
