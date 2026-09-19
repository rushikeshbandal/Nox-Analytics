import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Input, Select, Typography } from "antd";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  UserOutlined,
  UserAddOutlined,
  LoginOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

const ReusableForm = ({ formType, onSubmit }) => {
  const isLogin = formType === "login";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    ...(isLogin ? {} : { confirmPassword: "", role: "" }),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Home Button */}
      <div className="flex justify-end mb-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-[#1995AD] hover:text-[#16788c] transition-all"
        >
          <HomeOutlined />
          <span className="text-sm font-medium">Home</span>
        </Link>
      </div>

      <h2 className="text-center text-4xl font-semibold text-[#1995AD] mb-6">
        {isLogin ? "Welcome Back" : "Create an Account"}
      </h2>

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={
            <span className="text-base font-medium">
              <MailOutlined className="mr-1" />
              Email
            </span>
          }
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@domain.com"
            className="rounded-md py-2 px-3 border hover:border-[#1995AD] transition-all"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-base font-medium">
              <LockOutlined className="mr-1" />
              Password
            </span>
          }
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            className="rounded-md py-2 px-3 border hover:border-[#1995AD] transition-all"
          />
        </Form.Item>

        {!isLogin && (
          <>
            <Form.Item
              label={
                <span className="text-base font-medium">
                  <LockOutlined className="mr-1" />
                  Confirm Password
                </span>
              }
              name="confirmPassword"
              rules={[
                { required: true, message: "Please confirm your password" },
              ]}
            >
              <Input.Password
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                className="rounded-md py-2 px-3 border hover:border-[#1995AD] transition-all"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-base font-medium">
                  <UserOutlined className="mr-1" />
                  Sign up as
                </span>
              }
              name="role"
            >
              <Select
                value={formData.role}
                onChange={handleSelectChange}
                className="rounded-md"
                placeholder="Select user type"
              >
                <Option value="user">User</Option>
                <Option value="superAdmin">Super Admin</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item>
          <button
            htmlType="submit"
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-lg text-white text-base font-medium bg-[#1995AD] hover:bg-[#16788c] transition-all shadow-md"
          >
            {isLogin ? <LoginOutlined /> : <UserAddOutlined />}
            {isLogin ? "Login" : "Create Account"}
          </button>
        </Form.Item>
      </Form>

      <Text className="block text-center mt-4 text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link
          to={isLogin ? "/signup" : "/Login"}
          className="text-[#1995AD] hover:underline font-medium"
        >
          {isLogin ? "Register" : "Login"}
        </Link>
      </Text>
    </div>
  );
};

export default ReusableForm;
