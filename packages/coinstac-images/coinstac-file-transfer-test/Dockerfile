FROM python:3.10

# Set the working directory to /app
WORKDIR /computation

# Copy the current directory contents into the container at /app
ADD . /computation

RUN pip install -r requirements.txt

CMD ["python", "entry.py"]
