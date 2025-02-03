# Use the Bun image as the base image
FROM oven/bun:1

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

RUN bun install

# Expose the port on which the API will listen
EXPOSE 3000

ENV UPLOADS_DIR=/uploads

# Run the server when the container launches
CMD ["bun", "index.js"]