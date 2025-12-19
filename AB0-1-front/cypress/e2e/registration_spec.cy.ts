/// <reference types="cypress" />

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register-user');
  });

  it('successfully registers a new user', () => {
    cy.get('input#name').type('Test User');
    cy.get('input#email').type('test@company.com');
    cy.get('input#password').type('Password123!');
    cy.get('input#password_confirmation').type('Password123!');
    cy.get('input#dob').type('1990-01-01');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    cy.contains('Cadastro enviado com sucesso').should('be.visible');
  });

  it('shows error for mismatched passwords', () => {
    cy.get('input#password').type('Password123!');
    cy.get('input#password_confirmation').type('WrongPass');
    cy.get('button[type="submit"]').click();
    cy.contains('Senha e confirmação não conferem').should('be.visible');
  });
});
