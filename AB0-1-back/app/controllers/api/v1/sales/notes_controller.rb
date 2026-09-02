module Api
  module V1
    module Sales
      class NotesController < BaseController
        def index
          notes = ::Sales::Note.where(account_id: params[:account_id]).order(created_at: :desc)
          render json: { notes: notes.map { |note| serialize(note) } }
        end

        def create
          note = ::Sales::Note.create!(note_params.merge(author: current_user))
          ::Sales::AuditRecorder.call(record: note, action: 'created', actor: current_user,
                                      request_id: request.request_id, ip: request.remote_ip)
          render json: { note: serialize(note) }, status: :created
        end

        def update
          note = ::Sales::Note.find(params[:id])
          note.update!(note_params)
          render json: { note: serialize(note) }
        end

        private

        def note_params
          params.require(:note).permit(:account_id, :opportunity_id, :contact_id, :title, :body, :pinned)
        end

        def serialize(note)
          { id: note.id, account_id: note.account_id, opportunity_id: note.opportunity_id,
            contact_id: note.contact_id, author_id: note.author_id, title: note.title,
            body: note.body, pinned: note.pinned, created_at: note.created_at, updated_at: note.updated_at }
        end
      end
    end
  end
end
