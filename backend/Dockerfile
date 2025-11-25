FROM ruby:3.2.2

# Install GPG and update certificates
RUN apt-get update && \
    apt-get install -y gnupg2 wget ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add Debian repository keys properly
RUN wget -qO - https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/debian-archive-keyring.gpg && \
    chmod 644 /usr/share/keyrings/debian-archive-keyring.gpg

# Configure apt to use the keyring
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bookworm main" > /etc/apt/sources.list && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list

# Install dependencies
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
WORKDIR /app

# Copy Gemfile and install dependencies
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copy the rest of the application
COPY . .

# Start the Rails server
CMD ["rails", "server", "-b", "0.0.0.0"]