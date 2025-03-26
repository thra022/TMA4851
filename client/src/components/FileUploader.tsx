import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import * as pdfjsLib from "pdfjs-dist";
import Canvas from './Canvas';
import { render } from 'react-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc ="../../../node_modules/pdfjs-dist/build/pdf.worker.mjs";

const SingleFileUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [changed, setChanged] = useState<boolean> (false) 

    const dragUrl = useRef()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            try {
                renderPDF(URL.createObjectURL(e.target.files[0]))
                //renderPDF(URL.createObjectURL(e.target.files[0]))
            } catch {
                let error = new Error
                throw console.error(error);
            }
        }
    };

    const renderPDF = (url: string) => {

        const getKonvaCanvas = new Promise<HTMLCanvasElement>((resolve,reject) => {
            let canvas = document.querySelectorAll('canvas')
            if (canvas.length == 0) {
                reject('No canvas')
            } else{
                resolve(canvas[canvas.length - 2])
            }
        })

        const loadingTask = pdfjsLib.getDocument(url)
        
        loadingTask.promise.then(function(pdf) {
            pdf.getPage(1).then(function(page) {
                let scale = 1.5;
                let viewport = page.getViewport( {scale: scale});
                let outputScale = window.devicePixelRatio || 1;
        
                //let canvas = document.getElementById('the-canvas') as HTMLCanvasElement
                let canvas;
                getKonvaCanvas.then((cnv) => {
                    canvas=cnv
                    let context = canvas!.getContext('2d')
        
                    canvas.width = Math.floor(viewport.width * outputScale)
                    canvas.height = Math.floor(viewport.height * outputScale)
                    canvas.style.width = Math.floor(viewport.width) + 'px'
                    canvas.style.height = Math.floor(viewport.height) + 'px'
                    let transform = outputScale !== 1 ?
                        [outputScale,0,0,outputScale,0,0]
                        : null
                    
                    let renderContext = {
                        canvasContext: context!,
                        transform: transform!,
                        viewport: viewport!
                    }
                        let renderTask = page.render(renderContext)
                        renderTask.promise.then(function() {
                            console.log('rendered')
                            setChanged(true)
                        })
                
                
                }).catch((err) => {throw new Error(err)})
                
            })
        })
    }

    return (
        <>
        <div className="flex content-center py-5">
            <div className="inline-block px-10">
                <div className='bg-[#b0caff] max-w-[500px] text-[white] rounded-[10px] mt-3'>
                    <h1><b><i>Upload files</i></b></h1>
                    <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                        <p>
                            <i>
                                If you would like to sign a .pdf file, please upload the desired file here:
                            </i>
                        </p>
                        <br/>
                        <div>Choose which files to upload</div>
                        <div className='flex flex-col items-center mb-4;'>
                            <input id='file' type='file'
                            accept='image/*,.pdf'
                            className='bg-[blue] hover:cursor-pointer hover:brightness-[85%] hover:transition-[0.3s] mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer' 
                            onChange={handleFileChange} />
                        </div>
                    </div>  
                </div>
                <div className='bg-[#b0caff] max-w-[500px] text-[white] rounded-[10px] mt-3'>
                    <h1><b><i>Upload files</i></b></h1>
                    <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                        <p>
                            <i>
                                Drag and drop your signature to the document
                            </i>
                        </p>
                        <br/>
                        <div>
                            <p>Your signature:</p>
                            {/*ENDRE TIL DYNAMISK */}
                            <img
                            alt='signature'
                            src='/testsign.png'
                             />
                        </div>
                        
                        
                    </div>  
                </div>
            </div>
                <div className="relative px-[10px] " >
                
                {file && (
                            <div className='bg-[#b0caff] text-[white] w-[892px] rounded-[10px] mt-3'>
                                <h1><b><i>{file.name}</i></b></h1>
                            </div>
                        )}
                
                <Canvas />
                </div>
            </div>
        </>
        
    );
};

/**
 * PDF form
 * w = 892 px
 * h = 1263 px
 */


/**
 * {file && (
                <div className='bg-[#b0caff] text-[white] rounded-[10px] mt-3'>
                    <h1><b><i>{file.name}</i></b></h1>
                    <section>
                        <object
                        id = 'myPdf'
                        className='pdf flex w-[100%] h-[1500px]'
                        data={URL.createObjectURL(file)}
                        >
                        </object>

                        <button
                            onClick={() => {navigator.clipboard.write}}
                            className='bg-[blue] hover:cursor-pointer hover:brightness-[85%] hover:transition-[0.3s] mt-3 px-8 py-1 rounded-full text-white hover:cursor-pointer text-lg'
                            >
                                Copy to clipboard
                        </button>
                        
                    </section>
                </div>
            )}
 */
/**
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
 */
export default SingleFileUploader