import { NavLink } from 'react-router'

export function Navbar() {

    return (
        <>
            <nav className='fixed bg-[#b0caff] w-full h-[80px] left-0 top-0 rounded-b-xl z-1'>
            <ul className='list-none text-left z-2'>
                <div className='float-left z-3'>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/"><img className='w-[160px] h-auto z-4' src='/logo.svg'/></NavLink></li>
                </div>
                <div className='float-right px-7 rounded-l-xl hover:bg-[#b0bbff] fill z-3'>
                    <li className='inline'><NavLink className='color-[#FFFFFF]' to="/login"><img className='h-[80px] w-[80px] px-4 py-4 z-4' src='/userIcon.svg'  /></NavLink></li>
               </div>
            </ul>

        </nav>

        </>
    )
}