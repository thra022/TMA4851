//import logo from '/src/assets/logo.svg'
//import { useState } from 'react'
import { NavLink } from 'react-router'



export function Navbar() {

    return (
        <>
            <nav className='nav'>
            <ul className='navlist'>
                <div className='navleft'>
                    <li className='navlistelement'><NavLink className='navelementText' to="/home">Home</NavLink></li>
                </div>
                <div className='navright'>
                <li className='navlistelement'><NavLink className='navelementText' to="/">Login</NavLink></li></div>
            </ul>

        </nav>

        </>
    )
}