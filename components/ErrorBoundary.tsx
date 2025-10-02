// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React, { Component, ErrorInfo, ReactNode } from 'react';
import Icon from './ui/Icon';
import loggingService from '../services/loggingService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using our centralized logging service
    loggingService.error('ErrorBoundary', 'Uncaught application error:', { error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 gap-4 p-8 text-center">
            <Icon name="warning" size={64} className="text-red-500" />
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">Oops! Something went wrong.</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">
                The application has encountered an unexpected error.
            </p>
            <p className="text-gray-500 dark:text-gray-400">
                Please try reloading the page. If the problem persists, check the developer console for more details.
            </p>
            <button 
                onClick={this.handleReload} 
                className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
                Reload Page
            </button>
            {this.state.error && (
                <details className="mt-6 text-left w-full max-w-2xl bg-gray-200 dark:bg-gray-800 p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold text-gray-800 dark:text-gray-200">Error Details</summary>
                    <pre className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
                        {this.state.error.toString()}
                        <br />
                        {this.state.error.stack}
                    </pre>
                </details>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;