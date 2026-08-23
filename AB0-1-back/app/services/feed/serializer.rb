# frozen_string_literal: true

module Feed
  class Serializer
    def initialize(feed_items, current_user: nil)
      @feed_items = Array(feed_items)
      @current_user = current_user
      preload_associations
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
              :reviewer_publication_events,
              :reviewer_publication_comments,
              :reviewer_publication_likes
            ]
          ).call
        end
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
        actor: normalized_author,
        author: normalized_author,
        subject: serialize_subject(subject),
        entities: serialize_entities(subject),
        engagement: serialize_engagement(subject)
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
          verified: profile&.try(:verified?) || false
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
          verified: actor.verified?
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
          views_count: publication_events(subject).count { |event| event.event_name == 'publication_view' },
          shares_count: publication_events(subject).count { |event| event.event_name == 'publication_share' }
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
      else
        { id: subject.id }
      end
    end

    def serialize_entities(subject)
      return [] unless subject.is_a?(ReviewerPublication)

      PublicationEntity.where(publication_id: subject.id).includes(:entity).map do |pe|
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

    def publication_events(subject)
      if subject.association(:reviewer_publication_events).loaded?
        subject.reviewer_publication_events
      else
        ReviewerPublicationEvent.where(reviewer_publication_id: subject.id)
      end
    end

    def serialize_engagement(subject)
      return { reactions_count: 0, comments_count: 0, viewer_reaction: nil, saved: false } unless subject

      reactions_count = Reaction.where(reactable: subject).count
      comments_count = Comment.where(commentable: subject).active.count

      viewer_reaction = if @current_user
                          Reaction.find_by(user: @current_user, reactable: subject)&.reaction_type
                        end

      saved = if @current_user
                SavedItem.exists?(user: @current_user, saveable: subject)
              else
                false
              end

      {
        reactions_count: reactions_count,
        comments_count: comments_count,
        viewer_reaction: viewer_reaction,
        saved: saved
      }
    end
  end
end
