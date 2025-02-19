import { NavLink } from 'react-router'

export function Navbar() {

    return (
        <>
            <nav className='fixed bg-[#b0caff] w-full h-[80px] left-0 top-0 rounded-b-xl'>
            <ul className='list-none text-left'>
                <div className='float-left'>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/"><img src='/public/logo.svg' width='160px' height='auto' /></NavLink></li>
                </div>
                <div className='float-right px-7 rounded-l-xl hover:bg-[#b0bbff] fill '>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/login"><img className='h-[80px] w-[80px] px-4 py-4' src='/public/userIcon.svg'  /></NavLink></li>
               </div>
            </ul>

        </nav>

        </>
    )
}