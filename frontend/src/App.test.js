import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app correctly', () => {
  render(<App />);
  // Check that the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
