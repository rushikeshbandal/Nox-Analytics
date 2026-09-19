import React from 'react'

const Card = ({title, image}) => {
  return (
    <div className='flex flex-col items-center'>
        <p className='mb-[20px] font-Aldrich text-2xl'>{title}</p>
        <div className='rounded-lg shadow-lg'>
            <img src={image} alt="" className='my-6 mx-11'/>
        </div>
    </div>
  )
}

export default Card