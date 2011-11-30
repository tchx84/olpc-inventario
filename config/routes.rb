InventarioNicaragua::Application.routes.draw do
  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Root routing:
  # The GUI is built into a "build" subdirectory and we must launch the app
  # from that relative path so that js files and images are available.
  # Redirect to build/index.html
  root :to => redirect('/build/index.html')
  # However, we implement build/index.html within Rails, because it uses a
  # template which includes ruby code.
  match 'build/index.html' => 'application#index'

  resources :nodes do
    collection do
      get :allNodesAt
      post :setInformation
    end
  end

  resources :places do
    collection do
      get :requestSchools
      get :requestSections
      get :requestSectionName
      get :schools
      get :schools_leases
      get :findByHostname
    end
    member do
      post :reportLaptops
    end
  end

  resources :people do
    collection do
      get :requestStudents
    end
  end

  resources :laptops do
    collection do
      get :requestBlackList
      post :reportStolenLaptops
      post :reportActivatedLaptops
    end
  end

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => "welcome#index"

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  match ':controller(/:action(/:id(.:format)))'
end
