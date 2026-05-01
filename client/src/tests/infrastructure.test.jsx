import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
  it('should render a component', () => {
    render(<div>Hello TaniHR</div>);
    expect(screen.getByText('Hello TaniHR')).toBeInTheDocument();
  });

  it('should have jest-dom matchers available', () => {
    render(<button disabled>Click me</button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
