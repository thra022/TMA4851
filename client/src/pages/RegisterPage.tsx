import { useState } from 'react'
import { register } from '../services/api'
//import { useAuth } from '../context/auth/AuthContext'
import { useNavigate } from 'react-router'

export function RegisterPage() {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [password1, setPassword1] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [fullName, setFullName] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null);

        let invalid = false

        if(username==''){
            setError('username missing')
            invalid = true
        }
        if(email==''){
            setError('Email missing')
            invalid = true
        }
        if(fullName==''){
            setError('Full Name missing')
            invalid = true
        }
        if(password==''){
            setError('Password missing')
            invalid = true
        }
        if(password != password1){
            setError('Passwords do not match')
            invalid = true
        }
        if (!invalid) {
            try {
                const data = await register(username, password, email, fullName)
                if (data != null) {
                    navigate("/login");
                }
            } catch (err) {
                setError('Registration failed. Please check your information and try again.')
            }
        }
        
    }
    return (
        <>
            <div className='flex justify-center'>
                <img src="src/assets/logo.svg" className="items-center size-60 " alt="Logo" />
            </div>
            <div className='flex justify-center'>
            <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
            <h1 className='px-1 text-center'><b><i>Welcome</i></b></h1>
            <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy rounded-b-[10px]'>
                <p> Hei ENES
                    <i>
                        Hello, welcome to Airsign inc.<br/>
                        In order to create your account, please enter your information here:<br/>
                    </i>
                </p>
                <br/>
                <form className='flex flex-col items-center bg-[#EEEEEE] rounded-[10px] px-5 py-5' onSubmit={handleSubmit}>
                    <input className='bg-white mb-3 py-1 px-1' type='username' placeholder='Username' onChange={(e) => setUsername(e.target.value)} />
                    <input className='bg-white mb-3 py-1 px-1' type='email' placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
                    <input className='bg-white mb-3 py-1 px-1' type='fullName' placeholder='Full Name' onChange={(e) => setFullName(e.target.value)} />
                    <input className='bg-white mb-3 py-1 px-1' type='password' placeholder='Password' onChange={(e) => setPassword(e.target.value)} />
                    <input className='bg-white mb-3 py-1 px-1' type='password' placeholder='Confirm password' onChange={(e) => setPassword1(e.target.value)} />

                    <button className='bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full' type='submit'>Register</button>
                    {error && <p className='text-red-500'>{error}</p>}
                </form>
            </div>
        </div>
                
            </div>
        </>
    )
}
