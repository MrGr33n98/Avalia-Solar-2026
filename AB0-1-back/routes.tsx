--[ Route 1 ]--------------------------------------------------------------------------------------
Prefix            | new_admin_user_session
Verb              | GET
URI               | /admin/login(.:format)
Controller#Action | active_admin/devise/sessions#new
--[ Route 2 ]--------------------------------------------------------------------------------------
Prefix            | admin_user_session
Verb              | POST
URI               | /admin/login(.:format)
Controller#Action | active_admin/devise/sessions#create
--[ Route 3 ]--------------------------------------------------------------------------------------
Prefix            | destroy_admin_user_session
Verb              | DELETE|GET
URI               | /admin/logout(.:format)
Controller#Action | active_admin/devise/sessions#destroy
--[ Route 4 ]--------------------------------------------------------------------------------------
Prefix            | new_admin_user_password
Verb              | GET
URI               | /admin/password/new(.:format)
Controller#Action | active_admin/devise/passwords#new
--[ Route 5 ]--------------------------------------------------------------------------------------
Prefix            | edit_admin_user_password
Verb              | GET
URI               | /admin/password/edit(.:format)
Controller#Action | active_admin/devise/passwords#edit
--[ Route 6 ]--------------------------------------------------------------------------------------
Prefix            | admin_user_password
Verb              | PATCH
URI               | /admin/password(.:format)
Controller#Action | active_admin/devise/passwords#update
--[ Route 7 ]--------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/password(.:format)
Controller#Action | active_admin/devise/passwords#update
--[ Route 8 ]--------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/password(.:format)
Controller#Action | active_admin/devise/passwords#create
--[ Route 9 ]--------------------------------------------------------------------------------------
Prefix            | admin_root
Verb              | GET
URI               | /admin(.:format)
Controller#Action | admin/dashboard#index
--[ Route 10 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_admin_users
Verb              | POST
URI               | /admin/admin_users/batch_action(.:format)
Controller#Action | admin/admin_users#batch_action
--[ Route 11 ]-------------------------------------------------------------------------------------
Prefix            | admin_admin_users
Verb              | GET
URI               | /admin/admin_users(.:format)
Controller#Action | admin/admin_users#index
--[ Route 12 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/admin_users(.:format)
Controller#Action | admin/admin_users#create
--[ Route 13 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_admin_user
Verb              | GET
URI               | /admin/admin_users/new(.:format)
Controller#Action | admin/admin_users#new
--[ Route 14 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_admin_user
Verb              | GET
URI               | /admin/admin_users/:id/edit(.:format)
Controller#Action | admin/admin_users#edit
--[ Route 15 ]-------------------------------------------------------------------------------------
Prefix            | admin_admin_user
Verb              | GET
URI               | /admin/admin_users/:id(.:format)
Controller#Action | admin/admin_users#show
--[ Route 16 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/admin_users/:id(.:format)
Controller#Action | admin/admin_users#update
--[ Route 17 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/admin_users/:id(.:format)
Controller#Action | admin/admin_users#update
--[ Route 18 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/admin_users/:id(.:format)
Controller#Action | admin/admin_users#destroy
--[ Route 19 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_articles
Verb              | POST
URI               | /admin/articles/batch_action(.:format)
Controller#Action | admin/articles#batch_action
--[ Route 20 ]-------------------------------------------------------------------------------------
Prefix            | admin_articles
Verb              | GET
URI               | /admin/articles(.:format)
Controller#Action | admin/articles#index
--[ Route 21 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/articles(.:format)
Controller#Action | admin/articles#create
--[ Route 22 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_article
Verb              | GET
URI               | /admin/articles/new(.:format)
Controller#Action | admin/articles#new
--[ Route 23 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_article
Verb              | GET
URI               | /admin/articles/:id/edit(.:format)
Controller#Action | admin/articles#edit
--[ Route 24 ]-------------------------------------------------------------------------------------
Prefix            | admin_article
Verb              | GET
URI               | /admin/articles/:id(.:format)
Controller#Action | admin/articles#show
--[ Route 25 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/articles/:id(.:format)
Controller#Action | admin/articles#update
--[ Route 26 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/articles/:id(.:format)
Controller#Action | admin/articles#update
--[ Route 27 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/articles/:id(.:format)
Controller#Action | admin/articles#destroy
--[ Route 28 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_badges
Verb              | POST
URI               | /admin/badges/batch_action(.:format)
Controller#Action | admin/badges#batch_action
--[ Route 29 ]-------------------------------------------------------------------------------------
Prefix            | admin_badges
Verb              | GET
URI               | /admin/badges(.:format)
Controller#Action | admin/badges#index
--[ Route 30 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/badges(.:format)
Controller#Action | admin/badges#create
--[ Route 31 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_badge
Verb              | GET
URI               | /admin/badges/new(.:format)
Controller#Action | admin/badges#new
--[ Route 32 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_badge
Verb              | GET
URI               | /admin/badges/:id/edit(.:format)
Controller#Action | admin/badges#edit
--[ Route 33 ]-------------------------------------------------------------------------------------
Prefix            | admin_badge
Verb              | GET
URI               | /admin/badges/:id(.:format)
Controller#Action | admin/badges#show
--[ Route 34 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/badges/:id(.:format)
Controller#Action | admin/badges#update
--[ Route 35 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/badges/:id(.:format)
Controller#Action | admin/badges#update
--[ Route 36 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/badges/:id(.:format)
Controller#Action | admin/badges#destroy
--[ Route 37 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_campaign_reviews
Verb              | POST
URI               | /admin/campaign_reviews/batch_action(.:format)
Controller#Action | admin/campaign_reviews#batch_action
--[ Route 38 ]-------------------------------------------------------------------------------------
Prefix            | admin_campaign_reviews
Verb              | GET
URI               | /admin/campaign_reviews(.:format)
Controller#Action | admin/campaign_reviews#index
--[ Route 39 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/campaign_reviews(.:format)
Controller#Action | admin/campaign_reviews#create
--[ Route 40 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_campaign_review
Verb              | GET
URI               | /admin/campaign_reviews/new(.:format)
Controller#Action | admin/campaign_reviews#new
--[ Route 41 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_campaign_review
Verb              | GET
URI               | /admin/campaign_reviews/:id/edit(.:format)
Controller#Action | admin/campaign_reviews#edit
--[ Route 42 ]-------------------------------------------------------------------------------------
Prefix            | admin_campaign_review
Verb              | GET
URI               | /admin/campaign_reviews/:id(.:format)
Controller#Action | admin/campaign_reviews#show
--[ Route 43 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/campaign_reviews/:id(.:format)
Controller#Action | admin/campaign_reviews#update
--[ Route 44 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/campaign_reviews/:id(.:format)
Controller#Action | admin/campaign_reviews#update
--[ Route 45 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/campaign_reviews/:id(.:format)
Controller#Action | admin/campaign_reviews#destroy
--[ Route 46 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_campaigns
Verb              | POST
URI               | /admin/campaigns/batch_action(.:format)
Controller#Action | admin/campaigns#batch_action
--[ Route 47 ]-------------------------------------------------------------------------------------
Prefix            | admin_campaigns
Verb              | GET
URI               | /admin/campaigns(.:format)
Controller#Action | admin/campaigns#index
--[ Route 48 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/campaigns(.:format)
Controller#Action | admin/campaigns#create
--[ Route 49 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_campaign
Verb              | GET
URI               | /admin/campaigns/new(.:format)
Controller#Action | admin/campaigns#new
--[ Route 50 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_campaign
Verb              | GET
URI               | /admin/campaigns/:id/edit(.:format)
Controller#Action | admin/campaigns#edit
--[ Route 51 ]-------------------------------------------------------------------------------------
Prefix            | admin_campaign
Verb              | GET
URI               | /admin/campaigns/:id(.:format)
Controller#Action | admin/campaigns#show
--[ Route 52 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/campaigns/:id(.:format)
Controller#Action | admin/campaigns#update
--[ Route 53 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/campaigns/:id(.:format)
Controller#Action | admin/campaigns#update
--[ Route 54 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/campaigns/:id(.:format)
Controller#Action | admin/campaigns#destroy
--[ Route 55 ]-------------------------------------------------------------------------------------
Prefix            | upload_csv_admin_categories
Verb              | GET
URI               | /admin/categories/upload_csv(.:format)
Controller#Action | admin/categories#upload_csv
--[ Route 56 ]-------------------------------------------------------------------------------------
Prefix            | import_csv_admin_categories
Verb              | POST
URI               | /admin/categories/import_csv(.:format)
Controller#Action | admin/categories#import_csv
--[ Route 57 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_categories
Verb              | POST
URI               | /admin/categories/batch_action(.:format)
Controller#Action | admin/categories#batch_action
--[ Route 58 ]-------------------------------------------------------------------------------------
Prefix            | admin_categories
Verb              | GET
URI               | /admin/categories(.:format)
Controller#Action | admin/categories#index
--[ Route 59 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/categories(.:format)
Controller#Action | admin/categories#create
--[ Route 60 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_category
Verb              | GET
URI               | /admin/categories/new(.:format)
Controller#Action | admin/categories#new
--[ Route 61 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_category
Verb              | GET
URI               | /admin/categories/:id/edit(.:format)
Controller#Action | admin/categories#edit
--[ Route 62 ]-------------------------------------------------------------------------------------
Prefix            | admin_category
Verb              | GET
URI               | /admin/categories/:id(.:format)
Controller#Action | admin/categories#show
--[ Route 63 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/categories/:id(.:format)
Controller#Action | admin/categories#update
--[ Route 64 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/categories/:id(.:format)
Controller#Action | admin/categories#update
--[ Route 65 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/categories/:id(.:format)
Controller#Action | admin/categories#destroy
--[ Route 66 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_companies
Verb              | POST
URI               | /admin/companies/batch_action(.:format)
Controller#Action | admin/companies#batch_action
--[ Route 67 ]-------------------------------------------------------------------------------------
Prefix            | admin_companies
Verb              | GET
URI               | /admin/companies(.:format)
Controller#Action | admin/companies#index
--[ Route 68 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/companies(.:format)
Controller#Action | admin/companies#create
--[ Route 69 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_company
Verb              | GET
URI               | /admin/companies/new(.:format)
Controller#Action | admin/companies#new
--[ Route 70 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_company
Verb              | GET
URI               | /admin/companies/:id/edit(.:format)
Controller#Action | admin/companies#edit
--[ Route 71 ]-------------------------------------------------------------------------------------
Prefix            | admin_company
Verb              | GET
URI               | /admin/companies/:id(.:format)
Controller#Action | admin/companies#show
--[ Route 72 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/companies/:id(.:format)
Controller#Action | admin/companies#update
--[ Route 73 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/companies/:id(.:format)
Controller#Action | admin/companies#update
--[ Route 74 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/companies/:id(.:format)
Controller#Action | admin/companies#destroy
--[ Route 75 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_contents
Verb              | POST
URI               | /admin/contents/batch_action(.:format)
Controller#Action | admin/contents#batch_action
--[ Route 76 ]-------------------------------------------------------------------------------------
Prefix            | admin_contents
Verb              | GET
URI               | /admin/contents(.:format)
Controller#Action | admin/contents#index
--[ Route 77 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/contents(.:format)
Controller#Action | admin/contents#create
--[ Route 78 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_content
Verb              | GET
URI               | /admin/contents/new(.:format)
Controller#Action | admin/contents#new
--[ Route 79 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_content
Verb              | GET
URI               | /admin/contents/:id/edit(.:format)
Controller#Action | admin/contents#edit
--[ Route 80 ]-------------------------------------------------------------------------------------
Prefix            | admin_content
Verb              | GET
URI               | /admin/contents/:id(.:format)
Controller#Action | admin/contents#show
--[ Route 81 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/contents/:id(.:format)
Controller#Action | admin/contents#update
--[ Route 82 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/contents/:id(.:format)
Controller#Action | admin/contents#update
--[ Route 83 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/contents/:id(.:format)
Controller#Action | admin/contents#destroy
--[ Route 84 ]-------------------------------------------------------------------------------------
Prefix            | admin_dashboard
Verb              | GET
URI               | /admin/dashboard(.:format)
Controller#Action | admin/dashboard#index
--[ Route 85 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_feature_groups
Verb              | POST
URI               | /admin/feature_groups/batch_action(.:format)
Controller#Action | admin/feature_groups#batch_action
--[ Route 86 ]-------------------------------------------------------------------------------------
Prefix            | admin_feature_groups
Verb              | GET
URI               | /admin/feature_groups(.:format)
Controller#Action | admin/feature_groups#index
--[ Route 87 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/feature_groups(.:format)
Controller#Action | admin/feature_groups#create
--[ Route 88 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_feature_group
Verb              | GET
URI               | /admin/feature_groups/new(.:format)
Controller#Action | admin/feature_groups#new
--[ Route 89 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_feature_group
Verb              | GET
URI               | /admin/feature_groups/:id/edit(.:format)
Controller#Action | admin/feature_groups#edit
--[ Route 90 ]-------------------------------------------------------------------------------------
Prefix            | admin_feature_group
Verb              | GET
URI               | /admin/feature_groups/:id(.:format)
Controller#Action | admin/feature_groups#show
--[ Route 91 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/feature_groups/:id(.:format)
Controller#Action | admin/feature_groups#update
--[ Route 92 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/feature_groups/:id(.:format)
Controller#Action | admin/feature_groups#update
--[ Route 93 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/feature_groups/:id(.:format)
Controller#Action | admin/feature_groups#destroy
--[ Route 94 ]-------------------------------------------------------------------------------------
Prefix            | batch_action_admin_forum_answers
Verb              | POST
URI               | /admin/forum_answers/batch_action(.:format)
Controller#Action | admin/forum_answers#batch_action
--[ Route 95 ]-------------------------------------------------------------------------------------
Prefix            | admin_forum_answers
Verb              | GET
URI               | /admin/forum_answers(.:format)
Controller#Action | admin/forum_answers#index
--[ Route 96 ]-------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/forum_answers(.:format)
Controller#Action | admin/forum_answers#create
--[ Route 97 ]-------------------------------------------------------------------------------------
Prefix            | new_admin_forum_answer
Verb              | GET
URI               | /admin/forum_answers/new(.:format)
Controller#Action | admin/forum_answers#new
--[ Route 98 ]-------------------------------------------------------------------------------------
Prefix            | edit_admin_forum_answer
Verb              | GET
URI               | /admin/forum_answers/:id/edit(.:format)
Controller#Action | admin/forum_answers#edit
--[ Route 99 ]-------------------------------------------------------------------------------------
Prefix            | admin_forum_answer
Verb              | GET
URI               | /admin/forum_answers/:id(.:format)
Controller#Action | admin/forum_answers#show
--[ Route 100 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/forum_answers/:id(.:format)
Controller#Action | admin/forum_answers#update
--[ Route 101 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/forum_answers/:id(.:format)
Controller#Action | admin/forum_answers#update
--[ Route 102 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/forum_answers/:id(.:format)
Controller#Action | admin/forum_answers#destroy
--[ Route 103 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_forum_questions
Verb              | POST
URI               | /admin/forum_questions/batch_action(.:format)
Controller#Action | admin/forum_questions#batch_action
--[ Route 104 ]------------------------------------------------------------------------------------
Prefix            | admin_forum_questions
Verb              | GET
URI               | /admin/forum_questions(.:format)
Controller#Action | admin/forum_questions#index
--[ Route 105 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/forum_questions(.:format)
Controller#Action | admin/forum_questions#create
--[ Route 106 ]------------------------------------------------------------------------------------
Prefix            | new_admin_forum_question
Verb              | GET
URI               | /admin/forum_questions/new(.:format)
Controller#Action | admin/forum_questions#new
--[ Route 107 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_forum_question
Verb              | GET
URI               | /admin/forum_questions/:id/edit(.:format)
Controller#Action | admin/forum_questions#edit
--[ Route 108 ]------------------------------------------------------------------------------------
Prefix            | admin_forum_question
Verb              | GET
URI               | /admin/forum_questions/:id(.:format)
Controller#Action | admin/forum_questions#show
--[ Route 109 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/forum_questions/:id(.:format)
Controller#Action | admin/forum_questions#update
--[ Route 110 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/forum_questions/:id(.:format)
Controller#Action | admin/forum_questions#update
--[ Route 111 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/forum_questions/:id(.:format)
Controller#Action | admin/forum_questions#destroy
--[ Route 112 ]------------------------------------------------------------------------------------
Prefix            | upload_csv_admin_leads
Verb              | GET
URI               | /admin/leads/upload_csv(.:format)
Controller#Action | admin/leads#upload_csv
--[ Route 113 ]------------------------------------------------------------------------------------
Prefix            | import_csv_admin_leads
Verb              | POST
URI               | /admin/leads/import_csv(.:format)
Controller#Action | admin/leads#import_csv
--[ Route 114 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_leads
Verb              | POST
URI               | /admin/leads/batch_action(.:format)
Controller#Action | admin/leads#batch_action
--[ Route 115 ]------------------------------------------------------------------------------------
Prefix            | admin_leads
Verb              | GET
URI               | /admin/leads(.:format)
Controller#Action | admin/leads#index
--[ Route 116 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/leads(.:format)
Controller#Action | admin/leads#create
--[ Route 117 ]------------------------------------------------------------------------------------
Prefix            | new_admin_lead
Verb              | GET
URI               | /admin/leads/new(.:format)
Controller#Action | admin/leads#new
--[ Route 118 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_lead
Verb              | GET
URI               | /admin/leads/:id/edit(.:format)
Controller#Action | admin/leads#edit
--[ Route 119 ]------------------------------------------------------------------------------------
Prefix            | admin_lead
Verb              | GET
URI               | /admin/leads/:id(.:format)
Controller#Action | admin/leads#show
--[ Route 120 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/leads/:id(.:format)
Controller#Action | admin/leads#update
--[ Route 121 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/leads/:id(.:format)
Controller#Action | admin/leads#update
--[ Route 122 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/leads/:id(.:format)
Controller#Action | admin/leads#destroy
--[ Route 123 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_plans
Verb              | POST
URI               | /admin/plans/batch_action(.:format)
Controller#Action | admin/plans#batch_action
--[ Route 124 ]------------------------------------------------------------------------------------
Prefix            | admin_plans
Verb              | GET
URI               | /admin/plans(.:format)
Controller#Action | admin/plans#index
--[ Route 125 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/plans(.:format)
Controller#Action | admin/plans#create
--[ Route 126 ]------------------------------------------------------------------------------------
Prefix            | new_admin_plan
Verb              | GET
URI               | /admin/plans/new(.:format)
Controller#Action | admin/plans#new
--[ Route 127 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_plan
Verb              | GET
URI               | /admin/plans/:id/edit(.:format)
Controller#Action | admin/plans#edit
--[ Route 128 ]------------------------------------------------------------------------------------
Prefix            | admin_plan
Verb              | GET
URI               | /admin/plans/:id(.:format)
Controller#Action | admin/plans#show
--[ Route 129 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/plans/:id(.:format)
Controller#Action | admin/plans#update
--[ Route 130 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/plans/:id(.:format)
Controller#Action | admin/plans#update
--[ Route 131 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/plans/:id(.:format)
Controller#Action | admin/plans#destroy
--[ Route 132 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_pricings
Verb              | POST
URI               | /admin/pricings/batch_action(.:format)
Controller#Action | admin/pricings#batch_action
--[ Route 133 ]------------------------------------------------------------------------------------
Prefix            | admin_pricings
Verb              | GET
URI               | /admin/pricings(.:format)
Controller#Action | admin/pricings#index
--[ Route 134 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/pricings(.:format)
Controller#Action | admin/pricings#create
--[ Route 135 ]------------------------------------------------------------------------------------
Prefix            | new_admin_pricing
Verb              | GET
URI               | /admin/pricings/new(.:format)
Controller#Action | admin/pricings#new
--[ Route 136 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_pricing
Verb              | GET
URI               | /admin/pricings/:id/edit(.:format)
Controller#Action | admin/pricings#edit
--[ Route 137 ]------------------------------------------------------------------------------------
Prefix            | admin_pricing
Verb              | GET
URI               | /admin/pricings/:id(.:format)
Controller#Action | admin/pricings#show
--[ Route 138 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/pricings/:id(.:format)
Controller#Action | admin/pricings#update
--[ Route 139 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/pricings/:id(.:format)
Controller#Action | admin/pricings#update
--[ Route 140 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/pricings/:id(.:format)
Controller#Action | admin/pricings#destroy
--[ Route 141 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_product_accesses
Verb              | POST
URI               | /admin/product_accesses/batch_action(.:format)
Controller#Action | admin/product_accesses#batch_action
--[ Route 142 ]------------------------------------------------------------------------------------
Prefix            | admin_product_accesses
Verb              | GET
URI               | /admin/product_accesses(.:format)
Controller#Action | admin/product_accesses#index
--[ Route 143 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/product_accesses(.:format)
Controller#Action | admin/product_accesses#create
--[ Route 144 ]------------------------------------------------------------------------------------
Prefix            | new_admin_product_access
Verb              | GET
URI               | /admin/product_accesses/new(.:format)
Controller#Action | admin/product_accesses#new
--[ Route 145 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_product_access
Verb              | GET
URI               | /admin/product_accesses/:id/edit(.:format)
Controller#Action | admin/product_accesses#edit
--[ Route 146 ]------------------------------------------------------------------------------------
Prefix            | admin_product_access
Verb              | GET
URI               | /admin/product_accesses/:id(.:format)
Controller#Action | admin/product_accesses#show
--[ Route 147 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/product_accesses/:id(.:format)
Controller#Action | admin/product_accesses#update
--[ Route 148 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/product_accesses/:id(.:format)
Controller#Action | admin/product_accesses#update
--[ Route 149 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/product_accesses/:id(.:format)
Controller#Action | admin/product_accesses#destroy
--[ Route 150 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_products
Verb              | POST
URI               | /admin/products/batch_action(.:format)
Controller#Action | admin/products#batch_action
--[ Route 151 ]------------------------------------------------------------------------------------
Prefix            | admin_products
Verb              | GET
URI               | /admin/products(.:format)
Controller#Action | admin/products#index
--[ Route 152 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/products(.:format)
Controller#Action | admin/products#create
--[ Route 153 ]------------------------------------------------------------------------------------
Prefix            | new_admin_product
Verb              | GET
URI               | /admin/products/new(.:format)
Controller#Action | admin/products#new
--[ Route 154 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_product
Verb              | GET
URI               | /admin/products/:id/edit(.:format)
Controller#Action | admin/products#edit
--[ Route 155 ]------------------------------------------------------------------------------------
Prefix            | admin_product
Verb              | GET
URI               | /admin/products/:id(.:format)
Controller#Action | admin/products#show
--[ Route 156 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/products/:id(.:format)
Controller#Action | admin/products#update
--[ Route 157 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/products/:id(.:format)
Controller#Action | admin/products#update
--[ Route 158 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/products/:id(.:format)
Controller#Action | admin/products#destroy
--[ Route 159 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_reviews
Verb              | POST
URI               | /admin/reviews/batch_action(.:format)
Controller#Action | admin/reviews#batch_action
--[ Route 160 ]------------------------------------------------------------------------------------
Prefix            | admin_reviews
Verb              | GET
URI               | /admin/reviews(.:format)
Controller#Action | admin/reviews#index
--[ Route 161 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/reviews(.:format)
Controller#Action | admin/reviews#create
--[ Route 162 ]------------------------------------------------------------------------------------
Prefix            | new_admin_review
Verb              | GET
URI               | /admin/reviews/new(.:format)
Controller#Action | admin/reviews#new
--[ Route 163 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_review
Verb              | GET
URI               | /admin/reviews/:id/edit(.:format)
Controller#Action | admin/reviews#edit
--[ Route 164 ]------------------------------------------------------------------------------------
Prefix            | admin_review
Verb              | GET
URI               | /admin/reviews/:id(.:format)
Controller#Action | admin/reviews#show
--[ Route 165 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/reviews/:id(.:format)
Controller#Action | admin/reviews#update
--[ Route 166 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/reviews/:id(.:format)
Controller#Action | admin/reviews#update
--[ Route 167 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/reviews/:id(.:format)
Controller#Action | admin/reviews#destroy
--[ Route 168 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_sponsored_plans
Verb              | POST
URI               | /admin/sponsored_plans/batch_action(.:format)
Controller#Action | admin/sponsored_plans#batch_action
--[ Route 169 ]------------------------------------------------------------------------------------
Prefix            | admin_sponsored_plans
Verb              | GET
URI               | /admin/sponsored_plans(.:format)
Controller#Action | admin/sponsored_plans#index
--[ Route 170 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/sponsored_plans(.:format)
Controller#Action | admin/sponsored_plans#create
--[ Route 171 ]------------------------------------------------------------------------------------
Prefix            | new_admin_sponsored_plan
Verb              | GET
URI               | /admin/sponsored_plans/new(.:format)
Controller#Action | admin/sponsored_plans#new
--[ Route 172 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_sponsored_plan
Verb              | GET
URI               | /admin/sponsored_plans/:id/edit(.:format)
Controller#Action | admin/sponsored_plans#edit
--[ Route 173 ]------------------------------------------------------------------------------------
Prefix            | admin_sponsored_plan
Verb              | GET
URI               | /admin/sponsored_plans/:id(.:format)
Controller#Action | admin/sponsored_plans#show
--[ Route 174 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/sponsored_plans/:id(.:format)
Controller#Action | admin/sponsored_plans#update
--[ Route 175 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/sponsored_plans/:id(.:format)
Controller#Action | admin/sponsored_plans#update
--[ Route 176 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/sponsored_plans/:id(.:format)
Controller#Action | admin/sponsored_plans#destroy
--[ Route 177 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_subscription_plans
Verb              | POST
URI               | /admin/subscription_plans/batch_action(.:format)
Controller#Action | admin/subscription_plans#batch_action
--[ Route 178 ]------------------------------------------------------------------------------------
Prefix            | admin_subscription_plans
Verb              | GET
URI               | /admin/subscription_plans(.:format)
Controller#Action | admin/subscription_plans#index
--[ Route 179 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/subscription_plans(.:format)
Controller#Action | admin/subscription_plans#create
--[ Route 180 ]------------------------------------------------------------------------------------
Prefix            | new_admin_subscription_plan
Verb              | GET
URI               | /admin/subscription_plans/new(.:format)
Controller#Action | admin/subscription_plans#new
--[ Route 181 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_subscription_plan
Verb              | GET
URI               | /admin/subscription_plans/:id/edit(.:format)
Controller#Action | admin/subscription_plans#edit
--[ Route 182 ]------------------------------------------------------------------------------------
Prefix            | admin_subscription_plan
Verb              | GET
URI               | /admin/subscription_plans/:id(.:format)
Controller#Action | admin/subscription_plans#show
--[ Route 183 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/subscription_plans/:id(.:format)
Controller#Action | admin/subscription_plans#update
--[ Route 184 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/subscription_plans/:id(.:format)
Controller#Action | admin/subscription_plans#update
--[ Route 185 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/subscription_plans/:id(.:format)
Controller#Action | admin/subscription_plans#destroy
--[ Route 186 ]------------------------------------------------------------------------------------
Prefix            | batch_action_admin_users
Verb              | POST
URI               | /admin/users/batch_action(.:format)
Controller#Action | admin/users#batch_action
--[ Route 187 ]------------------------------------------------------------------------------------
Prefix            | admin_users
Verb              | GET
URI               | /admin/users(.:format)
Controller#Action | admin/users#index
--[ Route 188 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/users(.:format)
Controller#Action | admin/users#create
--[ Route 189 ]------------------------------------------------------------------------------------
Prefix            | new_admin_user
Verb              | GET
URI               | /admin/users/new(.:format)
Controller#Action | admin/users#new
--[ Route 190 ]------------------------------------------------------------------------------------
Prefix            | edit_admin_user
Verb              | GET
URI               | /admin/users/:id/edit(.:format)
Controller#Action | admin/users#edit
--[ Route 191 ]------------------------------------------------------------------------------------
Prefix            | admin_user
Verb              | GET
URI               | /admin/users/:id(.:format)
Controller#Action | admin/users#show
--[ Route 192 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /admin/users/:id(.:format)
Controller#Action | admin/users#update
--[ Route 193 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /admin/users/:id(.:format)
Controller#Action | admin/users#update
--[ Route 194 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/users/:id(.:format)
Controller#Action | admin/users#destroy
--[ Route 195 ]------------------------------------------------------------------------------------
Prefix            | admin_comments
Verb              | GET
URI               | /admin/comments(.:format)
Controller#Action | admin/comments#index
--[ Route 196 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /admin/comments(.:format)
Controller#Action | admin/comments#create
--[ Route 197 ]------------------------------------------------------------------------------------
Prefix            | admin_comment
Verb              | GET
URI               | /admin/comments/:id(.:format)
Controller#Action | admin/comments#show
--[ Route 198 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /admin/comments/:id(.:format)
Controller#Action | admin/comments#destroy
--[ Route 199 ]------------------------------------------------------------------------------------
Prefix            | api_v1_banners
Verb              | GET
URI               | /api/v1/banners(.:format)
Controller#Action | api/v1/banners#index
--[ Route 200 ]------------------------------------------------------------------------------------
Prefix            | api_v1_auth_login
Verb              | POST
URI               | /api/v1/auth/login(.:format)
Controller#Action | api/v1/authentication#login
--[ Route 201 ]------------------------------------------------------------------------------------
Prefix            | api_v1_auth_register
Verb              | POST
URI               | /api/v1/auth/register(.:format)
Controller#Action | api/v1/authentication#register
--[ Route 202 ]------------------------------------------------------------------------------------
Prefix            | api_v1_dashboard_stats
Verb              | GET
URI               | /api/v1/dashboard/stats(.:format)
Controller#Action | api/v1/dashboard#stats
--[ Route 203 ]------------------------------------------------------------------------------------
Prefix            | api_v1_companies_states
Verb              | GET
URI               | /api/v1/companies/states(.:format)
Controller#Action | api/v1/companies#states
--[ Route 204 ]------------------------------------------------------------------------------------
Prefix            | api_v1_companies_cities
Verb              | GET
URI               | /api/v1/companies/cities(.:format)
Controller#Action | api/v1/companies#cities
--[ Route 205 ]------------------------------------------------------------------------------------
Prefix            | api_v1_companies_locations
Verb              | GET
URI               | /api/v1/companies/locations(.:format)
Controller#Action | api/v1/companies#locations
--[ Route 206 ]------------------------------------------------------------------------------------
Prefix            | api_v1_categories
Verb              | GET
URI               | /api/v1/categories(.:format)
Controller#Action | api/v1/categories_api#index
--[ Route 207 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/categories(.:format)
Controller#Action | api/v1/categories_api#create
--[ Route 208 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_category
Verb              | GET
URI               | /api/v1/categories/new(.:format)
Controller#Action | api/v1/categories_api#new
--[ Route 209 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_category
Verb              | GET
URI               | /api/v1/categories/:id/edit(.:format)
Controller#Action | api/v1/categories_api#edit
--[ Route 210 ]------------------------------------------------------------------------------------
Prefix            | api_v1_category
Verb              | GET
URI               | /api/v1/categories/:id(.:format)
Controller#Action | api/v1/categories_api#show
--[ Route 211 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/categories/:id(.:format)
Controller#Action | api/v1/categories_api#update
--[ Route 212 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/categories/:id(.:format)
Controller#Action | api/v1/categories_api#update
--[ Route 213 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/categories/:id(.:format)
Controller#Action | api/v1/categories_api#destroy
--[ Route 214 ]------------------------------------------------------------------------------------
Prefix            | api_v1_companies
Verb              | GET
URI               | /api/v1/companies(.:format)
Controller#Action | api/v1/companies#index
--[ Route 215 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/companies(.:format)
Controller#Action | api/v1/companies#create
--[ Route 216 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_company
Verb              | GET
URI               | /api/v1/companies/new(.:format)
Controller#Action | api/v1/companies#new
--[ Route 217 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_company
Verb              | GET
URI               | /api/v1/companies/:id/edit(.:format)
Controller#Action | api/v1/companies#edit
--[ Route 218 ]------------------------------------------------------------------------------------
Prefix            | api_v1_company
Verb              | GET
URI               | /api/v1/companies/:id(.:format)
Controller#Action | api/v1/companies#show
--[ Route 219 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/companies/:id(.:format)
Controller#Action | api/v1/companies#update
--[ Route 220 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/companies/:id(.:format)
Controller#Action | api/v1/companies#update
--[ Route 221 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/companies/:id(.:format)
Controller#Action | api/v1/companies#destroy
--[ Route 222 ]------------------------------------------------------------------------------------
Prefix            | api_v1_products
Verb              | GET
URI               | /api/v1/products(.:format)
Controller#Action | api/v1/products#index
--[ Route 223 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/products(.:format)
Controller#Action | api/v1/products#create
--[ Route 224 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_product
Verb              | GET
URI               | /api/v1/products/new(.:format)
Controller#Action | api/v1/products#new
--[ Route 225 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_product
Verb              | GET
URI               | /api/v1/products/:id/edit(.:format)
Controller#Action | api/v1/products#edit
--[ Route 226 ]------------------------------------------------------------------------------------
Prefix            | api_v1_product
Verb              | GET
URI               | /api/v1/products/:id(.:format)
Controller#Action | api/v1/products#show
--[ Route 227 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/products/:id(.:format)
Controller#Action | api/v1/products#update
--[ Route 228 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/products/:id(.:format)
Controller#Action | api/v1/products#update
--[ Route 229 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/products/:id(.:format)
Controller#Action | api/v1/products#destroy
--[ Route 230 ]------------------------------------------------------------------------------------
Prefix            | api_v1_leads
Verb              | GET
URI               | /api/v1/leads(.:format)
Controller#Action | api/v1/leads#index
--[ Route 231 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/leads(.:format)
Controller#Action | api/v1/leads#create
--[ Route 232 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_lead
Verb              | GET
URI               | /api/v1/leads/new(.:format)
Controller#Action | api/v1/leads#new
--[ Route 233 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_lead
Verb              | GET
URI               | /api/v1/leads/:id/edit(.:format)
Controller#Action | api/v1/leads#edit
--[ Route 234 ]------------------------------------------------------------------------------------
Prefix            | api_v1_lead
Verb              | GET
URI               | /api/v1/leads/:id(.:format)
Controller#Action | api/v1/leads#show
--[ Route 235 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/leads/:id(.:format)
Controller#Action | api/v1/leads#update
--[ Route 236 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/leads/:id(.:format)
Controller#Action | api/v1/leads#update
--[ Route 237 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/leads/:id(.:format)
Controller#Action | api/v1/leads#destroy
--[ Route 238 ]------------------------------------------------------------------------------------
Prefix            | api_v1_reviews
Verb              | GET
URI               | /api/v1/reviews(.:format)
Controller#Action | api/v1/reviews#index
--[ Route 239 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/reviews(.:format)
Controller#Action | api/v1/reviews#create
--[ Route 240 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_review
Verb              | GET
URI               | /api/v1/reviews/new(.:format)
Controller#Action | api/v1/reviews#new
--[ Route 241 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_review
Verb              | GET
URI               | /api/v1/reviews/:id/edit(.:format)
Controller#Action | api/v1/reviews#edit
--[ Route 242 ]------------------------------------------------------------------------------------
Prefix            | api_v1_review
Verb              | GET
URI               | /api/v1/reviews/:id(.:format)
Controller#Action | api/v1/reviews#show
--[ Route 243 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/reviews/:id(.:format)
Controller#Action | api/v1/reviews#update
--[ Route 244 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/reviews/:id(.:format)
Controller#Action | api/v1/reviews#update
--[ Route 245 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/reviews/:id(.:format)
Controller#Action | api/v1/reviews#destroy
--[ Route 246 ]------------------------------------------------------------------------------------
Prefix            | api_v1_badges
Verb              | GET
URI               | /api/v1/badges(.:format)
Controller#Action | api/v1/badges#index
--[ Route 247 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/badges(.:format)
Controller#Action | api/v1/badges#create
--[ Route 248 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_badge
Verb              | GET
URI               | /api/v1/badges/new(.:format)
Controller#Action | api/v1/badges#new
--[ Route 249 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_badge
Verb              | GET
URI               | /api/v1/badges/:id/edit(.:format)
Controller#Action | api/v1/badges#edit
--[ Route 250 ]------------------------------------------------------------------------------------
Prefix            | api_v1_badge
Verb              | GET
URI               | /api/v1/badges/:id(.:format)
Controller#Action | api/v1/badges#show
--[ Route 251 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/badges/:id(.:format)
Controller#Action | api/v1/badges#update
--[ Route 252 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/badges/:id(.:format)
Controller#Action | api/v1/badges#update
--[ Route 253 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/badges/:id(.:format)
Controller#Action | api/v1/badges#destroy
--[ Route 254 ]------------------------------------------------------------------------------------
Prefix            | api_v1_articles
Verb              | GET
URI               | /api/v1/articles(.:format)
Controller#Action | api/v1/articles#index
--[ Route 255 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/articles(.:format)
Controller#Action | api/v1/articles#create
--[ Route 256 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_article
Verb              | GET
URI               | /api/v1/articles/new(.:format)
Controller#Action | api/v1/articles#new
--[ Route 257 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_article
Verb              | GET
URI               | /api/v1/articles/:id/edit(.:format)
Controller#Action | api/v1/articles#edit
--[ Route 258 ]------------------------------------------------------------------------------------
Prefix            | api_v1_article
Verb              | GET
URI               | /api/v1/articles/:id(.:format)
Controller#Action | api/v1/articles#show
--[ Route 259 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/articles/:id(.:format)
Controller#Action | api/v1/articles#update
--[ Route 260 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/articles/:id(.:format)
Controller#Action | api/v1/articles#update
--[ Route 261 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/articles/:id(.:format)
Controller#Action | api/v1/articles#destroy
--[ Route 262 ]------------------------------------------------------------------------------------
Prefix            | api_v1_plans
Verb              | GET
URI               | /api/v1/plans(.:format)
Controller#Action | api/v1/plans#index
--[ Route 263 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /api/v1/plans(.:format)
Controller#Action | api/v1/plans#create
--[ Route 264 ]------------------------------------------------------------------------------------
Prefix            | new_api_v1_plan
Verb              | GET
URI               | /api/v1/plans/new(.:format)
Controller#Action | api/v1/plans#new
--[ Route 265 ]------------------------------------------------------------------------------------
Prefix            | edit_api_v1_plan
Verb              | GET
URI               | /api/v1/plans/:id/edit(.:format)
Controller#Action | api/v1/plans#edit
--[ Route 266 ]------------------------------------------------------------------------------------
Prefix            | api_v1_plan
Verb              | GET
URI               | /api/v1/plans/:id(.:format)
Controller#Action | api/v1/plans#show
--[ Route 267 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/plans/:id(.:format)
Controller#Action | api/v1/plans#update
--[ Route 268 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/plans/:id(.:format)
Controller#Action | api/v1/plans#update
--[ Route 269 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /api/v1/plans/:id(.:format)
Controller#Action | api/v1/plans#destroy
--[ Route 270 ]------------------------------------------------------------------------------------
Prefix            | api_v1_user
Verb              | GET
URI               | /api/v1/users/:id(.:format)
Controller#Action | api/v1/users#show
--[ Route 271 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /api/v1/users/:id(.:format)
Controller#Action | api/v1/users#update
--[ Route 272 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /api/v1/users/:id(.:format)
Controller#Action | api/v1/users#update
--[ Route 273 ]------------------------------------------------------------------------------------
Prefix            | api_v1_search_all
Verb              | GET
URI               | /api/v1/search/all(.:format)
Controller#Action | api/v1/search#all
--[ Route 274 ]------------------------------------------------------------------------------------
Prefix            | api_v1_search_suggest
Verb              | GET
URI               | /api/v1/search/suggest(.:format)
Controller#Action | api/v1/search#suggest
--[ Route 275 ]------------------------------------------------------------------------------------
Prefix            | api_v1_search_companies
Verb              | GET
URI               | /api/v1/search/companies(.:format)
Controller#Action | api/v1/search#companies
--[ Route 276 ]------------------------------------------------------------------------------------
Prefix            | api_v1_search_products
Verb              | GET
URI               | /api/v1/search/products(.:format)
Controller#Action | api/v1/search#products
--[ Route 277 ]------------------------------------------------------------------------------------
Prefix            | api_v1_search_articles
Verb              | GET
URI               | /api/v1/search/articles(.:format)
Controller#Action | api/v1/search#articles
--[ Route 278 ]------------------------------------------------------------------------------------
Prefix            | new_user_session
Verb              | GET
URI               | /users/sign_in(.:format)
Controller#Action | users/sessions#new
--[ Route 279 ]------------------------------------------------------------------------------------
Prefix            | user_session
Verb              | POST
URI               | /users/sign_in(.:format)
Controller#Action | users/sessions#create
--[ Route 280 ]------------------------------------------------------------------------------------
Prefix            | destroy_user_session
Verb              | DELETE
URI               | /users/sign_out(.:format)
Controller#Action | users/sessions#destroy
--[ Route 281 ]------------------------------------------------------------------------------------
Prefix            | new_user_password
Verb              | GET
URI               | /users/password/new(.:format)
Controller#Action | devise/passwords#new
--[ Route 282 ]------------------------------------------------------------------------------------
Prefix            | edit_user_password
Verb              | GET
URI               | /users/password/edit(.:format)
Controller#Action | devise/passwords#edit
--[ Route 283 ]------------------------------------------------------------------------------------
Prefix            | user_password
Verb              | PATCH
URI               | /users/password(.:format)
Controller#Action | devise/passwords#update
--[ Route 284 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /users/password(.:format)
Controller#Action | devise/passwords#update
--[ Route 285 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /users/password(.:format)
Controller#Action | devise/passwords#create
--[ Route 286 ]------------------------------------------------------------------------------------
Prefix            | cancel_user_registration
Verb              | GET
URI               | /users/cancel(.:format)
Controller#Action | users/registrations#cancel
--[ Route 287 ]------------------------------------------------------------------------------------
Prefix            | new_user_registration
Verb              | GET
URI               | /users/sign_up(.:format)
Controller#Action | users/registrations#new
--[ Route 288 ]------------------------------------------------------------------------------------
Prefix            | edit_user_registration
Verb              | GET
URI               | /users/edit(.:format)
Controller#Action | users/registrations#edit
--[ Route 289 ]------------------------------------------------------------------------------------
Prefix            | user_registration
Verb              | PATCH
URI               | /users(.:format)
Controller#Action | users/registrations#update
--[ Route 290 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /users(.:format)
Controller#Action | users/registrations#update
--[ Route 291 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /users(.:format)
Controller#Action | users/registrations#destroy
--[ Route 292 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /users(.:format)
Controller#Action | users/registrations#create
--[ Route 293 ]------------------------------------------------------------------------------------
Prefix            | users_profile
Verb              | GET
URI               | /users/profile(.:format)
Controller#Action | users#profile
--[ Route 294 ]------------------------------------------------------------------------------------
Prefix            | user
Verb              | GET
URI               | /u/:id(.:format)
Controller#Action | users#profile
--[ Route 295 ]------------------------------------------------------------------------------------
Prefix            | root
Verb              | GET
URI               | /
Controller#Action | corporate#index
--[ Route 296 ]------------------------------------------------------------------------------------
Prefix            | corporate
Verb              | GET
URI               | /corporate(.:format)
Controller#Action | corporate#index
--[ Route 297 ]------------------------------------------------------------------------------------
Prefix            | corporate_login
Verb              | GET
URI               | /corporate/login(.:format)
Controller#Action | corporate#login
--[ Route 298 ]------------------------------------------------------------------------------------
Prefix            | home
Verb              | GET
URI               | /home(.:format)
Controller#Action | pages#home
--[ Route 299 ]------------------------------------------------------------------------------------
Prefix            | about
Verb              | GET
URI               | /about(.:format)
Controller#Action | pages#about
--[ Route 300 ]------------------------------------------------------------------------------------
Prefix            | posts
Verb              | GET
URI               | /posts(.:format)
Controller#Action | posts#index
--[ Route 301 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /posts(.:format)
Controller#Action | posts#create
--[ Route 302 ]------------------------------------------------------------------------------------
Prefix            | new_post
Verb              | GET
URI               | /posts/new(.:format)
Controller#Action | posts#new
--[ Route 303 ]------------------------------------------------------------------------------------
Prefix            | edit_post
Verb              | GET
URI               | /posts/:id/edit(.:format)
Controller#Action | posts#edit
--[ Route 304 ]------------------------------------------------------------------------------------
Prefix            | post
Verb              | GET
URI               | /posts/:id(.:format)
Controller#Action | posts#show
--[ Route 305 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /posts/:id(.:format)
Controller#Action | posts#update
--[ Route 306 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /posts/:id(.:format)
Controller#Action | posts#update
--[ Route 307 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /posts/:id(.:format)
Controller#Action | posts#destroy
--[ Route 308 ]------------------------------------------------------------------------------------
Prefix            | turbo_recede_historical_location
Verb              | GET
URI               | /recede_historical_location(.:format)
Controller#Action | turbo/native/navigation#recede
--[ Route 309 ]------------------------------------------------------------------------------------
Prefix            | turbo_resume_historical_location
Verb              | GET
URI               | /resume_historical_location(.:format)
Controller#Action | turbo/native/navigation#resume
--[ Route 310 ]------------------------------------------------------------------------------------
Prefix            | turbo_refresh_historical_location
Verb              | GET
URI               | /refresh_historical_location(.:format)
Controller#Action | turbo/native/navigation#refresh
--[ Route 311 ]------------------------------------------------------------------------------------
Prefix            | rails_postmark_inbound_emails
Verb              | POST
URI               | /rails/action_mailbox/postmark/inbound_emails(.:format)
Controller#Action | action_mailbox/ingresses/postmark/inbound_emails#create
--[ Route 312 ]------------------------------------------------------------------------------------
Prefix            | rails_relay_inbound_emails
Verb              | POST
URI               | /rails/action_mailbox/relay/inbound_emails(.:format)
Controller#Action | action_mailbox/ingresses/relay/inbound_emails#create
--[ Route 313 ]------------------------------------------------------------------------------------
Prefix            | rails_sendgrid_inbound_emails
Verb              | POST
URI               | /rails/action_mailbox/sendgrid/inbound_emails(.:format)
Controller#Action | action_mailbox/ingresses/sendgrid/inbound_emails#create
--[ Route 314 ]------------------------------------------------------------------------------------
Prefix            | rails_mandrill_inbound_health_check
Verb              | GET
URI               | /rails/action_mailbox/mandrill/inbound_emails(.:format)
Controller#Action | action_mailbox/ingresses/mandrill/inbound_emails#health_check
--[ Route 315 ]------------------------------------------------------------------------------------
Prefix            | rails_mandrill_inbound_emails
Verb              | POST
URI               | /rails/action_mailbox/mandrill/inbound_emails(.:format)
Controller#Action | action_mailbox/ingresses/mandrill/inbound_emails#create
--[ Route 316 ]------------------------------------------------------------------------------------
Prefix            | rails_mailgun_inbound_emails
Verb              | POST
URI               | /rails/action_mailbox/mailgun/inbound_emails/mime(.:format)
Controller#Action | action_mailbox/ingresses/mailgun/inbound_emails#create
--[ Route 317 ]------------------------------------------------------------------------------------
Prefix            | rails_conductor_inbound_emails
Verb              | GET
URI               | /rails/conductor/action_mailbox/inbound_emails(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#index
--[ Route 318 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | POST
URI               | /rails/conductor/action_mailbox/inbound_emails(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#create
--[ Route 319 ]------------------------------------------------------------------------------------
Prefix            | new_rails_conductor_inbound_email
Verb              | GET
URI               | /rails/conductor/action_mailbox/inbound_emails/new(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#new
--[ Route 320 ]------------------------------------------------------------------------------------
Prefix            | edit_rails_conductor_inbound_email
Verb              | GET
URI               | /rails/conductor/action_mailbox/inbound_emails/:id/edit(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#edit
--[ Route 321 ]------------------------------------------------------------------------------------
Prefix            | rails_conductor_inbound_email
Verb              | GET
URI               | /rails/conductor/action_mailbox/inbound_emails/:id(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#show
--[ Route 322 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PATCH
URI               | /rails/conductor/action_mailbox/inbound_emails/:id(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#update
--[ Route 323 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | PUT
URI               | /rails/conductor/action_mailbox/inbound_emails/:id(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#update
--[ Route 324 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | DELETE
URI               | /rails/conductor/action_mailbox/inbound_emails/:id(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails#destroy
--[ Route 325 ]------------------------------------------------------------------------------------
Prefix            | new_rails_conductor_inbound_email_source
Verb              | GET
URI               | /rails/conductor/action_mailbox/inbound_emails/sources/new(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails/sources#new
--[ Route 326 ]------------------------------------------------------------------------------------
Prefix            | rails_conductor_inbound_email_sources
Verb              | POST
URI               | /rails/conductor/action_mailbox/inbound_emails/sources(.:format)
Controller#Action | rails/conductor/action_mailbox/inbound_emails/sources#create
--[ Route 327 ]------------------------------------------------------------------------------------
Prefix            | rails_conductor_inbound_email_reroute
Verb              | POST
URI               | /rails/conductor/action_mailbox/:inbound_email_id/reroute(.:format)
Controller#Action | rails/conductor/action_mailbox/reroutes#create
--[ Route 328 ]------------------------------------------------------------------------------------
Prefix            | rails_conductor_inbound_email_incinerate
Verb              | POST
URI               | /rails/conductor/action_mailbox/:inbound_email_id/incinerate(.:format)
Controller#Action | rails/conductor/action_mailbox/incinerates#create
--[ Route 329 ]------------------------------------------------------------------------------------
Prefix            | rails_service_blob
Verb              | GET
URI               | /rails/active_storage/blobs/redirect/:signed_id/*filename(.:format)
Controller#Action | active_storage/blobs/redirect#show
--[ Route 330 ]------------------------------------------------------------------------------------
Prefix            | rails_service_blob_proxy
Verb              | GET
URI               | /rails/active_storage/blobs/proxy/:signed_id/*filename(.:format)
Controller#Action | active_storage/blobs/proxy#show
--[ Route 331 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | GET
URI               | /rails/active_storage/blobs/:signed_id/*filename(.:format)
Controller#Action | active_storage/blobs/redirect#show
--[ Route 332 ]------------------------------------------------------------------------------------
Prefix            | rails_blob_representation
Verb              | GET
URI               | /rails/active_storage/representations/redirect/:signed_blob_id/:variation_key/*filename(.:format)
Controller#Action | active_storage/representations/redirect#show
--[ Route 333 ]------------------------------------------------------------------------------------
Prefix            | rails_blob_representation_proxy
Verb              | GET
URI               | /rails/active_storage/representations/proxy/:signed_blob_id/:variation_key/*filename(.:format)
Controller#Action | active_storage/representations/proxy#show
--[ Route 334 ]------------------------------------------------------------------------------------
Prefix            | 
Verb              | GET
URI               | /rails/active_storage/representations/:signed_blob_id/:variation_key/*filename(.:format)
Controller#Action | active_storage/representations/redirect#show
--[ Route 335 ]------------------------------------------------------------------------------------
Prefix            | rails_disk_service
Verb              | GET
URI               | /rails/active_storage/disk/:encoded_key/*filename(.:format)
Controller#Action | active_storage/disk#show
--[ Route 336 ]------------------------------------------------------------------------------------
Prefix            | update_rails_disk_service
Verb              | PUT
URI               | /rails/active_storage/disk/:encoded_token(.:format)
Controller#Action | active_storage/disk#update
--[ Route 337 ]------------------------------------------------------------------------------------
Prefix            | rails_direct_uploads
Verb              | POST
URI               | /rails/active_storage/direct_uploads(.:format)
Controller#Action | active_storage/direct_uploads#create
