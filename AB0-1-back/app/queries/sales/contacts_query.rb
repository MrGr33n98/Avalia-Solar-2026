module Sales
  class ContactsQuery
    attr_reader :params, :scope

    def initialize(params = {}, scope: ::Sales::Contact.all)
      @params = params
      @scope = scope
    end

    def call
      result = scope.includes(:account, :user, :contact_employments, :activities, :tasks)

      if params[:q].present?
        q = "%#{params[:q].to_s.downcase}%"
        result = result.where(
          'LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(job_title) LIKE ?',
          q, q, q, q
        )
      end

      if params[:owner_id].present?
        if params[:owner_id] == 'unassigned' || params[:unassigned] == 'true'
          result = result.where(user_id: nil)
        else
          result = result.where(user_id: params[:owner_id])
        end
      elsif params[:unassigned] == 'true'
        result = result.where(user_id: nil)
      end

      account_id = params[:account_id] || params[:sales_account_id]
      result = result.where(sales_account_id: account_id) if account_id.present?
      result = result.where(decision_role: params[:decision_role]) if params[:decision_role].present?

      if params[:stale] == 'true'
        thirty_days_ago = 30.days.ago
        result = result.left_joins(:activities)
                       .group('sales_contacts.id')
                       .having('MAX(sales_activities.occurred_at) IS NULL OR MAX(sales_activities.occurred_at) < ?', thirty_days_ago)
      end

      sort_column = %w[created_at first_name last_name email decision_role].include?(params[:sort]) ? params[:sort] : 'created_at'
      sort_direction = %w[asc desc].include?(params[:direction]) ? params[:direction] : 'desc'

      result.order("sales_contacts.#{sort_column} #{sort_direction}")
    end
  end
end
