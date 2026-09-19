import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import HomePageHeader from './HomePageHeader'
import Footer from './Footer/Footer'
import { Divider } from 'antd'

const HomePageLayout = () => {
  return (
    <div className='flex flex-col bg-[#1A1A1A]'>
        <HomePageHeader/>
        <Outlet/>
        <Footer/>
    </div>
  )
}

export default HomePageLayout