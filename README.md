# AVA 2025 Development Template

This template contains a `React` frontend, a `fastAPI` backend, and a `Neo4j` database. Everything is dockerized, please do not change the overall setup or structure.

To run the application, follow these steps:

0. Requirements: You have `Docker` and `NodeJS (npm)` installed on your machine

1. Clone this repository with `git clone [url]`.

2. Open a terminal/shell in the main directory (`development-template`) and run `docker compose up`. If it fails due to access issues, you might need to run `docker login` first and provide your DBVIS Gitlab credentials.

The website should be available at `http://localhost:3000`.

Other links:

Backend: `http://localhost:8080`
Neo4j Online Browser: `http://localhost:7474/browser/`

If not changed, the database credentials are
User: `neo4j`
Password: `ava25-DB!!`

More information will be presented in the course.

For questions, please contact [Lucas Joos](mailto:lucas.joos@uni-konstanz.de).