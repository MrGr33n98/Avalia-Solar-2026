# frozen_string_literal: true

module Feed
  class Serializer
    def initialize(feed_items, current_user: nil, view: nil)
      @feed_items = Array(feed_items)
      @current_user = current_user
      @view = view.presence || 'for_you'
      preload_associations
      subjects = @feed_items.map(&:subject).compact
      @engagement = EngagementLoader.new(subjects: subjects, current_user: @current_user).call
      @publication_entities = publication_entities(subjects)
    end

    def serialize
      @feed_items.map { |item| serialize_item(item) }
    end

    private

    def preload_associations
      return if @feed_items.empty?

      if defined?(ActiveRecord::Associations::Preloader)
        ActiveRecord::Associations::Preloader.new(
          records: @feed_items,
          associations: [:actor, :subject]
        ).call

        users = @feed_items.map(&:actor).compact.select { |a| a.is_a?(User) }
        if users.any?
          ActiveRecord::Associations::Preloader.new(
            records: users,
            associations: [:reviewer_profile, avatar_attachment: :blob]
          ).call
        end

        reviews = @feed_items.map(&:subject).compact.select { |s| s.is_a?(Review) }
        if reviews.any?
          ActiveRecord::Associations::Preloader.new(
            records: reviews,
            associations: { company: [:categories, logo_attachment: :blob] }
          ).call
        end

        publications = @feed_items.map(&:subject).compact.select { |s| s.is_a?(ReviewerPublication) }
        if publications.any?
          ActiveRecord::Associations::Preloader.new(
            records: publications,
            associations: [
              { cover_image_attachment: :blob },
              :reviewer_publication_comments,
              :reviewer_publication_likes
            ]
          ).call
        end

        polls = @feed_items.map(&:subject).compact.select { |s| s.is_a?(Poll) }
        ActiveRecord::Associations::Preloader.new(records: polls, associations: %i[poll_options poll_votes]).call if polls.any?
      end
    end

    def serialize_item(item)
      subject = item.subject
      actor = item.actor
      normalized_author = serialize_actor(actor)

      {
        id: "feed_#{item.id}",
        type: item.subject_type.underscore,
        verb: item.verb,
        published_at: item.published_at.iso8601,
        visibility: item.visibility,
        ranking_metadata: ranking_metadata(item),
        actor: normalized_author,
        author: normalized_author,
        subject: serialize_subject(subject),
        entities: serialize_entities(subject),
        engagement: serialize_engagement(subject, actor),
        recommendation_reason: recommendation_reason(subject)
      }
    end

    def serialize_actor(actor)
      return {} unless actor

      if actor.is_a?(User)
        profile = actor.reviewer_profile
        avatar_url = actor.avatar_url
        {
          id: actor.id,
          type: profile&.creator_enabled ? 'creator' : 'user',
          name: actor.display_name,
          display_name: actor.display_name,
          slug: profile&.public_slug,
          avatar_url: avatar_url,
          headline: profile&.public_headline || profile&.profession || profile&.bio,
          verified: profile&.try(:verified?) || false,
          followable: profile ? { type: 'ReviewerProfile', id: profile.id } : nil
        }
      elsif actor.is_a?(Company)
        {
          id: actor.id,
          type: 'company',
          name: actor.name,
          display_name: actor.name,
          logo_url: actor.logo_url,
          avatar_url: actor.logo_url,
          slug: actor.slug,
          headline: actor.description || actor.categories.first&.name,
          verified: actor.verified?,
          followable: { type: 'Company', id: actor.id }
        }
      else
        { id: actor.id, type: actor.class.name.underscore }
      end
    end

    def serialize_subject(subject)
      return {} unless subject

      if subject.is_a?(ReviewerPublication)
        {
          id: subject.id,
          title: subject.title,
          slug: subject.slug,
          excerpt: subject.excerpt,
          body: subject.body,
          cover_image_url: attachment_url(subject.cover_image),
          publication_type: subject.publication_type,
          category: subject.category,
          views_count: subject.views_count.to_i,
          shares_count: subject.shares_count.to_i
        }
      elsif subject.is_a?(Review)
        {
          id: subject.id,
          rating: subject.rating,
          headline: subject.headline || subject.comment&.truncate(60),
          comment: subject.comment,
          company: {
            id: subject.company_id,
            name: subject.company&.name,
            slug: subject.company&.slug,
            logo_url: subject.company&.logo_url,
            rating: subject.company&.rating_avg,
            category_name: subject.company&.categories&.first&.name
          }
        }
      elsif subject.is_a?(GroupPost)
        GroupPostSerializer.new(subject, current_user: @current_user).as_json.merge(
          group: {
            id: subject.group_id,
            name: subject.group&.name,
            slug: subject.group&.slug,
            visibility: subject.group&.visibility
          }
        )
      elsif subject.is_a?(NewsItem)
        { id: subject.id, title: subject.title, excerpt: subject.summary, source_name: subject.source_name,
          source_url: subject.source_url, category: subject.category, reading_time_minutes: subject.reading_time_minutes,
          published_at: subject.published_at.iso8601 }
      elsif subject.is_a?(Poll)
        viewer_vote = @current_user && subject.poll_votes.find { |vote| vote.user_id == @current_user.id }
        { id: subject.id, title: subject.question, poll_ends_at: subject.ends_at&.iso8601,
          viewer_vote_id: viewer_vote&.poll_option_id,
          options: subject.poll_options.map { |option| { id: option.id, label: option.label, votes_count: option.votes_count.to_i, selected: viewer_vote&.poll_option_id == option.id } } }
      else
        { id: subject.id }
      end
    end

    def serialize_entities(subject)
      return [] unless subject.is_a?(ReviewerPublication)

      @publication_entities.fetch(subject.id, []).map do |pe|
        ent = pe.entity
        {
          relation_type: pe.relation_type,
          entity_type: pe.entity_type.underscore,
          entity: {
            id: ent.id,
            name: ent.try(:name) || ent.try(:title),
            slug: ent.try(:slug)
          }
        }
      end
    end

    def attachment_url(attachment)
      return nil unless attachment&.attached?

      Rails.application.routes.url_helpers.rails_blob_url(
        attachment,
        host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br')
      )
    end

    def publication_entities(subjects)
      ids = subjects.grep(ReviewerPublication).map(&:id)
      return {} if ids.empty?

      PublicationEntity.where(publication_id: ids).includes(:entity).group_by(&:publication_id)
    end

    def serialize_engagement(subject, actor)
      return empty_engagement unless subject
      key = @engagement.key(subject)
      reactions_count = @engagement.reactions_counts[key]
      comments_count = @engagement.comments_counts[key]
      viewer_reaction = @engagement.viewer_reactions[key]
      saved = @engagement.saved_items[key] == true

      {
        reactions_count: reactions_count,
        comments_count: comments_count,
        viewer_reaction: viewer_reaction,
        saved: saved,
        viewer_following: viewer_following?(actor_followable(actor))
      }
    end

    def recommendation_reason(subject)
      return { code: 'following', label: 'De alguém que você segue' } if @view == 'following'
      return { code: 'recent', label: 'Publicado recentemente' } if @view == 'recent'

      key = @engagement.key(subject)
      score = @engagement.reactions_counts[key].to_i + (@engagement.comments_counts[key].to_i * 3)
      score.positive? ? { code: 'engagement', label: 'Em alta na comunidade' } : { code: 'personalized', label: 'Selecionado para você' }
    end

    def ranking_metadata(item)
      return { mode: 'recent' } unless item.respond_to?(:engagement_score) && item.engagement_score

      { mode: @view, score: item.engagement_score.to_f.round(4) }
    end

    def empty_engagement
      { reactions_count: 0, comments_count: 0, viewer_reaction: nil, saved: false, viewer_following: false }
    end

    def actor_followable(actor)
      return actor.reviewer_profile if actor.is_a?(User)
      return actor if actor.is_a?(Company)

      nil
    end

    def viewer_following?(followable)
      return false unless @current_user && followable

      @viewer_follow_keys ||= @current_user.social_follows.pluck(:followable_type, :followable_id).to_set
      @viewer_follow_keys.include?([followable.class.base_class.name, followable.id])
    end
  end
end
