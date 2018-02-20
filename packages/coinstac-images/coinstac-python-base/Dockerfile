# Use an official Python runtime as a base image
FROM python:3.6.3
ADD . /server
RUN pip install --no-cache-dir -r /server/requirements.txt
CMD ["python", "-u", "/server/server.py"]
