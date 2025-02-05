import logo from '../assets/logo.svg'
import { useState } from 'react'

function LoginPage() {
    const [email, setEmail] = useState<string>()
    const [password, setPassword] = useState<string>()

    return (
        <>
            <div className='flex justify-center'>
                <img src={logo} className="items-center size-90 " alt="Logo" />
            </div>
            <div className='flex justify-center'>
                <form className='flex flex-col items-center'>
                    <input className='bg-white mb-3 py-1' type='email' placeholder=' Email' onChange={(e) => setEmail(e.target.value)} />
                    <input className='bg-white py-1' type='password' placeholder=' Password' onChange={(e) => setPassword(e.target.value)} />
                    <button className='bg-purple-900/80 mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer'>Login</button>
                    <a className='underline hover:cursor-pointer mt-1'> Register </a>
                </form>
            </div>
        </>
    )
}

export default LoginPage