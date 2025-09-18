import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Campus Connect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Campus Connect/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders Login button', () => {
  render(<App />);
  const loginButton = screen.getByText(/Login/i);
  expect(loginButton).toBeInTheDocument();
});
