module CompanyClaimSerialization
  def claimed
    members = object.association(:company_members)
    return members.target.any? { |member| member.active? && member.owner? } if members.loaded?

    object.company_members.owners.exists?
  end
end
