import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { active: Boolean }
  static targets = ["checkbox"]

  connect() {
    this.apply()
    document.addEventListener('visibilitychange', this.handleVisibility)
  }

  disconnect() {
    document.removeEventListener('visibilitychange', this.handleVisibility)
  }

  handleVisibility = () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const el = this.previewElement()
    if (!el) return
    el.style.animationPlayState = document.hidden ? 'paused' : 'running'
  }

  toggleFromCheckbox() {
    const checked = this.checkboxTarget?.checked
    this.activeValue = !!checked
    this.apply()
  }

  apply() {
    const el = this.previewElement()
    if (!el) return
    el.classList.toggle('effect-active', !!this.activeValue)
  }

  previewElement() {
    if (this.element.classList.contains('company-card')) return this.element
    return this.element.querySelector('.company-card.admin-preview')
  }
}
