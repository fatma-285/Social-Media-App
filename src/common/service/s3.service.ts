import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config/config.service.js";
import { Store_Enum } from "../enum/multer.enum.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs"
import { appError } from "../utils/global-error-handler.js";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {

    private client: S3Client

    constructor() {
        this.client = new S3Client({
            region: AWS_REGION!,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY!,
                secretAccessKey: AWS_SECRET_ACCESS_KEY!
            }
        })
    }

    async uploadFile({
        file,
        store_type = Store_Enum.memory,
        path = "General",
        ACL = ObjectCannedACL.private
    }: {
        file: Express.Multer.File,
        store_type?: Store_Enum,
        path?: string,
        ACL?: ObjectCannedACL
    }): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
            Body: store_type === Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
            ACL,
            ContentType: file.mimetype
        })
        if (!command.input.Key) {
            throw new appError("fail to upload file", 400)
        }
        await this.client.send(command)
        return command.input.Key
    }

    async uploadLargeFile({
        file,
        store_type = Store_Enum.disk,
        path = "General",
        ACL = ObjectCannedACL.private
    }: {
        file: Express.Multer.File,
        store_type?: Store_Enum,
        path?: string,
        ACL?: ObjectCannedACL
    }): Promise<string> {

        const command = new Upload({
            client: this.client,
            params: {
                Bucket: AWS_BUCKET_NAME,
                Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
                Body: store_type === Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
                ACL,
                ContentType: file.mimetype
            }
        })

        const result = await command.done();

        if (!result.Key) {
            throw new appError("fail to upload file", 400)
        }

        command.on("httpUploadProgress", (progress) => {
            console.log(`Uploaded ${progress.loaded} bytes of ${progress.total} bytes.`)
        })

        return result.Key as string
    }

    async uploadFiles({
        files,
        store_type = Store_Enum.memory,
        path = "General",
        ACL = ObjectCannedACL.private,
        isLarge = false
    }: {
        files: Express.Multer.File[],
        store_type?: Store_Enum,
        path?: string,
        ACL?: ObjectCannedACL,
        isLarge?: boolean
    }) {
        let urls: string[] = []
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, store_type, path, ACL })
            }))
        } else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, store_type, path, ACL })
            }))
        }
        return urls
    }

    async createPresignedUrl({
        path,
        fileName,
        ContentType,
        expiresIn = 60
    }: {
        path: string,
        fileName: string,
        ContentType: string,
        expiresIn?: number
    }) {
        const Key = `social_media_app/${path}/${randomUUID()}__${fileName}`
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key,
            ContentType
        })
        const url = await getSignedUrl(this.client, command, { expiresIn });
        return { url, Key }
    }

    async getFile(Key: string) {
        const command = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key
        })
        return await this.client.send(command)
    }

    async getPreSignedUrl({
        Key,
        expiresIn = 60,
        download
    }: {
        Key: string,
        expiresIn?: number
        download?: string|undefined
    }) {
        const command = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key,
            ResponseContentDisposition:download? `attachment; filename="${Key.split("/").pop()}"`:undefined
        })
        const url = await getSignedUrl(this.client, command, { expiresIn })
        return url
    }

    async getFiles(folderName: string) {
        const command = new ListObjectsV2Command({
            Bucket: AWS_BUCKET_NAME,
            Prefix: `social_media_app/${folderName}`
        })
        return await this.client.send(command)
    }

     async deleteFile(Key: string) {
        const command = new DeleteObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key
        })
        return await this.client.send(command)
    }

     async deleteFiles(Keys: string[]) {
        const keysMapped=Keys.map(key=>({Key:key}))
        const command = new DeleteObjectsCommand({
            Bucket: AWS_BUCKET_NAME,
            Delete: {
                Objects: keysMapped
            }
        })
        return await this.client.send(command)
    }

    async deleteFolder(folderName:string){
        const data=await this.getFiles(folderName)
        const keys=data.Contents?.map(content=>content.Key)

        return await this.deleteFiles(keys as string[])

    }
}