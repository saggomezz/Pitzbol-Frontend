"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback. If omitted the default full-page UI is shown. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

/**
 * Global error boundary. Catches React render errors anywhere in the tree so
 * the whole app doesn't go blank.  Place it as high as possible (just inside
 * the providers in layout.tsx).
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, eventId: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you'd forward this to Sentry / a logging service here.
    // We intentionally avoid console.error with the full stack to keep
    // production logs clean, but still report the message.
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, eventId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A4D2E] mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Ocurrió un error inesperado. Puedes intentar recargar la página o
              volver al inicio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-[#1A4D2E] text-white py-3 px-5 rounded-xl font-semibold hover:bg-[#0D601E] transition-colors"
              >
                Reintentar
              </button>
              <a
                href="/"
                className="flex-1 bg-gray-100 text-gray-800 py-3 px-5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
