//import logo from '/src/assets/logo.svg'
import { ReactNode, useState } from 'react'
import { Link } from 'react-router'

/**
 * Temporary box
 */
function Box() {
    return(
        <div className='box'>
            Webcam missing or something
            <br/>
            Oh, the humanity!
            </div>
    )
}

function Welcome() {
    return(
        <div className='wlcHeader'>
            <h1><b><i>Welcome</i></b></h1>
            <div className='wlc'>
                <p>
                    <i>
                        Hello, welcome to Airsign inc.<br/>
                        In order to use our services, please grant permission to the browser to use your webcam.<br/>
                    </i>
                </p>
                <br/>
                <b>Now, all you need to do is:</b>
                <ul className='text-left'>
                    <li>1. Press "Start capture"</li>
                    <li>2. Pinch your fingers to calibrate and wait 5 seconds</li>
                    <li>3. Start writing</li>
                    <li>4. After you stop writing wait a few seconds and decide whether or not to save your signature!</li>
                    </ul> 
            </div>
        </div>
    )
}
function Upload() {
    return(
        <div className='wlcHeader'>
            <h1><b><i>Upload files</i></b></h1>
            <div className='wlc'>
                <p>
                    <i>
                        If you would like to sign a .pdf file, please upload the desired file here:
                    </i>
                </p>
                <br/>
                <div>Choose which files to upload</div>
                <Button title='Select files' colour='blue'/>
            </div>
        </div>
    )
}

function Button(props:{title:string, colour:string}) {
    let example = () => {
        alert("nothing happened!")
    }
    return(
        <button className={`button ${props.colour}`} onClick={example}>
            {props.title}
            </button>
    )
}



export function MainPage() {
    return (
        <>
            <div className='mainWrapper'>
                <div className="row">
                    <div className='columnLeft'>
                        <Box />
                        <div className='py-5'/>
                        <Button title='Start capture' colour='green'/> <Button title='Export signature' colour='blue'/>

                    </div>
                    <div className='columnRight'>
                        <Welcome />
                        <div className='py-10'/>
                        <Upload/>
                    </div>
                </div>
            </div>
        </>
    )
}

