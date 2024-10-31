#!/bin/bash

# Fix vulnerabilities
echo "Running npm audit fix..."
npm audit fix

# Clean NPM cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install all required packages
echo "Installing dependencies..."
npm install
npm install @serialport/bindings-cpp dotenv mailersend punycode mysql mysql2 express-session

# Run database setup scripts
echo "Resetting database..."
node reset-database.js
echo "Setting up database..."
node setup-database.js
