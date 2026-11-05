import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ServiceGallery from './ServiceGallery';

jest.mock('next/image', () => {
  const MockImage = (props: { alt: string; src: string }) => (
    <img src={props.src} alt={props.alt} />
  );
  MockImage.displayName = 'MockImage';
  return MockImage;
});

describe('ServiceGallery', () => {
  it('shows an accessible empty state when the company has not uploaded images', () => {
    render(<ServiceGallery serviceName="Armazenamento de energia" images={[]} />);
    expect(screen.getByText('Imagens do serviço em preparação')).toBeInTheDocument();
  });

  it('moves through images and allows switching by thumbnail', () => {
    render(
      <ServiceGallery
        serviceName="Armazenamento de energia"
        images={['https://example.com/first.jpg', 'https://example.com/second.jpg']}
      />,
    );

    expect(screen.getByAltText(/imagem 1 de 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /próxima imagem/i }));
    expect(screen.getByAltText(/imagem 2 de 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /mostrar imagem 1/i }));
    expect(screen.getByAltText(/imagem 1 de 2/i)).toBeInTheDocument();
  });
});
