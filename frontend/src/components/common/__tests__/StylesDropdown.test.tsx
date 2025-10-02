import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StylesDropdown from '../StylesDropdown';

describe('StylesDropdown', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(<StylesDropdown {...defaultProps} placeholder="Select style..." />);
    
    expect(screen.getByText('Select style...')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<StylesDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    expect(screen.getByText('Cartoon')).toBeInTheDocument();
    expect(screen.getByText('Oil Painting')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <StylesDropdown {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('Photorealistic')).not.toBeInTheDocument();
    });
  });

  it('calls onChange when style is selected', () => {
    const onChange = vi.fn();
    render(<StylesDropdown {...defaultProps} onChange={onChange} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    fireEvent.click(screen.getByText('Photorealistic'));
    
    expect(onChange).toHaveBeenCalledWith('photorealistic');
  });

  it('displays selected style correctly', () => {
    render(<StylesDropdown {...defaultProps} value="photorealistic" />);
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
  });

  it('filters styles based on search term', () => {
    render(<StylesDropdown {...defaultProps} showSearch={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'photo' } });
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    expect(screen.queryByText('Cartoon')).not.toBeInTheDocument();
  });

  it('filters styles by category', () => {
    render(<StylesDropdown {...defaultProps} showCategories={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    fireEvent.click(screen.getByText('Artistic'));
    
    expect(screen.getByText('Oil Painting')).toBeInTheDocument();
    expect(screen.getByText('Watercolor')).toBeInTheDocument();
    expect(screen.queryByText('Photorealistic')).not.toBeInTheDocument();
  });

  it('shows "No styles found" when search returns no results', () => {
    render(<StylesDropdown {...defaultProps} showSearch={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No styles found')).toBeInTheDocument();
  });

  it('clears search when "Clear search" is clicked', () => {
    render(<StylesDropdown {...defaultProps} showSearch={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No styles found')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Clear search'));
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<StylesDropdown {...defaultProps} disabled={true} />);
    
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
    
    fireEvent.click(trigger);
    expect(screen.queryByText('Photorealistic')).not.toBeInTheDocument();
  });

  it('shows popular badge for popular styles', () => {
    render(<StylesDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('groups styles by category when showCategories is true', () => {
    render(<StylesDropdown {...defaultProps} showCategories={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    expect(screen.getByText('Artistic')).toBeInTheDocument();
    expect(screen.getByText('Anime & Manga')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<StylesDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    
    fireEvent.keyDown(trigger, { key: 'Escape' });
    
    expect(screen.queryByText('Photorealistic')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StylesDropdown {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('accessibility: has proper ARIA attributes', () => {
    render(<StylesDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('accessibility: search input has proper label', () => {
    render(<StylesDropdown {...defaultProps} showSearch={true} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('accessibility: options are properly labeled', () => {
    render(<StylesDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const photoOption = screen.getByText('Photorealistic');
    expect(photoOption.closest('button')).toBeInTheDocument();
  });

  it('shows selection indicator for selected style', () => {
    render(<StylesDropdown {...defaultProps} value="photorealistic" />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    // The selected style should have a visual indicator
    const selectedOption = screen.getByText('Photorealistic').closest('button');
    expect(selectedOption).toHaveClass('bg-blue-50');
  });

  it('handles empty value correctly', () => {
    render(<StylesDropdown {...defaultProps} value="" />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    fireEvent.click(screen.getByText('No Style'));
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('');
  });
});
