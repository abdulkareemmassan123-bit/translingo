import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {

    const {selectedUser} = useContext(ChatContext)

  return (
  <div className="border w-full h-screen sm:px-[1%] sm:py-[1%] bg-gray-900">
    <div
      className={`border-2 border-gray-700  overflow-hidden w-full h-full max-w-[1600px] mx-auto grid grid-cols-1 relative ${
        selectedUser
          ? 'md:grid-cols-[1fr_2fr_1fr] xl:grid-cols-[1fr_3fr_1fr]'
          : 'md:grid-cols-2'
      }`}
    >
      <Sidebar />
      <ChatContainer />
      {selectedUser && <RightSidebar />}
    </div>
  </div>
)

}

export default HomePage
