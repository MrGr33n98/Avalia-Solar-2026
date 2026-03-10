describe('CategoryDropdownItem - Mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-14');
    cy.visit('/categories');
  });

  it('opens and closes the submenu on tap when the dropdown is present', () => {
    cy.get('[data-testid^="category-"]')
      .first()
      .then(($toggle) => {
        if (!$toggle.length) return;

        cy.wrap($toggle).click();
        cy.wrap($toggle).should('have.attr', 'aria-expanded', 'true');

        cy.wrap($toggle).click();
        cy.wrap($toggle).should('have.attr', 'aria-expanded', 'false');
      });
  });
});
