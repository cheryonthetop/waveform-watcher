FROM python:3.8
# Flask application on port 4000
WORKDIR /tmp

# Build image for flask
COPY . .

RUN pip install -r /tmp/requirements.txt

EXPOSE 5006

ENTRYPOINT [ "bokeh", "serve", "--allow-websocket-origin", "https://waveform-watcher.azurewebsites.net/", "." ]