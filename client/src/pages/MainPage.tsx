import { Navbar } from "./Navbar"

/**
 * Temporary box
 */
function Box() {
    return(
        <div className='block w-full h-auto max-w-[680px] h-[250px] max-h-[400px] aspect-16/9 bg-[red] text-[white] outline-[grey] outline-[5px] rounded-[20px] outline-style: outset mt-3'>
            Webcam missing or something
            <br/>
            Oh, the humanity!
            </div>
    )
}

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
        <button className={`bg-[${props.colour}] hover:cursor-pointer hover:brightness-[85%] hover:transition-[0.3s] mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer text-lg`} onClick={example}>
            {props.title}
            </button>
    )
}



export function MainPage() {
    return (
        <>
        <Navbar />
            <div className='flex-[content] mt-[45px] bg-[#d7f8ff] rounded-md h-full'>
                <section className="">
                    <div className="grid grid-cols-5 content-center py-5">
                            <div className='px-5 col-span-3'>
                                <Box />
                                <div className='py-2'>
                                <Button title='Start capture' colour='green'/> 
                                <div className="inline-block mx-2"/>
                                <Button title='Export signature' colour='blue'/>
                                </div>
                            </div>
                            <div className='px-5 col-span-2'>
                                <Welcome />
                                <div className='py-2'/>
                                <Upload/>
                                <div className='py-2'/>
                            </div>
                    </div>
                </section>
            </div>
        </>
    )
}

