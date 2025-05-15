import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const Navbar = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("User");
  const [role, setRole] = useState("user");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userInfoResponse = await api.get("/users/");
        const user = userInfoResponse.data.user;
        setUsername(user.username);
        setRole(user.role);

        const profilePicResponse = await api.get("/users/profile", {
          responseType: "blob",
        });

        const contentType = profilePicResponse.headers["content-type"];
        if (contentType?.startsWith("image/")) {
           const imageUrl = URL.createObjectURL(profilePicResponse.data);
           setProfilePic(imageUrl);
         } else {
           setProfilePic(null); // Indicate no custom image
         }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Optionally revoke previous blob URL if it exists and error occurs
        if (profilePic && profilePic.startsWith('blob:')) {
           URL.revokeObjectURL(profilePic);
        }
        setProfilePic(null); // Reset profile pic on error
        navigate("/login"); // Redirect on error
      }
    };
    fetchUserData();

    // Cleanup blob URL on component unmount
    return () => {
      if (profilePic && profilePic.startsWith('blob:')) {
        URL.revokeObjectURL(profilePic);
      }
    };
  }, [navigate]); // Rerun effect if navigate changes

  // Dependency array includes profilePic to handle cleanup correctly if it changes
  useEffect(() => {
      return () => {
          if (profilePic && profilePic.startsWith('blob:')) {
              URL.revokeObjectURL(profilePic);
          }
      };
  }, [profilePic]);


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

   const handleLogout = () => {
     localStorage.removeItem("accessToken");
     localStorage.removeItem("refreshToken");
     if (profilePic && profilePic.startsWith('blob:')) {
       URL.revokeObjectURL(profilePic); // Clean up blob URL on logout
     }
     navigate("/login");
   };

  return (
    <nav className="bg-black fixed w-full top-0 left-0 border-b border-gray-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center space-x-3">
              <img
                className="h-8 w-auto"
                src="https://flowbite.com/docs/images/logo.svg"
                alt="DropIn Logo"
              />
              <span className="text-white text-xl font-semibold">
                DropIn
              </span>
            </a>
          </div>

          <div className="flex items-center">
            <div className="ml-3 relative">
              <button
                type="button"
                onClick={toggleDropdown}
                className="flex items-center max-w-xs bg-black text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white p-1 hover:bg-gray-800 transition duration-150 ease-in-out"
                id="user-menu-button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                {profilePic ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={profilePic}
                    alt="User profile"
                  />
                ) : (
                  <svg
                    className="h-8 w-8 rounded-full text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                )}
                 <span className="ml-2 text-white font-medium hidden md:block">{username}</span>
                 <svg className="ml-1 h-5 w-5 text-gray-400 hidden md:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
              </button>

              {isDropdownOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <button
                    onClick={() => { navigate("/settings"); setIsDropdownOpen(false); }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-0"
                  >
                    Settings
                  </button>
                  {role === "admin" && (
                    <button
                       onClick={() => { navigate("/users"); setIsDropdownOpen(false); }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      id="user-menu-item-1"
                    >
                      Users
                    </button>
                  )}
                  <button
                    onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-2"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;