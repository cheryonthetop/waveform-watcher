FROM python:3.8

# Build image for flask
ADD . .

WORKDIR /

RUN pip install -r /requirements.txt

EXPOSE 4000

ENTRYPOINT [ "python", "index.py" ]