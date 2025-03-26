import { Navbar } from "./Navbar"
import SingleFileUploader from "../components/FileUploader"
import Canvas from "../components/Canvas"

export function FileUpload() {
    return (
        <>
        <div className="min-w-[1280px] h-full max-width: 1280px mx-[auto] my-[auto] p-2rem text-center">
            <Navbar />
                <div className='flex-[content] mt-[80px] bg-[#d7f8ff] rounded-md px-5'>
                    <SingleFileUploader />
                </div>
            </div>
        </>
    )
}