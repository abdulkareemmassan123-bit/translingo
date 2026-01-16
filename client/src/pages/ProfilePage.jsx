import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {

  const {authUser, updateProfile} = useContext(AuthContext)

  const [selectedImg, setSelectedImg] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName || '')
  const [bio, setBio] = useState(authUser.bio || '')
  const [gender, setGender] = useState(authUser.gender || '')
  const [language, setLanguage] = useState(authUser.language || '')
  const [languagesList, setLanguagesList] = useState([])

  // Fetch languages on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/arash16/countries-languages/refs/heads/master/lib/languages.json')
        const data = await response.json()
        
        // Convert object to array and sort by full name
        const languagesArray = Object.entries(data).map(([code, lang]) => ({
          code,
          name: lang.full
        })).sort((a, b) => a.name.localeCompare(b.name))
        
        setLanguagesList(languagesArray)
      } catch (error) {
        console.error('Error fetching languages:', error)
      }
    }

    fetchLanguages()
  }, [])

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if(!selectedImg){
      await updateProfile({fullName: name, bio, gender, language});
      navigate('/');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async ()=>{
      const base64Image = reader.result;
      await updateProfile({profilePic: base64Image, fullName: name, bio, gender, language});
      navigate('/');
    }
    
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
          <h3 className="text-lg">Profile details</h3>
          
          {/* Profile Image Upload */}
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e)=>setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden/>
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} alt="" className={`w-12 h-12 ${selectedImg && 'rounded-full'}`}/>
            upload profile image
          </label>

          {/* Name */}
          <input onChange={(e)=>setName(e.target.value)} value={name}
           type="text" required placeholder='Your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent'/>

          {/* Gender Selection */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm text-gray-300'>Gender</label>
            <div className='flex gap-4 flex-wrap'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input 
                  type="radio" 
                  name="gender" 
                  value="male" 
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                  className='w-4 h-4'
                />
                <span>Male</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input 
                  type="radio" 
                  name="gender" 
                  value="female" 
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
                  className='w-4 h-4'
                />
                <span>Female</span>
              </label>
            </div>
          </div>

          {/* Language Selection */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm text-gray-300'>Preferred Language</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent text-white'
            >
              <option value="" >Select a language</option>
              {languagesList.map((lang) => (
                <option key={lang.name} value={lang.name} className='bg-gray-900'>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder="Write profile bio" required className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent resize-none" rows={3}></textarea>

          <button type="submit" className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer hover:opacity-90 transition-opacity">Save</button>
        </form>
        <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && 'rounded-full'}`} src={authUser?.profilePic || assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfilePage