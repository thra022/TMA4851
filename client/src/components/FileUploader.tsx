import React, {FC, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import * as pdfjsLib from "pdfjs-dist";
import Canvas from './Canvas';
import jsPDF from 'jspdf';
import Konva from 'konva';

pdfjsLib.GlobalWorkerOptions.workerSrc ="../../../node_modules/pdfjs-dist/build/pdf.worker.mjs";

type SingleFileUploaderProps = {
    file_src: string
}
const SingleFileUploader: FC<SingleFileUploaderProps> = (file_src) => {
    const [file, setFile] = useState<File | null>(null);

    const [rendered, setRendered] = useState(false)

    const [konvaCanvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

    const [stage, setStage] = useState<Konva.Stage | null>(null)


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            try {
                renderPDF(URL.createObjectURL(e.target.files[0]))
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
                getKonvaCanvas.then((cnv) => {
                    let canvas=cnv
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
                            setCanvas(canvas)
                            setRendered(true)
                        })
                
                }).catch((err) => {throw new Error(err)})
                
            })
        })
    }

    const handleDataFromChild = (data:Konva.Stage) => {
        if(data){
            setStage(data)
        } else {console.log('no data?')}
    }
    
    const handleExport = () => {
        if (stage){

            let layers = stage.getLayers()
            let canvases = [layers[0].canvas._canvas, layers[1].canvas._canvas]

            let doc = new jsPDF('p','px')

            doc.addImage(canvases[0],'PNG',0,0,892/2,1262/2)
            doc.addImage(canvases[1],'PNG',0,0,892/2,1262/2)

            doc.save('test.pdf')
            // let doc = new jsPDF('p','px')
            // doc.addImage(
            //     stage.toDataURL({pixelRatio:1, mimeType: 'image/png'}),
            //     'PNG',
            //     0,
            //     0,
            //     892/(1.5),
            //     1262/(1.5))
            // doc.save('test.pdf')



            
            
        }
        konvaCanvas?.toBlob((blob) => {
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob!);
            link.download = "signature.png";
            link.href = url;
            link.click();
            console.log(`${url}`);
            URL.revokeObjectURL(url);
          }, "image/png");

        // console.log('handleExport called')
        // console.log(konvaCanvas)
        // if (canvas != null) {
        //     console.log('canvas exists')
        //     let url = canvas.toDataURL('image/png')
        //     let doc = new jsPDF('p','mm')
        //     doc.addImage(url,'PNG',0,0,canvas.width,canvas.height)
        //     doc.save('test.pdf')
        // } else {
        //     return undefined
        // }
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
                {rendered && (
                    <div className='bg-[#b0caff] max-w-[500px] text-[white] rounded-[10px] mt-3'>
                    <h1><b><i>Export PDF</i></b></h1>
                    
                    <div className='bg-[white] text-[black] p-[5px] text-decoration: wavy'>
                        {konvaCanvas && (
                        <button className='inline-block bg-[green] text-[white] hover:brightness-[85%] hover:transition-[0.3s] hover:cursor-pointer mt-3 px-8 py-1 rounded-full text-lg'
                         onClick={handleExport}>Here</button>
                        )}
                        
                    </div>  
                </div>
                )}
                
            </div>
                <div className="relative px-[10px] " >
                
                {file && (
                            <div className='bg-[#b0caff] text-[white] w-[892px]  rounded-t-lg mt-3'>
                                <h1><b><i>{file.name}</i></b></h1>
                            </div>
                        )}
                
                
                <Canvas send_data_to_parent={handleDataFromChild} cnv_sign={file_src.file_src} />
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