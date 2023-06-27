import fs                   from 'fs/promises'
import path                 from 'path'
import { platform }         from 'os'
import { EventEmitter }     from 'events'
import Hash                 from './lib/hash'
import AppStore             from './lib/app-store'
import NotaryToolConfig     from './types/notary-tool-config'
import SubmissionRequest    from './types/submission-request'
import FileHandler          from './lib/file-handler'
import SubmissionStatus     from './types/submission-status'
import RangeFormatter       from './lib/range-formatter'
import Stapler              from './lib/stapler'
import NotaryToolStatus     from './types/notary-tool-status'

export declare interface NotaryTool {
    on(event: 'progress', handler: (progress: number) => void): this;
    on(event: 'status', handler: (status: NotaryToolStatus, message?: string) => void): this
}

export class NotaryTool extends EventEmitter {

    #_config        : NotaryToolConfig
    #_appStore      : AppStore

    #_check         : NodeJS.Timer
    #_isChecking    : boolean           = false
    #_lastProgress  : number

    /**
     * Initial using Apple API credentials
     * @param config 
     */
    constructor(config: NotaryToolConfig) {
        super()
        let { appleApiKey, appleApiKeyId, appleApiIssuerId } = config
        if(appleApiKey === undefined) throw new Error("Config value must be provided for 'appleApiKey'")
        if(appleApiKeyId === undefined) throw new Error("Config value must be provided for 'appleApiKeyId'")
        if(appleApiIssuerId === undefined) throw new Error("Config value must be provided for 'appleApiIssuerId'")

        this.#_config       = config
        this.#_appStore     = new AppStore(config)
    }

    /**
     * Provide the file path to notarize
     * @param filePath 
     */
    public async notarize(filePath: string) {
        this.#_lastProgress     = undefined
        this.#_isChecking       = false
        if(this.#_check !== undefined) clearInterval(this.#_check)

        this.progress(0)

        let file    : Buffer    = await fs.readFile(filePath)
        let sha256  : string    = Hash.sha256(file)
        let { name, ext }       = path.parse(filePath)
        let submissionName    : string    = `${name}${ext}`

        /**
         * Send notarize request to the App Store
         */
        let payload     : { submissionName: string, sha256: string } = { submissionName, sha256 }
        let request     = await this.#_appStore.post('/notary/v2/submissions', payload) as SubmissionRequest
        this.progress(0.1, NotaryToolStatus.BeginUpload)
        
        /**
         * Upload the file to App Store
         */
        await this.handleUpload(filePath, request)
        await this.checkStatus(request.data.id, filePath)
    }

    private async checkStatus(id: string, filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if(this.#_check !== undefined) clearInterval(this.#_check)
            this.#_check = setInterval(async () => {
                if(this.#_isChecking) return
                this.#_isChecking = true
                let { data: { attributes: { status } } } = await this.#_appStore.get(`/notary/v2/submissions/${id}`)
                switch(status as SubmissionStatus) {
                    case SubmissionStatus.ACCEPTED:
                        if(this.#_check !== undefined) clearInterval(this.#_check)
                        await this.handleStaple(filePath)
                        return resolve(id)
                    case SubmissionStatus.INVALID:
                        if(this.#_check !== undefined) clearInterval(this.#_check)
                        let { data: { attributes: { developerLogUrl } } } = await this.#_appStore.get(`/notary/v2/submissions/${id}/logs`)
                        let { statusSummary, issues } = await this.#_appStore.download(developerLogUrl)
                        this.progress(1, NotaryToolStatus.Invalid, issues)
                        return reject(new Error(statusSummary))
                    default:
                        this.progress(0.75, NotaryToolStatus.InProgress, 'This may take some time...')
                        // Continue to check
                        break
                }
                this.#_isChecking = false
            }, 10000)
        })
    }

    private async handleStaple(filePath: string) {
        if(this.#_config.ignoreStaple === true || platform() != 'darwin') return this.progress(1, NotaryToolStatus.Complete)
        let staple = new Stapler(filePath)
        staple.on('data', data => this.progress(0.9, data))
        await staple.run()
        this.progress(1, NotaryToolStatus.Complete)
    }

    private async handleUpload(filePath: string, receipt: SubmissionRequest) {
        let handler = new FileHandler(filePath, receipt)
        handler.on('progress', (val) => this.progress(RangeFormatter.calc(val)))
        await handler.upload()
        this.progress(0.7, NotaryToolStatus.Uploaded)
    }

    private progress(val: number, status: NotaryToolStatus | undefined = undefined, message: string | undefined = undefined) {
        if(this.#_lastProgress === undefined || val > this.#_lastProgress) {
            this.emit('progress', val)
            this.#_lastProgress = val
        }
        if(status !== undefined) this.emit('status', status, message)
    }

}

export { NotaryToolStatus, NotaryToolConfig }
export default NotaryTool