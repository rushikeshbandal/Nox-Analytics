import React from 'react';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Space, Switch } from 'antd';

const SwitchButton = ({checked, onClick }) => {
  return (
    <Space direction="vertical">
      <Switch
      checked={checked}
        onClick={onClick}
        checkedChildren={< MoonOutlined/>}
        unCheckedChildren={<SunOutlined  />}
      />
    </Space>
  );
};

export default SwitchButton;
