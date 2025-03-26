import { NavLink } from 'react-router'
import { useAuth } from '../context/auth/AuthContext'


export function Navbar() {
    const { logout } = useAuth();   
    
    return (
        <>
            <nav className='flex justify-between fixed bg-[#b0caff] w-full h-[80px] left-0 top-0 rounded-b-xl z-1'>
                <div className='float-left z-3'>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/"><img className='w-[160px] h-auto z-4' src='/logo.svg'/></NavLink></li>
                </div>
                <div className="flex space-x-4">
                <div className='float-right px-7 rounded-l-xl hover:bg-[#b0bbff] fill z-3'>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/login"><img className='h-[80px] w-[80px] px-4 py-4 z-4' src='/userIcon.svg'  /></NavLink></li>
               
               </div>
               <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition cursor-pointer"
        >
          Logout
        </button>
        </div>
        </nav>

        </>
    )
}