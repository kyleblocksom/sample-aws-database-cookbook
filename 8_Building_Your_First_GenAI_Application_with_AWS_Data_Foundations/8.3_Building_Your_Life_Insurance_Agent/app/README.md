# Life Insurance Policy Management Application

This folder contains the Streamlit application for managing life insurance policies using Amazon Bedrock Agents and Knowledge Bases.

## Structure

- `Dockerfile`: Defines the container image for the Streamlit application.
- `requirements.txt`: Lists the Python dependencies for the entire application.
- `buildspec.yml`: AWS CodeBuild specification for CI/CD pipeline.
- `streamlit/`: Contains the Streamlit application code and utilities.
  - `streamlit_app.py`: Main Streamlit application entry point.
  - `requirements.txt`: Specific requirements for the Streamlit application.
  - `utils/`: Helper modules for authentication, Bedrock integration, and chat history.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables (see `.env.example` for required variables).

## Local Development

To run the Streamlit app locally:

```
cd streamlit
streamlit run streamlit_app.py
```

## Deployment

The application is deployed using AWS CodeBuild and ECS. The `buildspec.yml` file defines the build and push process for the Docker image.

## Docker

To build and run the Docker image locally:

```
docker build -t lifeins-app .
docker run -p 8501:8501 lifeins-app
```

## Dependencies

- Streamlit: Web application framework
- Boto3: AWS SDK for Python
- Langchain: For LLM interactions
- Streamlit-Cognito-Auth: Authentication with Amazon Cognito
- Tenacity & Backoff: For AWS Bedrock API retry logic

For a complete list of dependencies, see `requirements.txt` and `streamlit/requirements.txt`.