import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";

const App = () => {
  const url = "http://localhost:4000";
  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        limit={3}
        theme="dark"
      />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <Routes>
          <Route path="/"       element={<Login   url={url} />} />
          <Route path="/add"    element={<Add     url={url} />} />
          <Route path="/list"   element={<List    url={url} />} />
          <Route path="/orders" element={<Orders  url={url} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;

