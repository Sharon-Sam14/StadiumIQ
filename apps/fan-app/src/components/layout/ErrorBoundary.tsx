import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ============================================================
// ERROR BOUNDARY — Wraps each role view
// Shows graceful error state with retry — no raw stack traces.
// ============================================================

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly viewName?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message ?? "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log without exposing stack trace to users
    console.error("[ErrorBoundary] Caught error:", error.message, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" aria-hidden="true" />
        </div>
        <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
          {this.props.viewName ? `${this.props.viewName} Error` : "Something went wrong"}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
          This view encountered an unexpected error. Your data is safe — please retry or switch roles.
        </p>
        <button
          onClick={this.handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brand-gold)] text-black font-bold text-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Retry loading this view"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }
}
