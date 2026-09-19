import React from 'react'
import { Rate } from 'antd';

const RatingStar = ({rating}) => {
  return (
    <Rate allowHalf defaultValue={rating} />
  )
}

export default RatingStar