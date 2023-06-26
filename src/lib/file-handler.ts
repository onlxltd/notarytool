import EventEmitter         from 'events'
import SubmissionRequest    from '../types/submission-request'
import { S3 }               from '@aws-sdk/client-s3'
import { Upload }           from '@aws-sdk/lib-storage'
import fs                   from 'fs/promises'

export default class FileHandler extends EventEmitter {

    #_filePath  : string
    #_request   : SubmissionRequest
    #_client    : S3

    constructor(filePath: string, request: SubmissionRequest) {
        super()
        this.#_filePath     = filePath
        this.#_request      = request
        this.#_client       = new S3({
            region: 'us-west-2',
            credentials: {
                accessKeyId     : request.data.attributes.awsAccessKeyId,
                secretAccessKey : request.data.attributes.awsSecretAccessKey,
                sessionToken    : request.data.attributes.awsSessionToken
            },
            useAccelerateEndpoint: true
        })
    }

    public async upload() {
        let { data: { attributes: { bucket, object } } } = this.#_request
        let Body: Buffer = await fs.readFile(this.#_filePath)
        const uploads = new Upload({
            client: this.#_client,
            queueSize: 4,
            leavePartsOnError: false,
            params: { Bucket: bucket, Key: object, Body }
        })
        uploads.on('httpUploadProgress', ({ loaded, total }) => this.emit('progress', loaded / total))
        await uploads.done()
    }

}