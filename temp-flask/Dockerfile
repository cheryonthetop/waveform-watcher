FROM python:3.8
# Flask application on port 4000
WORKDIR /app/flask-server

# Build image for flask
COPY . .

RUN pip install -r /app/flask-server/requirements.txt

RUN python -m pip install dask[dataframe]

EXPOSE 4000

ENTRYPOINT [ "python", "index.py" ]