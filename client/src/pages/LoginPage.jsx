import React, { useContext, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [gender, setGender] = useState("")
  const [language, setLanguage] = useState("")
  const [languagesList, setLanguagesList] = useState([])
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const {login} = useContext(AuthContext)

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

  const onSubmitHandler = (event)=>{
    event.preventDefault();

    if(currState === 'Sign up' && !isDataSubmitted){
      setIsDataSubmitted(true)
      return;
    }

    login(currState=== "Sign up" ? 'signup' : 'login', {fullName, email, password, bio, gender, language})
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>

      {/* -------- left -------- */}
      <img src={assets.logo} alt="" className='w-[min(30vw,350px)] max-sm:w-[200px]'/>

      {/* -------- right -------- */}

      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-[min(90vw,400px)]'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && currState === "Sign up" && (
            <img onClick={()=> setIsDataSubmitted(false)} src={assets.arrow_icon} alt="" className='w-5 cursor-pointer'/>
          )}
         </h2>

        {currState === "Sign up" && !isDataSubmitted && (
          <input onChange={(e)=>setFullName(e.target.value)} value={fullName}
           type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none bg-transparent' placeholder="Full Name" required/>
        )}

        {!isDataSubmitted && (
          <>
          <input onChange={(e)=>setEmail(e.target.value)} value={email}
           type="email" placeholder='Email Address' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent'/>
          <input onChange={(e)=>setPassword(e.target.value)} value={password}
           type="password" placeholder='Password' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent'/>
          </>
        )}

        {currState === "Sign up" && isDataSubmitted && (
          <div className='flex flex-col gap-4'>
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
                className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-white'
                required
              >
                <option value="" className='bg-gray-900'>Select a language</option>
                {languagesList.map((lang) => (
                  <option key={lang.name} value={lang.name} className='bg-gray-900'>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div className='flex flex-col gap-2'>
              <label className='text-sm text-gray-300'>Bio</label>
              <textarea 
                onChange={(e)=>setBio(e.target.value)} 
                value={bio}
                rows={3} 
                className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-white resize-none' 
                placeholder='Provide a short bio...' 
                required
              ></textarea>
            </div>
          </div>
        )}

        <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity'>
          {currState === "Sign up" ? (isDataSubmitted ? "Complete Signup" : "Continue") : "Login Now"}
        </button>

        <div className='flex items-start gap-2 text-sm text-gray-500'>
          <input type="checkbox" required className='mt-1' />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-gray-600'>Already have an account? <span onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer hover:underline'>Login here</span></p>
          ) : (
            <p className='text-sm text-gray-600'>Create an account <span onClick={()=> setCurrState("Sign up")} className='font-medium text-violet-500 cursor-pointer hover:underline'>Click here</span></p>
          )}
        </div>
         
      </form>
    </div>
  )
}

export default LoginPage