import { Navbar } from "./Navbar"
import SignatureCanvas from "../components/CameraHandSign"
import { useAuth } from "../context/auth/AuthContext"
import SingleFileUploader from "../components/FileUploader"
import { MouseEvent, MouseEventHandler, useEffect, useState } from "react"

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
      <>
      </>
    )
}
 
export function MainPage() {
    const { probability } = useAuth();
    const [data_from_child, setDataFromChild] = useState("")

    const handleDataFromChild = (data:string) => {
      setDataFromChild(data)
    }
    
    return (
        <>
        <div className="min-w-[1280px] h-full max-width: 1280px mx-[auto] my-[auto] p-2rem text-center">            <Navbar />
                <div className='flex-[content] mt-[80px] bg-[#d7f8ff] rounded-md px-5'>
                    <section className="">
                        <div className="grid grid-cols-5 content-center py-5">
                                <div className='px-10 col-span-3'>
                                    <SignatureCanvas send_data_to_parent={handleDataFromChild}/>
                                    {probability ? <p>Probability: {probability}</p> : null}
                                    <div className='py-2'>
                                    </div>
                                </div>
                                <div className='px-10 col-span-2 text-lg'>
                                    <Welcome />
                                    <div className='py-2'/>
                                </div>
                            {(data_from_child != '') && (
                              <SingleFileUploader file_src={data_from_child}/>
                              )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}

