
# DropIn

https://github.com/user-attachments/assets/e9ad789e-dc8f-4c9f-8faa-9af8e65146af


A lightweight, user-friendly platform designed for quick file sharing, managing storage space, and seamless collaboration. It is my first attempt at a full stack project using different frameworks together. 
## Table of Contents

  1. [Overview](#overview)
  2. [Features](#features)
  3. [Getting Started](#getting-started)
  4. [Usage](#usage)
  5. [Project Structure](#project-structure)
  6. [Tech stack](#tech-stack)
  7. [Contributing](#contributing)
  8. [License](#license)
 

## Overview
I built DropIn because I was tired of hitting file size limits on regular cloud services. It's a simple platform that lets you share those massive files that Google Drive and others just can't handle.
Whether you're sending huge video files to friends, backing up your personal projects, or collaborating with a small team, DropIn makes it super straightforward. I focused on making it clean and easy to use - just upload your stuff and share it with whoever you want, no headaches involved.
The whole point was to create something that just works when you need to move big files around. No more splitting files into smaller chunks or dealing with upload errors. Just pick your files, share them, and get back to what you're actually working on.

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
  - (Coming Soon) **Docker** if you plan to run DropIn in a container simply pull with `docker pull *******`
### Installation

  1. **Clone the repository**:
  2. **Install dependencies**:
  3. **Set up environment variables**: Do this by copying env.example and renaming it and filling the file out as specified
  4. **Setup prisma**: Run `prisma:generate` and `prisma:seed` to establish a sqlite database and seed the admin user.
  4. **Run the server**: To start run `npm start` or `npm run dev` (for dev mode).
  5. **Configure reverse proxy**: Point a reverse proxy towards the application (Either nginx or apache)
 

## Usage

  1. **Sign Up or Log In**: Start by creating an account or logging in if you already have one.
  2. **Create a Space**: Organize your work by creating a new Space. You can invite teammates or make it private.
  3. **Upload Files**: Use the “Upload” button or drag and drop your files directly into the interface. Monitor progress in real-time.
  4. **Share the link**: Either set the link for files individually or share the entire space with the space link .
  5. **Additional features**: Set expiry dates for links or at maximum downloads for file links
 

## Project Structure
Here’s a high-level look at the folders and files you might find in this repository:
  - **backend/**: Contains all backend logic 
  - **backend/controllers**: Contains controllers (business logic).
  - **backend/prisma**: Stores configuration files (e.g., database connection, environment).
  - **backend/routes**: Handles api requests to backend and validation for such api requests.
  - **backend/helpers**: Helper functions and utilities.
  - **frontend/**: Contains all frontend
  - **frontend/api**: Handles api runner and session restoration for frontend using JWT refresh and access tokens

```
DropIn/
├── backend/
│   ├── controllers/
│   ├── prisma/
│   ├── routes/
│   ├── helpers/
│   └── ...
├── frontend/
│   ├── api/
│   ├── ...
│   └── ...
├── .gitignore
├── package.json
├── README.md
└── ...
```
## Tech Stack
Here's what I used for this project
-   **React**: Frontend library for building dynamic user interfaces.
-   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
-   **Typescript**: A strongly typed language built on JavaScript that catches errors before they happen through static type checking.
-   **Node.js**: JavaScript runtime environment for server-side code.
-   **Express**: Fast, minimalist web framework for handling backend routes and middleware.
-   **Prisma**: Modern ORM (Object-Relational Mapping) that provides a type-safe query builder for databases.

## Contributing
Here are some ways you can contribute to DropIn:
  1. Open a Pull Request. This is my one of the first projects that I wrote solely from start to end so feel free add features.
  2. Also issues and suggestions in the [Issues](https://github.com/aungzm/DropIn/issues) section are welcome!
  3. Fork this Repo and add your own features!
 

## License
This project is licensed under the [MIT License](https://github.com/aungzm/DropIn/blob/main/LICENSE). You’re free to modify, distribute, and use the code in any way that aligns with the license terms.
