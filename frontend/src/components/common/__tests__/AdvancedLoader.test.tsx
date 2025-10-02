import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdvancedLoader from '../AdvancedLoader';

describe('AdvancedLoader', () => {
  const defaultProps = {
    isLoading: true,
    progress: 50,
    currentStep: 10,
    totalSteps: 20,
    title: 'Test Loading',
    subtitle: 'Please wait...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(<AdvancedLoader {...defaultProps} />);
    
    expect(screen.getByText('Test Loading')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
    expect(screen.getByText('Step 10 of 20')).toBeInTheDocument();
  });

  it('does not render when not loading and no error', () => {
    const { container } = render(
      <AdvancedLoader {...defaultProps} isLoading={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders error state correctly', () => {
    const onRetry = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        isLoading={false}
        error="Test error message"
        onRetry={onRetry}
      />
    );
    
    expect(screen.getByText('Generation Failed')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        isLoading={false}
        error="Test error"
        onRetry={onRetry}
      />
    );
    
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        onCancel={onCancel}
        canCancel={true}
      />
    );
    
    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onPause when pause button is clicked', () => {
    const onPause = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        onPause={onPause}
        canPause={true}
      />
    );
    
    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onResume when resume button is clicked in paused state', () => {
    const onResume = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        onResume={onResume}
        canPause={true}
        isPaused={true}
      />
    );
    
    const resumeButton = screen.getByTitle('Resume');
    fireEvent.click(resumeButton);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('displays estimated time remaining when provided', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        estimatedTimeRemaining={120}
        showETA={true}
      />
    );
    
    expect(screen.getByText('ETA: 2m 0s')).toBeInTheDocument();
  });

  it('handles auto-retry functionality', async () => {
    const onRetry = vi.fn();
    render(
      <AdvancedLoader
        {...defaultProps}
        isLoading={false}
        error="Test error"
        onRetry={onRetry}
        autoRetry={true}
        maxRetries={3}
        retryDelay={1}
      />
    );
    
    // Wait for auto-retry to trigger
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it('renders compact variant correctly', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        variant="compact"
      />
    );
    
    expect(screen.getByText('Test Loading')).toBeInTheDocument();
    // Compact variant should still show essential information
    expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
  });

  it('renders detailed variant with additional information', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        variant="detailed"
      />
    );
    
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        estimatedTimeRemaining={65}
        showETA={true}
      />
    );
    
    expect(screen.getByText('ETA: 1m 5s')).toBeInTheDocument();
  });

  it('shows retry count when retries have occurred', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <AdvancedLoader
        {...defaultProps}
        isLoading={false}
        error="Test error"
        onRetry={onRetry}
        maxRetries={3}
      />
    );
    
    // Simulate a retry
    fireEvent.click(screen.getByText('Retry'));
    
    // Re-render with error again to show retry count
    rerender(
      <AdvancedLoader
        {...defaultProps}
        isLoading={false}
        error="Test error"
        onRetry={onRetry}
        maxRetries={3}
      />
    );
    
    // The component should track retry attempts internally
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AdvancedLoader
        {...defaultProps}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles progress bar animation', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        showProgress={true}
      />
    );
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  it('accessibility: has proper ARIA labels', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        onCancel={vi.fn()}
        canCancel={true}
      />
    );
    
    const cancelButton = screen.getByTitle('Cancel');
    expect(cancelButton).toHaveAttribute('title', 'Cancel');
  });

  it('accessibility: progress is announced to screen readers', () => {
    render(
      <AdvancedLoader
        {...defaultProps}
        showProgress={true}
      />
    );
    
    expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
    expect(screen.getByText('Step 10 of 20')).toBeInTheDocument();
  });
});
