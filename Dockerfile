FROM ruby:3.2.2

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      postgresql-client \
      nodejs \
      yarn && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app/AB0-1-back

# Install specific bundler version
RUN gem install bundler:2.4.22

# Copy Gemfile and install dependencies
COPY AB0-1-back/Gemfile AB0-1-back/Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

# Copy application code
COPY AB0-1-back .

# Create necessary directories
RUN mkdir -p tmp/pids tmp/storage public/assets log

# Set environment variables
ENV RAILS_ENV=production \
    PATH="/app/bin:${PATH}" \
    SECRET_KEY_BASE=placeholder_for_asset_compilation

# Precompile assets (including ActiveAdmin assets)
RUN bundle exec rake assets:precompile RAILS_ENV=production

# Remove this block to rely solely on DATABASE_URL from entrypoint.sh
# RUN echo "production:\n\
#   adapter: postgresql\n\
#   encoding: unicode\n\
#   pool: 5\n\
#   host: db\n\
#   port: 5432\n\
#   database: <%= ENV['POSTGRES_DB'] %>\n\
#   username: <%= ENV['POSTGRES_USER'] %>\n\
#   password: <%= ENV['POSTGRES_PASSWORD'] %>" > config/database.yml

EXPOSE 3001

# Start the server
# Add entrypoint script
COPY AB0-1-back/entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]