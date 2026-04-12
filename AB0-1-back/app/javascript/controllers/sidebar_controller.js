import { Controller } from "@hotwired/stimulus"

// Controla colapso/expansão da sidebar do app.avaliasolar.com.br
export default class extends Controller {
  static targets = ["nav"]

  connect() {
    // Restaura estado salvo
    const collapsed = localStorage.getItem("app_sidebar_collapsed") === "true"
    if (collapsed) this.collapse()
  }

  toggle() {
    if (this.navTarget.classList.contains("w-64")) {
      this.collapse()
    } else {
      this.expand()
    }
  }

  collapse() {
    this.navTarget.classList.remove("w-64")
    this.navTarget.classList.add("w-16")
    // Esconde labels, mantém ícones
    this.navTarget.querySelectorAll("span:not(.shrink-0)").forEach(el => {
      el.classList.add("hidden")
    })
    localStorage.setItem("app_sidebar_collapsed", "true")
  }

  expand() {
    this.navTarget.classList.remove("w-16")
    this.navTarget.classList.add("w-64")
    this.navTarget.querySelectorAll("span:not(.shrink-0)").forEach(el => {
      el.classList.remove("hidden")
    })
    localStorage.setItem("app_sidebar_collapsed", "false")
  }
}
