FROM python:3.8
# Flask application on port 4000
WORKDIR /tmp

# Build image for flask
COPY . .

RUN pip install -r /tmp/requirements.txt

RUN python -m pip install dask[dataframe]

EXPOSE 4000

ENTRYPOINT [ "python", "index.py" ]