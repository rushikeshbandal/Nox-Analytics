import React from 'react'

const Button = ({onClick, title, type, className }) => {
  return (
    <button 
    className={className}
    type={type} 
    onClick={onClick}>{title}</button>
  )
}

export default Button