import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// ErrorBoundary который игнорирует NotFoundError от Google Translate
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Игнорируем NotFoundError от Google Translate
    if (error.name === 'NotFoundError' || error.message?.includes('can not be found here')) {
      console.debug('[ErrorBoundary] Ignoring NotFoundError from Google Translate');
      return { hasError: false }; // НЕ считаем это ошибкой
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Игнорируем NotFoundError
    if (error.name === 'NotFoundError' || error.message?.includes('can not be found here')) {
      console.debug('[ErrorBoundary] Caught and ignored NotFoundError');
      return; // Ничего не делаем
    }
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
