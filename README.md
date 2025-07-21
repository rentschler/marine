# MARINE Analytics for Radio Interception and Naval Environment

* University Of Konstanz 
* Data Analysis & Visualization Group 
* Summer 2025
* Applied Visual Analytics

## VAST Challenge 2025 MC3


### Willi Kneer & Jonathan Rentschler

In [Mini-Challenge 3](https://vast-challenge.github.io/2025/MC3.html), participants will be provided a knowledge graph created from transcripts of boat radio communications and asked to identify people, their roles, and the events and locations they talk about to predict when and where an event will take place.

This project is a solution to the challenge.

For detailed background information and the full challenge description, see [MC3_release/MC3.md](MC3_release/MC3.md).

### How to run the application

This project contains a `React` frontend, a `fastAPI` backend, and a `Neo4j` database. Everything is dockerized.
To run the application, follow these steps:

0. Requirements: You have `Docker` and `NodeJS (npm)` installed on your machine

1. Clone this repository with `git clone [url]`.

2. Open a terminal/shell and run `docker compose up`.

The website is available at `http://localhost:3000`.

Other links:

Backend: `http://localhost:8080`
Neo4j Online Browser: `http://localhost:7474/browser/`

The database credentials are
User: `neo4j`
Password: `Ix5EyUzZ`

### Environment Variables

The application requires the following environment variables to be set in the `docker-compose.yml`  [`docker-compose.yml`](docker-compose.yml) file:

- `OLLAMA_HOST`: The URL of the Ollama API endpoint
- `OLLAMA_API_KEY`: The API key for Ollama

These variables are used by the LLM service for natural language processing capabilities.
