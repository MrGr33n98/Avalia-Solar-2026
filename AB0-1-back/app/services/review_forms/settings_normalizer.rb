module ReviewForms
  class SettingsNormalizer
    DEFAULTS = ReviewForm::DEFAULT_SETTINGS

    def self.call(settings)
      normalized = DEFAULTS.deep_merge((settings || {}).deep_stringify_keys)
      normalized['schema_version'] = 1
      normalized['experience'] = (normalized['experience'] || {}).deep_stringify_keys
      normalized['questions'] = (normalized['questions'] || {}).deep_stringify_keys
      normalized
    end
  end
end
