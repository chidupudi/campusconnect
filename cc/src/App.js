import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Header";
import UserHome from "./pages/User/UserHome";
import Clubs from "./pages/User/Clubs";
import Purchased from "./pages/User/Purchased";
import Profile from "./pages/Profile";
import AdminHome from "./pages/Admin/AdminHome";
import ClubHome from "./pages/Clubs/ClubHome";
import Signup from "./authorization/Signup";
import Login from "./authorization/Login";
import ClubProfile from "./pages/ClubProfile";


function App(){
  return (
    <Router>
      <div>
        <Navbar/>
        <Routes>
          <Route path="/home" element={<UserHome/>}/>
          <Route path="/clubs" element={<Clubs/>}/>
          <Route path="/purchased" element={<Purchased/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/clubprofile" element={<ClubProfile/>}/>
          <Route path="/adminhome" element={<AdminHome/>}/>
          <Route path="/clubhome" element={<ClubHome/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/login" element={<Login/>}/>

        </Routes>
      </div></Router>
  );
}

export default App;