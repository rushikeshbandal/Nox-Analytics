import React from 'react'
import { Table } from 'antd';
const CustomTable = ({ columns, data, pagination }) => {
  return (
    <Table
    columns={columns}
    dataSource={data}
    rowKey={(record, index) => index}
    pagination={pagination}
    scroll={{ x: 'max-content' }} // Scroll if there are more columns
  />
  )
}

export default CustomTable