Rails.application.routes.draw do
  get "/up", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']] }
  namespace :api do
    post "session", to: "sessions#create"
    get "session", to: "sessions#show"
    delete "session", to: "sessions#destroy"
    resources :suppliers, only: %i[index create]
    resources :products, only: %i[index show create] do
      resources :movements, only: :create
    end
    get "movements", to: "movements#index"
    get "summary", to: "reports#summary"
    get "export", to: "reports#export"
  end
end
