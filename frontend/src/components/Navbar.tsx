import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const Navbar = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("Username");
  const [role, setRole] = useState("user");
  const [profilePic, setProfilePic] = useState("");
  
  // Track whether you actually used a blob URL
  let blobUrl: string | null = null;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user info
        const userInfoResponse = await api.get("/users/");
        const user = userInfoResponse.data.user;
        setUsername(user.username);
        setRole(user.role);

        // Fetch profile pic as a blob
        const profilePicResponse = await api.get("/users/profile", {
          responseType: "blob",
        });

        // Convert the blob to a URL
        const contentType = profilePicResponse.headers["content-type"];
        if (contentType?.startsWith("image/")) {
            const imageUrl = URL.createObjectURL(profilePicResponse.data);
            setProfilePic(imageUrl);
          } else {
            setProfilePic("/src/assets/profile.jpg");
          }
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/login");
      }
    };
    fetchUserData();    
  }, [navigate]);

    // Helper function to toggle the dropdown menu
    const toggleDropdown = () => {
        document.getElementById("dropdown-menu")?.classList.toggle("hidden");
    };

    return (
        <nav className="bg-black fixed w-full top-0 start-0 border-b">
            {/* Outer container */}
            <div className="flex items-center justify-between mx-auto p-4">
                
                {/* LOGO on the left */}
                <a
                href="/"
                className="flex items-center space-x-3 rtl:space-x-reverse"
                >
                <img
                    src="https://flowbite.com/docs/images/logo.svg"
                    className="h-8"
                    alt="Flowbite Logo"
                />
                <span className="self-center text-white text-2xl font-semibold whitespace-nowrap dark:text-white">
                    DropIn
                </span>
                </a>
                {/* Account Name and Profile on the right */}
                <div className="flex items-center space-x-3 relative">
                    <button
                        type="button"
                        onClick={toggleDropdown}
                        className="inline-flex items-center font-medium px-4 py-2 text-sm text-white rounded-lg cursor-pointer hover:bg-gray-100 hover:text-black"
                    >
                        {/* Profile Picture */}
                        {profilePic ? (
                            <img
                                src={profilePic}
                                alt="Profile"
                                className="w-8 h-8 me-2 rounded-full"
                            />
                        ) : (
                            <svg
                                className="w-6 h-6 me-2 rounded-full"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                            </svg>
                        )}
                        {username}
                    </button>
                    <div
                        id="dropdown-menu"
                        className="hidden absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg w-full"
                    >
                        <ul className="py-2">
                            <li>
                                <a
                                    href="#settings"
                                    onClick={() => navigate("/settings")}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Settings
                                </a>
                            </li>
                            {role === "admin" && (
                                <li>
                                    <a
                                        href="#users"
                                        onClick={() => navigate("/users")}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Users
                                    </a>
                                </li>
                            )}
                            <li>
                                <a
                                    href="#logout"
                                    onClick={() => {
                                        localStorage.removeItem("accessToken");
                                        localStorage.removeItem("refreshToken");
                                        navigate("/login");
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
