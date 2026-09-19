// src/components/Loader.jsx
import React from 'react';
import { Spin } from 'antd';

const Loader = ({ loading, children, tip = "Loading...", size = "large" }) => {
  return (
    <Spin spinning={loading} tip={tip} size={size}>
      {children}
    </Spin>
  );
};

export default Loader;
