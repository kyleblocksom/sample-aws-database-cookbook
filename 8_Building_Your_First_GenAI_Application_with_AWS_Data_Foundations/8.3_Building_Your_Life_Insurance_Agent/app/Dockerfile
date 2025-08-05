# app/Dockerfile

FROM public.ecr.aws/docker/library/python:3.12-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire streamlit directory, which includes utils
COPY streamlit/ streamlit/

# Make port 8501 available
EXPOSE 8501

# Command to run the Streamlit app
CMD ["streamlit", "run", "streamlit/streamlit_app.py"]
