import { NavLink } from 'react-router'

export function Navbar() {

    return (
        <>
            <nav className='nav'>
            <ul className='navlist'>
                <div className='navleft'>
                    <li className='navlistelement'><NavLink className='navelementText' to="/">Home</NavLink></li>
                </div>
                <div className='navright'>
               </div>
            </ul>

        </nav>

        </>
    )
}