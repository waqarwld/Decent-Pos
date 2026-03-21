package config

import "github.com/kelseyhightower/envconfig"

// Config holds all environment-based configuration for the API.
type Config struct {
	DatabaseURL   string `envconfig:"DATABASE_URL" required:"true"`
	Port          string `envconfig:"PORT" default:"8080"`
	JWTSecret     string `envconfig:"JWT_SECRET" required:"true"`
	AllowedOrigin string `envconfig:"ALLOWED_ORIGIN" default:"http://localhost:3000"`
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
