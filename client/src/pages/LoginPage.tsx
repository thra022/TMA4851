import { useState, useEffect } from 'react'
import { login } from '../services/api'
import { useAuth } from '../context/auth/AuthContext'
import { useNavigate } from 'react-router'

export function LoginPage() {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate();
    const { login: authLogin, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/')
        }
        console.log(isAuthenticated)
    }, [])

    if (isAuthenticated) {
        navigate('/')
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null);
        try {
            const data = await login(username, password)
            authLogin(data.token, username);
            navigate("/");
        } catch (err) {
            setError('Login failed. Please check your credentials and try again.')
        }
    }
    return (
        <>
            <div className='flex justify-center'>
                <img src="src/assets/logo.svg" className="items-center size-90 " alt="Logo" />
            </div>
            <div className='flex justify-center'>
                <form className='flex flex-col items-center' onSubmit={handleSubmit}>
                    <input className='bg-white mb-3 py-1' type='username' placeholder=' Username' onChange={(e) => setUsername(e.target.value)} />
                    <input className='bg-white py-1' type='password' placeholder=' Password' onChange={(e) => setPassword(e.target.value)} />
                    <button className='bg-purple-900/80 mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer' type='submit'>Login</button>
                    {error && <p className='text-red-500'>{error}</p>}
                    <a className='underline hover:cursor-pointer mt-1' href='/register'> Register </a>
                </form>
            </div>
        </>
    )
}
