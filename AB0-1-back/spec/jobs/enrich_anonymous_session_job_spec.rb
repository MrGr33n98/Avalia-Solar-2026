require 'rails_helper'

RSpec.describe EnrichAnonymousSessionJob, type: :job do
  let(:session) do
    create(
      :anonymous_session,
      ip_hash: 'hashed-ip',
      stitch_metadata: {}
    )
  end

  it 'stores firmographic enrichment in stitch_metadata when data is resolved' do
    job = described_class.new

    allow(job).to receive(:fetch_firmographic_data_mock).and_return(
      {
        'company_name' => 'SolarEdge Tech',
        'company_domain' => 'solaredge.example',
        'industry' => 'Manufacturing',
        'company_size' => '201-500',
        'city' => 'Sao Paulo',
        'state' => 'SP'
      }
    )

    job.perform(session.id)

    metadata = session.reload.stitch_metadata
    expect(metadata['firmographic_enrichment']).to include(
      'company_name' => 'SolarEdge Tech',
      'company_domain' => 'solaredge.example'
    )
    expect(metadata['enrichment_status']).to eq('enriched')
    expect(metadata['enriched_at']).to be_present
    expect(session).to be_enriched
  end

  it 'marks failed attempts when no firmographic match is found' do
    job = described_class.new

    allow(job).to receive(:fetch_firmographic_data_mock).and_return(nil)

    job.perform(session.id)

    metadata = session.reload.stitch_metadata
    expect(metadata['enrichment_status']).to eq('failed')
    expect(metadata['enrichment_attempted_at']).to be_present
    expect(session.firmographic_enrichment).to eq({})
  end
end
