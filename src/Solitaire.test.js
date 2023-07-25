import { render, screen } from '@testing-library/react';

import Solitaire from './Solitaire';

test.skip('renders learn react link', () => {
  render(<Solitaire />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
