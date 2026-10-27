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

      # Nutshell Filter Criteria
      result = result.where.not(email: [nil, '']) if params[:has_email] == 'true'
      result = result.where("phone IS NOT NULL AND phone != '' OR whatsapp IS NOT NULL AND whatsapp != ''") if params[:has_phone] == 'true'
      result = result.where.not(linkedin_url: [nil, '']) if params[:has_linkedin] == 'true'

      if params[:job_title].present?
        if params[:title_exact] == 'true'
          result = result.where('LOWER(job_title) = ?', params[:job_title].to_s.strip.downcase)
        else
          result = result.where('LOWER(job_title) LIKE ?', "%#{params[:job_title].to_s.strip.downcase}%")
        end
      end

      if params[:company_name].present? || params[:state].present? || params[:city].present? || params[:segment].present?
        result = result.joins(:account)
        result = result.where('LOWER(sales_accounts.name) LIKE ?', "%#{params[:company_name].to_s.strip.downcase}%") if params[:company_name].present?
        result = result.where('LOWER(sales_accounts.state) = ?', params[:state].to_s.strip.downcase) if params[:state].present?
        result = result.where('LOWER(sales_accounts.city) LIKE ?', "%#{params[:city].to_s.strip.downcase}%") if params[:city].present?
        result = result.where('LOWER(sales_accounts.segment) LIKE ?', "%#{params[:segment].to_s.strip.downcase}%") if params[:segment].present?
      end

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
