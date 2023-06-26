import https                from 'https'
import Token                from './token'
import NotaryToolConfig     from '../types/notary-tool-config'

type KeyValue = { [key: string]: any }

export default class AppStore {

    #_config    : NotaryToolConfig
    #_token     : any
    #_endpoint  : string            = 'appstoreconnect.apple.com'

    constructor(config: NotaryToolConfig) {
        this.#_config = config
    }

    private async request(method: 'GET' | 'POST', endpoint: string, data: KeyValue = undefined) {
        if(this.#_token === undefined) this.#_token = await Token.init(this.#_config)
        let token = await this.#_token.recall()

        return new Promise((resolve, reject) => {
            const req = https.request({
                method,
                path        : endpoint,
                hostname    : this.#_endpoint,
                headers     : {
                    'content-type'  : 'application/json',
                    'authorization' : 'Bearer ' + token,
                }
            }, (res) => {
                let chunks: Buffer[] = []
                res.on('data', chunk => chunks.push(chunk))
                res.on('end', () => {
                    let data = Buffer.concat(chunks)
                    try {
                        resolve(JSON.parse(data.toString()))
                    } catch(_) {
                        resolve(data.toString())
                    }
                })
                res.on('error', (error) => reject(error))
            })
            if(data !== undefined) {
                let payload = JSON.stringify(data)
                req.write(payload)
            }
            req.end()
        })
    }

    public async post(endpoint: string, data: { [key: string]: any }): Promise<KeyValue> {
        return await this.request('POST', endpoint, data)
    }

    public async get(endpoint: string): Promise<KeyValue> {
        return await this.request('GET', endpoint)
    }

    public async download(url: string): Promise<KeyValue> {
        return new Promise((resolve, reject) => {
            let { hostname, pathname, search } = new URL(url)
            https.get({ 
                path        : `${pathname}${search}`,
                hostname,
                headers: {
                    'accept'            : '*/*',
                    'connection'        : 'keep-alive'
                }
            }, res => {
                let chunks: Buffer[] = []
                res.on('data', chunk => chunks.push(chunk))
                res.on('end', () => {
                    let data = Buffer.concat(chunks)
                    resolve(JSON.parse(data.toString()))
                })
                res.on('error', (error) => reject(error))
            })
        })
    }

}