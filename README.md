# DropIn
A lightweight, user-friendly platform designed for quick file sharing, managing storage space, and seamless collaboration. It is my first attempt at a full stack project using different frameworks together. 
## Table of Contents

  1. [Overview]()
  2. [Features]()
  3. [Getting Started]()
  4. [Usage]()
  5. [Project Structure]()
  6. [Contributing]()
  7. [License]()
 

## Overview
DropIn was built to streamline the file sharing process in both small team and large-scale environments. Whether you’re collaborating on a project, distributing files to customers, or simply storing personal backups, DropIn gives you full control over what you upload and with whom you share it.By focusing on a clean and intuitive interface, DropIn aims to remove the headaches of scattered file management, so you can focus on the important stuff—collaboration, iteration, and innovation.
 

## Features

### 1. **Fast and Intuitive Uploads**

  - Upload files of various formats with a quick drag-and-drop or simple button clicks.
  - Progress bars and status notifications keep you informed of upload progress.
### 2. **Space Management**

  - Organize your files into “Spaces,” which act as logical containers or folders.
  - Easily manage space availability, quotas, and sharing permissions by specifying expiry date and download limits.
  - Seamlessly add or delete space link at leisure
### 3. **Responsive and Accessible UI**

  - Modern interface that adapts to desktop, tablet, and mobile devices.
  - Clean UI with simple colors

### 4. **Scalability and Extensibility**

  - Modular architecture makes it easy to add or remove features.
  - Storage options can be changed as needed to fit your needs.
  - Supports containerized deployment (Docker) for easy scaling and updates.
 

## Getting Started
These instructions will help you get a copy of DropIn running on your local machine for development and testing purposes.
### Prerequisites

  - **Node.js** (version X.X or higher)
  - **npm** or **yarn**
  - (Optional) **Docker** if you plan to run DropIn in a container simply pull with `docker pull aungzm/dropin`
### Installation

  1. **Clone the repository**:
  2. **Install dependencies**:
  3. **Set up environment variables**: Do this by copying env.example and renaming it and filling the file out as specified
  4. **Run the development server**: To start run `npm start` or `npm run dev` (for dev mode).
  5. **Configure reverse proxy**: Point a reverse proxy towards the application (Either nginx or apache)
 

## Usage

  1. **Sign Up or Log In**: Start by creating an account or logging in if you already have one.
  2. **Create a Space**: Organize your work by creating a new Space. You can invite teammates or make it private.
  3. **Upload Files**: Use the “Upload” button or drag and drop your files directly into the interface. Monitor progress in real-time.
  4. **Share the link**: Either set the link for files individually or share the entire space with the space link .
  5. ** Additional features**: Set expiry dates for links or at maximum downloads for file links
 

## Project Structure
Here’s a high-level look at the folders and files you might find in this repository: 
  - **src/backend/controllers**: Contains controllers (business logic).
  - **src/backend/prisma**: Stores configuration files (e.g., database connection, environment).
  - **src/backend/routes**: Handles api requests to backend and validation for such api requests.
  - **src/backend/helpers**: Helper functions and utilities.
  - **src/frontend/api**: Handles api runner and session restoration for frontend using JWT refresh and access tokens

 

## Contributing
Here are some ways you can contribute to DropIn:
  1. Open a Pull Request. This is my one of the first projects that I wrote solely from start to end so feel free add features.
  2. Also issues and suggestions in the [Issues]() section are welcom!
  3. Fork this Repo and add your own features!
 

## License
This project is licensed under the [MIT License](). You’re free to modify, distribute, and use the code in any way that aligns with the license terms.