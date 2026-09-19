import React from 'react'

const Input = ({type, placeholder, onChange, name, className}) => {
  return (
   <input 
   type={type} 
   placeholder={placeholder} 
   name={name} 
   onChange={onChange} 
   className={className}/>
  )
}

export default Input