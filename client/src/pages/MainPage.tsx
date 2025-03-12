import { Navbar } from "./Navbar"
import SignatureCanvas from "../components/CameraHandSign"

function Welcome() {
    return(
        <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
            <h1><b><i>Welcome</i></b></h1>
            <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
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
        <div className='bg-[#b0caff] max-w-[300px] text-[white] rounded-[10px] mt-3'>
            <h1><b><i>Upload files</i></b></h1>
            <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                <p>
                    <i>
                        If you would like to sign a .pdf file, please upload the desired file here:
                    </i>
                </p>
                <br/>
                <div>Choose which files to upload</div>
                <button className={`bg-[blue] hover:cursor-pointer hover:brightness-[85%] hover:transition-[0.3s] mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer text-lg`}>
                  Select Files
                </button>
            </div>
        </div>
    )
}

export function MainPage() {
    return (
        <>
        <div className="min-w-[1280px] h-full max-width: 1280px mx-[auto] my-[auto] p-2rem text-center">
            <Navbar />
                <div className='flex-[content] mt-[80px] bg-[#d7f8ff] rounded-md px-5'>
                    <section className="">
                        <div className="grid grid-cols-5 content-center py-5">
                                <div className='px-10 col-span-3'>
                                    <SignatureCanvas />
                                    <div className='py-2'>
                                    </div>
                                </div>
                                <div className='px-10 col-span-2 text-lg'>
                                    <Welcome />
                                    <div className='py-2'/>
                                    <Upload/>
                                    <div className='py-2'/>
                                </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}

