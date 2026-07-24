class CompanyUploadLimit < ApplicationRecord
  belongs_to :company

  def increment_images!(count = 1)
    update!(images_count: images_count + count)
  end

  def increment_videos!(count = 1)
    update!(videos_count: videos_count + count)
  end

  def increment_projects!(count = 1)
    update!(projects_count: projects_count + count)
  end

  def current_images_count
    images_count
  end

  def current_videos_count
    videos_count
  end

  def current_projects_count
    projects_count
  end

  def to_h
    {
      monthly_limit_mb: monthly_limit_mb,
      images_count: images_count,
      videos_count: videos_count,
      projects_count: projects_count
    }
  end
end