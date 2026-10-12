import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription } from './dialog';

describe('Dialog Component with hideCloseButton prop', () => {
  test('renders default close button when hideCloseButton is false or omitted', () => {
    render(
      <Dialog open={true}>
        <DialogContent fallbackTitle="Test Dialog">
          <DialogDescription className="sr-only">Description</DialogDescription>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('suppresses default close button when hideCloseButton is true', () => {
    render(
      <Dialog open={true}>
        <DialogContent fallbackTitle="Test Dialog" hideCloseButton={true}>
          <DialogDescription className="sr-only">Description</DialogDescription>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });
});
