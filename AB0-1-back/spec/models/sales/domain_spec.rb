require "rails_helper"

RSpec.describe "Sales domain", type: :model do
  let!(:owner) { create(:user, role: :admin, company: nil) }
  let!(:pipeline) { Sales::Pipeline.create!(name: "B2B", key: "b2b_sales") }
  let!(:prospect) { pipeline.stages.create!(name: "Prospect", key: "prospect", position: 0, probability: 10) }
  let!(:contacted) { pipeline.stages.create!(name: "Contacted", key: "contacted", position: 1, probability: 20) }
  let!(:account) { Sales::Account.create!(name: "Acme", owner: owner) }

  it "persists account, contact, opportunity and stage transition audit" do
    contact = account.contacts.create!(first_name: "Ana")
    opportunity = account.opportunities.create!(name: "Projeto solar", pipeline: pipeline, stage: prospect, owner: owner)

    expect { Sales::Opportunities::ChangeStage.call(opportunity:, stage: contacted, actor: owner) }.to change(Sales::StageHistory, :count).by(1).and change(DomainEvent, :count).by(1)

    expect(opportunity.reload.stage).to eq(contacted)
    expect(contact.reload.account).to eq(account)
    expect(DomainEvent.last.event_type).to eq("sales.opportunity.stage_changed")
  end

  it "persists qualification and task lifecycle" do
    opportunity = account.opportunities.create!(name: "Projeto", pipeline: pipeline, stage: prospect, owner: owner)
    qualification = opportunity.create_qualification!(situation: "S", budget: "B")
    task = opportunity.tasks.create!(account:, owner:, task_type: "follow_up", title: "Ligar", due_at: 1.day.from_now)
    task.update!(status: "completed", completed_at: Time.current)
    expect(qualification.reload.situation).to eq("S")
    expect(task.reload.status).to eq("completed")
    expect(task.completed_at).to be_present
  end
end
