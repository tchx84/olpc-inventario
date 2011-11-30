app_config_file = File.join(Rails.root, "config", "inventario.yml")
if File.exists?(app_config_file)
  APP_CONFIG = YAML.load_file(app_config_file)
else
  APP_CONFIG = {}
end

# Defaults
APP_CONFIG["name"] = 'OLPC Inventario' if APP_CONFIG["name"].nil?
