namespace :social do
  desc 'Reprocessa eventos pendentes do outbox social'
  task process_outbox: :environment do
    Social::ProcessOutboxEventsJob.perform_now
  end
end
