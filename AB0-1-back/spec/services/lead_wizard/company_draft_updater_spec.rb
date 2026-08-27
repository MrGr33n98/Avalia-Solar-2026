require 'rails_helper'

RSpec.describe LeadWizard::CompanyDraftUpdater do
  let(:draft) do
    LeadWizardVersion.create!(
      company: create(:company),
      template_key: 'solar_company',
      template_version: 1,
      status: 'draft'
    )
  end

  it 'persists UI and thank-you configuration from one payload' do
    described_class.call(draft, {
      ui_config: {
        theme: 'dark',
        primary_color: '#123456',
        logo_url: 'https://cdn.example/logo.png',
        show_progress_bar: false
      },
      thank_you_config: {
        title: 'Obrigado',
        message: 'Recebemos seus dados',
        redirect_url: 'https://example.com/obrigado'
      }
    })

    expect(draft.reload).to have_attributes(
      ui_theme: 'dark',
      ui_primary_color: '#123456',
      ui_logo_url: 'https://cdn.example/logo.png',
      show_progress_bar: false,
      thank_you_title: 'Obrigado',
      thank_you_message: 'Recebemos seus dados',
      thank_you_redirect_url: 'https://example.com/obrigado'
    )
  end

  it 'accepts string-keyed payloads' do
    described_class.call(draft, {
      'ui_config' => { 'theme' => 'solar', 'primary_color' => '#ff9900' },
      'thank_you_config' => { 'title' => 'Tudo certo' }
    })

    expect(draft.reload.ui_theme).to eq('solar')
    expect(draft.thank_you_title).to eq('Tudo certo')
  end

  it 'does not change persisted data when save fails' do
    draft.update!(ui_theme: 'solar', thank_you_title: 'Antigo')
    allow(draft).to receive(:save!).and_raise(ActiveRecord::RecordInvalid.new(draft))

    expect { described_class.call(draft, ui_config: { theme: 'dark' }) }
      .to raise_error(ActiveRecord::RecordInvalid)
    expect(draft.reload).to have_attributes(ui_theme: 'solar', thank_you_title: 'Antigo')
  end

  it 'returns the same draft instance' do
    expect(described_class.call(draft, {})).to equal(draft)
  end
end
