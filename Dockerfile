# Step 1: Use the official Node.js image from the Docker registry
FROM node:22

# Step 2: Set the working directory in the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

RUN npm install

# Step 5: Copy the rest of the application code into the container
COPY . .

# Step 6: Expose the port the app will run on (default is 3000)
EXPOSE 3000

# Step 7: Define the command to run your application
CMD ["npm", "start"]