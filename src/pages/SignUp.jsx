import React from "react";
import { useNavigate } from "react-router-dom";
import Form from "../component/Form";
import Message from "../component/Message";
import { message } from "antd";
const SignUp = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
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

  const handleSignup = (formData) => {
    const { email, password, confirmPassword, role } = formData;

    // Validation
    if (!email || !password || !confirmPassword) {
      error("error", "Please fill in all fields");
      return;
    }

    if (!role) {
      error("error", "Please select a user type");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error("error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      error("error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      error("error", "Passwords do not match");
      return;
    }

    // Save current role for auth redirection
    localStorage.setItem("userRole", JSON.stringify(formData.role || {}));

    // Get existing users from localStorage (or initialize an empty array)
    const existingUsers = JSON.parse(localStorage.getItem("allUsers")) || [];

    // Check if user already exists (basic email check)
    const userExists = existingUsers.some(
      (user) => user.email === formData.email
    );
    if (userExists) {
      error("error", "User already exists with this email.");
      return;
    }

    // Add new user to the array
    const updatedUsers = [...existingUsers, formData];

    // Save updated array back to localStorage
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers || {}));

    // Show success message
    success("success", "User created successfully.");
    setTimeout(() => {
      navigate("/Login");
    }, 1000);
  };

  return (
    <div className="w-screen h-screen  flex justify-center items-center">
      <Message contextHolder={contextHolder} />
      <Form formType="signup" onSubmit={handleSignup} />
       {/* Background decoration */}
       {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none ">
        <div className="absolute -top-32 -right-32 md:-top-40 md:-right-40 w-60 h-60 md:w-80 md:h-80 bg-[#1995AD]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 md:-bottom-40 md:-left-40 w-60 h-60 md:w-80 md:h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>
    </div> 
  );
};

export default SignUp;
