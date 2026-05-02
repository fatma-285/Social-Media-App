import multer from "multer"
import { multer_enum, Store_Enum } from "../enum/multer.enum.js";
import { tmpdir } from "node:os";
import type { Request } from "express";

const multer_cloud=({
    store_type=Store_Enum.memory,
    custom_types=multer_enum.image,
    maxFileSize=5*1024*1024
}:{
    store_type?:Store_Enum,
    custom_types?:string[],
    maxFileSize?:number
}={})=>{
    const storage=store_type===Store_Enum.memory?multer.memoryStorage():multer.diskStorage({
        destination:tmpdir(),
        filename:function(req:Request,file:Express.Multer.File,cb:Function){
            const prefix=Date.now()+"-"+Math.round(Math.random()*1e9);
            cb(null,prefix+"-"+ file.originalname);
        }
    })
    const fileFilter=(req:Request,file:Express.Multer.File,cb:Function)=>{
        if(!custom_types.includes(file.mimetype)){
           cb(new Error("invalid file type"),false);
        }
        cb(null,true); 
    }
    const upload=multer({storage,fileFilter,limits:{fileSize:maxFileSize}});
    return upload;
}

export default multer_cloud