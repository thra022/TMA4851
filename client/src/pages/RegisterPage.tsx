import { useState, useEffect } from 'react'
import { login } from '../services/api'
import { useAuth } from '../context/auth/AuthContext'
import { register } from '../services/api'
import { useNavigate } from 'react-router'
import SignatureCanvas from '../components/CameraHandSign'

export function RegisterPage() {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [password1, setPassword1] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [fullName, setFullName] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [showOverlay, setShowOverlay] = useState(false);

    const navigate = useNavigate();

    const { login: authLogin, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/')
        }
    }, [])

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null);
        let invalid = false

        if (username == '') {
            setError('username missing')
            invalid = true
        } else if (email == '') {
            setError('Email missing')
            invalid = true
        } else if (fullName == '') {
            setError('Full Name missing')
            invalid = true
        } else if (password == '') {
            setError('Password missing')
            invalid = true
        } else if (password != password1) {
            setError('Passwords do not match')
            invalid = true
        }
        if (!invalid) {
            setShowOverlay(true);

        }
    }

    const handleRegister = async (pngBlob: Blob) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('email', email);
        formData.append('fullName', fullName);
        formData.append('signature', pngBlob, 'signature.png');

        try {
            await register(formData);
            const data = await login(username, password)
            authLogin(data.token);
            navigate("/");
        }
        catch (err) {
            setError('Registration failed. Please check your information and try again.')
        }

    }
    return (
        <>
            <div className='flex justify-center'>
                <img src="src/assets/logo.svg" className="items-center size-60 " alt="Logo" />
            </div>
            <div className='flex justify-center'>
                {showOverlay && (
                    <div className="absolute bg-white justify-center shadow-lg animate-slide-in z-2">
                        <h3 className="text-2xl font-semibold text-center">Signature Registration</h3>
                        <SignatureCanvas register={handleRegister}/>
                        {/* <button className='bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full' onClick={handleSubmit}>Register</button> */}
                        <button onClick={() => setShowOverlay(false)}>Back</button>
                        {error && <p className='text-red-500'>{error}</p>}
                    </div>)
                }
                <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
                    <h1 className='px-1 text-center'><b><i>Welcome</i></b></h1>
                    <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy rounded-b-[10px]'>
                        <p>
                            <i>
                                Hello, welcome to Airsign inc.<br />
                                In order to create your account, please enter your information here:<br />
                            </i>
                        </p>
                        <br />
                        <form className='relative flex flex-col items-center bg-[#EEEEEE] rounded-[10px] px-5 py-5' onSubmit={handleContinue}>
                            <input className='bg-white mb-3 py-1 px-1' type='username' placeholder='Username' onChange={(e) => setUsername(e.target.value)} />
                            <input className='bg-white mb-3 py-1 px-1' type='email' placeholder='Email' onChange={(e) => setEmail(e.target.value)} />
                            <input className='bg-white mb-3 py-1 px-1' type='fullName' placeholder='Full Name' onChange={(e) => setFullName(e.target.value)} />
                            <input className='bg-white mb-3 py-1 px-1' type='password' placeholder='Password' onChange={(e) => setPassword(e.target.value)} />
                            <input className='bg-white mb-3 py-1 px-1' type='password' placeholder='Confirm password' onChange={(e) => setPassword1(e.target.value)} />
                            <button className='bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full'>Continue</button>

                            {error && <p className='text-red-500'>{error}</p>}
                        </form>
                    </div>
                </div>

            </div>
        </>
    )
}
