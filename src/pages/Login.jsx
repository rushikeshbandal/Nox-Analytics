import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Form from "../component/Form";
import Message from "../component/Message";
import { Button, message } from "antd";

const Login = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  
  const success = (type, message) => {
    messageApi.open({
      type: `${type}`,
      content: `${message}`,
    });
  };

  const error = (type, message) => {
    messageApi.open({
      type: `${type}`,
      content: `${message}`,
    });
  };

  const handleLogin = async (formData) => {
    const { email, password } = formData;
    setLoading(true);

    try {
      // Validation
      if (!email || !password) {
        error("error", "Please fill in all fields");
        return;
      }

      // Email validation with better regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        error("error", "Please enter a valid email address");
        return;
      }

      if (password.length < 6) {
        error("error", "Password must be at least 6 characters long");
        return;
      }

      // Step 1: Get allUsers from localStorage
      const allUsers = JSON.parse(localStorage.getItem("allUsers")) || [];

      // Step 2: Check if the user exists
      const foundUser = allUsers.find(
        (user) => user.email === email && user.password === password
      );

      if (foundUser) {
        // Step 3: Save current user to localStorage
        localStorage.setItem(
          "userRole",
          JSON.stringify({ role: foundUser.role })
        );
        localStorage.setItem(
          "user",
          JSON.stringify({ role: foundUser })
        );

        // Step 4: Redirect based on role
        if (foundUser.role === "admin") {
          success("success", "Admin Login Successfully");
          setTimeout(() => {
            navigate("/Admin/Dashboard");
          }, 1000);
        }else  if (foundUser.role === "user") {
          success("success", "User Login Successfully");
          setTimeout(() => {
            navigate("/User/Dashboard");
          }, 1000);
        } else {
          success("success", "Super Admin Login Successfully");
          setTimeout(() => {
          navigate("/SuperAdmin/Dashboard");
        }, 1000)
        }
      } else {
        error("error", "Invalid email or password");
      }
    } catch (err) {
      error("error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <div className="w-screen h-screen overflow-hidden flex justify-center items-center">
      <Message contextHolder={contextHolder} />

      <Form formType="login" onSubmit={handleLogin} />
       {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none ">
        <div className="absolute -top-32 -right-32 md:-top-40 md:-right-40 w-60 h-60 md:w-80 md:h-80 bg-[#1995AD]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 md:-bottom-40 md:-left-40 w-60 h-60 md:w-80 md:h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Login;

