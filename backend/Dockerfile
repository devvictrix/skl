# ./backend/Dockerfile

# Use a stable, lightweight Node.js version
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install ALL dependencies, including devDependencies, which are required
# for the build, migration, and seeding steps.
RUN npm install

# Copy the rest of your application's source code
COPY . .

# The build is run by the 'typeorm' script, but we can build here
# to ensure it's done before the container starts. The startup
# script will just re-verify it.
RUN npm run build

# Expose the port the application will run on
EXPOSE 3000

# The command from your docker-compose.yml file will override this CMD.
# This just serves as a default if you run the container directly.
CMD ["npm", "run", "start:prod"]