require "rails_helper"

RSpec.describe Sales::Task, type: :model do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: "Acme", owner: owner) }

  it "validates task_type, title, status presence" do
    task = Sales::Task.new(account: account, owner: owner)
    expect(task).not_to be_valid
    expect(task.errors[:task_type]).to include("can't be blank")
    expect(task.errors[:title]).to include("can't be blank")
  end

  it "creates with valid attributes" do
    task = account.tasks.create!(owner: owner, task_type: "follow_up", title: "Ligar para cliente", status: "pending")
    expect(task).to be_persisted
    expect(task.status).to eq("pending")
  end

  it "completes task with timestamp" do
    task = account.tasks.create!(owner: owner, task_type: "follow_up", title: "Ligar", status: "pending", due_at: 1.day.from_now)
    task.update!(status: "completed", completed_at: Time.current)
    expect(task.reload.status).to eq("completed")
    expect(task.completed_at).to be_present
  end

  it "scopes pending tasks" do
    account.tasks.create!(owner: owner, task_type: "follow_up", title: "Pending", status: "pending")
    account.tasks.create!(owner: owner, task_type: "follow_up", title: "Done", status: "completed")
    expect(Sales::Task.pending.count).to eq(1)
  end

  it "scopes overdue tasks" do
    account.tasks.create!(owner: owner, task_type: "follow_up", title: "Overdue", status: "pending", due_at: 2.days.ago)
    account.tasks.create!(owner: owner, task_type: "follow_up", title: "Future", status: "pending", due_at: 2.days.from_now)
    expect(Sales::Task.overdue.count).to eq(1)
  end
end
