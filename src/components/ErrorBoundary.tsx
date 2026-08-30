import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('KeyMaster crashed:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          id="global-error-boundary"
          className="fixed inset-0 z-[99999] bg-[#FAF8F5] flex flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2C2825]">Something went wrong</h1>
            <p className="text-sm text-[#78726A] mt-1 max-w-sm leading-relaxed">
              KeyMaster hit an unexpected error. Your saved results are safe — reload to continue.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="px-6 py-2.5 bg-[#DA6A45] hover:bg-[#C85A37] text-white text-xs font-bold rounded-xl shadow-md shadow-[#DA6A45]/20 flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload KeyMaster</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}