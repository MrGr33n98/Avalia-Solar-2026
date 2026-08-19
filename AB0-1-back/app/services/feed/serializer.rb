# frozen_string_literal: true

module Feed
  class Serializer
    def initialize(feed_items, current_user: nil)
      @feed_items = Array(feed_items)
      @current_user = current_user
    end

    def serialize
      @feed_items.map { |item| serialize_item(item) }
    end

    private

    def serialize_item(item)
      subject = item.subject
      actor = item.actor

      {
        id: "feed_#{item.id}",
        type: item.subject_type.underscore,
        verb: item.verb,
        published_at: item.published_at.iso8601,
        actor: serialize_actor(actor),
        subject: serialize_subject(subject),
        entities: serialize_entities(subject),
        engagement: serialize_engagement(subject)
      }
    end

    def serialize_actor(actor)
      return {} unless actor

      if actor.is_a?(User)
        profile = ReviewerProfile.find_by(user_id: actor.id)
        {
          id: actor.id,
          type: 'user',
          name: actor.name,
          avatar_url: profile&.avatar_url,
          headline: profile&.bio,
          verified: profile&.verified? || false
        }
      elsif actor.is_a?(Company)
        {
          id: actor.id,
          type: 'company',
          name: actor.name,
          logo_url: actor.logo_url,
          slug: actor.slug,
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
          cover_image_url: subject.cover_image
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
            slug: subject.company&.slug
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
