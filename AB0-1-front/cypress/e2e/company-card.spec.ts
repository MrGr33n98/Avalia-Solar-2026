describe('CompanyCard Logo Display', () => {
  it('exibe logo corretamente em mobile', () => {
    cy.viewport(320, 568);
    cy.visit('/');
    cy.get('[data-testid="company-logo"]').should('be.visible').and('have.attr', 'src').should('not.be.empty');
  });

  it('usa fallback se logo ausente', () => {
    cy.visit('/'); // Assuma um card sem logo
    cy.get('[data-testid="logo-placeholder"]').should('be.visible');
  });

  it('mantém proporções em desktop', () => {
    cy.viewport(1024, 768);
    cy.visit('/companies');
    cy.get('[data-testid="company-logo"]').should('have.class', 'aspect-square');
  });
});