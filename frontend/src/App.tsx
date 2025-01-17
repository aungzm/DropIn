import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import Setting from "./pages/Setting";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Users from "./pages/Users";
import SpaceShare from "./pages/SpaceShare";
import FileSharePage from "./pages/FileShare";
import PrivateRoute from "./components/privateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/shares/space/:shareSecret" element={<SpaceShare />} />
        <Route path="/shares/file/:shareSecret" element={<FileSharePage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Setting />} />
          <Route path="/upload/:spaceId" element={<Upload />} />
          <Route path="/users" element={<Users />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
