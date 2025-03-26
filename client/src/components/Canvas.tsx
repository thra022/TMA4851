import React, { DragEvent, FC, LegacyRef, useEffect, useRef, useState } from 'react';

import { Stage, Layer, Text, Rect, Circle, Transformer, Image, KonvaNodeComponent } from 'react-konva';
//import { Image as KonvaImage}   from 'react-konva'
import useImage from 'use-image';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';

type Img = {
    src: string,
    x: number,
    y: number,
    id: string
}
type DragItemProps = {
    src: string,
    onDragStart: Function
} 
const DragItem: FC<DragItemProps> = ({ src, onDragStart}) => {
    return (
        <img
            src={src}
            draggable={true}
            onDragStart={() => onDragStart(src)}
        />
    )
}

const Canvas = () => {
    const [images, setImages] = useState<Img[] | []>([]);
    const [dragImageSrc, setDragImageSrc] = useState('');
    const stageRef = useRef<Konva.Stage | null>(null)
    const [selectedId, selectShape] = useState<string | null>(null)


    // FIX "any" TYPE
    const checkDeselect = (e:any) => {
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty){
            selectShape(null)
        }
    }

    const handleDragStart = (src:string) => {
      setDragImageSrc(src);
    };

    const handleDragOver = (e:DragEvent) => {
      e.preventDefault(); // prevent default behavior
    };

    const handleDrop = (e:DragEvent) => {
      e.preventDefault();
      console.log('drop detected')
      
      if (!dragImageSrc || !stageRef.current) return;
      // Get stage and pointer position
      const stage = stageRef.current;
      
      // Register the pointer position manually since this is a DOM event
      stage.setPointersPositions(e);
    const position = stage.getPointerPosition();
    if (!position) return;
      
      // Add new image to the list
      setImages([
        ...images,
        {
          src: dragImageSrc,
          x: position.x,
          y: position.y,
          id: Date.now().toString()
        }
      ])
    };
    
    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          <DragItem 
            src="/testsign.png" 
            onDragStart={handleDragStart} 
          />
        </div>
        
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
        >
        <Stage
            width={892}
            height={1262}
            ref={stageRef}
            style={{border: '1px solid grey'}}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            >
            <Layer>          
            </Layer>
            <Layer>
              {images.map((img) => (
                <KonvaImage
                  key={img.id}      
                  src={img.src}      
                  x={img.x}      
                  y={img.y}
                  draggable
                  isSelected={img.id === selectedId}
                  //@ts-ignore fix seinare
                  onSelect={() => {
                    selectShape(img.id)
                  }}
                />
              ))}
                
            
            </Layer>

          </Stage>
        </div>
      </div>
    );
  };
  
  // Separate component for Konva Image with proper loading
  
type KonvaImageProps = {
    src: string,
    x: number,
    y: number,
    draggable: boolean,
    isSelected: boolean,
    onSelect: (evt: KonvaEventObject<MouseEvent, any>) => void
}
const KonvaImage: FC<KonvaImageProps> = ({ src, x, y, draggable, isSelected, onSelect }) => {
    const [image] = useImage(src);
    const shapeRef = useRef() as LegacyRef<Konva.Image> | undefined
    const trRef = useRef() as LegacyRef<Konva.Transformer> | undefined;
    
    
    React.useEffect(() => {
        if (isSelected) {
            // @ts-ignore
            trRef.current.nodes([shapeRef.current])
        }
    }, [isSelected])
    
    if (!image) return null;
    
    // Calculate appropriate size
    const maxDimension = 100;
    let width = image.width;
    let height = image.height;
    
    if (width > height) {
      height = (height / width) * maxDimension;
      width = maxDimension;
    } else {
      width = (width / height) * maxDimension;
      height = maxDimension;
    }
    
    return (
        <React.Fragment>
            <Image
                image={image}
                x={x}
                y={y}
                width={width}
                height={height}
                draggable={draggable}
                ref={shapeRef}
                onClick={onSelect}
                onTap={onSelect}
            />
            {isSelected && (
            <Transformer
                ref={trRef}
                rotateEnabled={false}
                boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width > 200) {
                        return oldBox
                    }
                        return newBox
                    }
                }
            />
            )}
    </React.Fragment>

    );
  };
  
  export default Canvas;

/**
 * 
//@ts-ignore
const URLImage = ({ image }) => {
    const [img] = useImage(image.src)

    return (
        <KonvaImage
        image={img}
        x={image.x}
        y={image.y}
        offsetX={img ? img.width / 2 : 0}
        offsetY={img ? img.height / 2 : 0}
        draggable
        />
    )
}
*/

// const Canvas = () => {

//     const dragUrl = useRef()
//     const stageRef = useRef()
//     const [images, setImages] = useState([])

//     const recRef = useRef(null)
//     const trRef = useRef(null)
//     const [imgLoaded, setLoaded] = useState<boolean>(false)

//     const img = new Image()
//     img.src = '/testsign.png'
//     img.onload = () => {
//         setLoaded(true)
//     }

//     useEffect(() => {
//         if(trRef && trRef.current){
//             /* @ts-ignore */
//             trRef.current.nodes([recRef.current])
//         }
//     }, [])

//     /**
//      * DO IF TIME
//      * const [state, setState] = useState('')
//      * const handlePaste = () => {
//         navigator.clipboard.read().then(function(data) {
//             console.log(data)
//         }
//         )
//     }
    
    

//     useEffect(() => {
//         const handleKeyDown = (event: KeyboardEvent) => {
//             event.preventDefault()
//             const code = event.which || event.keyCode;
//             let charCode = String.fromCharCode(code).toLowerCase()
//             if ((event.ctrlKey || event.metaKey) && charCode ==='v') {
//                 console.log('CTRL V pressed')
//                 handlePaste()
//             }

//         }
//         window.addEventListener('keydown',handleKeyDown)

//         return () => window.removeEventListener('keydown',handleKeyDown)
//     },[])
//     */
   
// /**
//  * 
//  * onDragStart={(e) => {
//                 console.log('drag detected')

//                 //@ts-ignore
//                 dragUrl.current = e.target.src
//             }}
//  */


//     const handleDragStart = (e:DragEvent) => {
//         e.preventDefault()
//         console.log('dragstart')
//     }
//     const handleDragEnd = (e:DragEvent) => {
//         e.preventDefault()
//         console.log('dragend')
        
//     }
//     const handleDragOver = (e:DragEvent) => {
//         e.preventDefault()
//         console.log('dragover')
//     }
//     return (
//         <>
//         <img
//             alt='signature'
//             src='https://konvajs.org/assets/lion.png'
//             draggable={true}
//             />
//             <div
//             onDragEnd={handleDragEnd}
//             >
//             {/*@ts-ignore */}
//             <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef} style={{border: '1px solid grey'}} >
                
//             <Layer>

//                 {images.map((image) => {
//                     return <URLImage image={image}/>
//                 })}
//                 {/* 
//                 {imgLoaded && (
//                     <KonvaImage 
//                     x={50}
//                     y={50}
//                     image={img}
//                     width={img.width}
//                     height={img.height}
//                     draggable
//                     ref={recRef}
//                     />
//                 )}
                    

//                     <Transformer
//                     ref={trRef}
//                     rotateEnabled={false}
//                     boundBoxFunc={(oldBox, newBox) => {
//                         if (newBox.width > 200) {
//                             return oldBox

//                         }
//                             return newBox

//                     }
//                 }
                


//                     />
//                     */}
//             </Layer>

//             </Stage>
//             </div>
//         </>
//     );
//     };


// export default Canvas;
