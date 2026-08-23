namespace :feed do
  desc 'Cria FeedItems ausentes para publicações públicas já publicadas'
  task backfill_published_publications: :environment do
    publications = ReviewerPublication.published.includes(:user)
    puts "Publicações publicadas encontradas: #{publications.count}."
    created = 0
    skipped = 0

    publications.find_each do |publication|
      feed_item = FeedItem.find_or_initialize_by(
        actor: publication.user,
        subject: publication,
        verb: 'published'
      )
      was_new = feed_item.new_record?
      feed_item.visibility = 'public'
      feed_item.published_at ||= publication.published_at || publication.created_at
      feed_item.save!
      created += 1 if was_new
      skipped += 1 unless was_new
    end

    puts "Backfill concluído: #{created} criados, #{skipped} já existentes."
  end
end
