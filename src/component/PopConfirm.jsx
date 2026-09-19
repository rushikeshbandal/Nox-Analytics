import { Popconfirm } from 'antd'
import React from 'react'

const PopConfirm = ({title ,
    description,
    onConfirm,
    onCancel,
    okText,
    cancelText, children}) => {
  return (
   <>
     <Popconfirm
    title={title}
    description={description}
    onConfirm={onConfirm}
    onCancel={onCancel}
    okText={okText}
    cancelText={cancelText}
  >{children}</Popconfirm>
  </>
  )
}

export default PopConfirm