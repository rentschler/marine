FROM python:3.12-slim

# Set workdir to app
WORKDIR /usr/src/app

# Install system dependencies for pygraphviz (gcc, graphviz, libgraphviz-dev)
RUN apt-get update && apt-get install -y \
    gcc \
    graphviz \
    libgraphviz-dev \
    && rm -rf /var/lib/apt/lists/*

# Install bash (since the base image uses sh by default)
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt /tmp/

# Upgrade pip and install Python packages
RUN pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt

# Copy the application code
COPY . /usr/src/app

# Copy the entrypoint script
COPY entryscript.sh /usr/src/entryscript.sh

# Make the entrypoint script executable
RUN chmod +x /usr/src/entryscript.sh

# Make sure Python output is printed directly to stdout
ENV PYTHONUNBUFFERED=1

# Open listening port
EXPOSE 8080

# Start the app
CMD ["/bin/bash", "/usr/src/entryscript.sh"]