import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { ConfigProvider, Dropdown, Space } from "antd";

const DropDown = ({ items, label, icon, className }) => {
  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <a onClick={(e) => e.preventDefault()}>
        <div className={className}>
          {icon}

          <span>{label}</span>
          <DownOutlined className="text-black" />
        </div>
      </a>
    </Dropdown>
  );
};

export default DropDown;
