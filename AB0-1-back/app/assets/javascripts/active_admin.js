//= require active_admin/base
//= require activeadmin_addons/all
//= require activeadmin/quill_editor/quill
//= require activeadmin/quill_editor_input
//= require admin/location_selector
//= require admin/company_reject_prompt

function initAvaliaAdminLocationSelector() {
  if (
    typeof window !== 'undefined' &&
    window.AvaliaAdminLocationSelector &&
    typeof window.AvaliaAdminLocationSelector.init === 'function'
  ) {
    window.AvaliaAdminLocationSelector.init();
  }
}

document.addEventListener('DOMContentLoaded', initAvaliaAdminLocationSelector);
document.addEventListener('turbo:load', initAvaliaAdminLocationSelector);
