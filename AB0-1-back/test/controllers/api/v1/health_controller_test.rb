require 'test_helper'

class Api::V1::HealthControllerTest < ActiveSupport::TestCase
  test 'does not require dashboard authentication callbacks' do
    callbacks = Api::V1::HealthController._process_action_callbacks
                                       .select { |callback| callback.kind == :before }
                                       .map(&:filter)

    assert_not_includes callbacks, :authenticate_user!
  end
end
