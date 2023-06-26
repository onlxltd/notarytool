import fs                   from 'fs/promises'
import path                 from 'path'
import jwt, { JwtPayload }                  from 'jsonwebtoken'
import NotaryToolConfig     from '../types/notary-tool-config'

export default class Token {

    #_config    : NotaryToolConfig
    #_token     : string

    constructor(config: NotaryToolConfig) {
        this.#_config = config
    }

    static async init(config: NotaryToolConfig) {
        let instance = new Token(config)
        await instance.generate()
        return instance
    }

    public async generate(): Promise<string> {
        let token       = await this.sign({}, {
            algorithm   : 'ES256',
            keyid       : this.#_config.appleApiKeyId,
            expiresIn   : 60 * 10,
            audience    : 'appstoreconnect-v1',
            issuer      : this.#_config.appleApiIssuerId
        }) as string
        this.#_token = token
        return token
    }

    public async recall() {
        let decoded     : JwtPayload    = jwt.decode(this.#_token) as JwtPayload
        let isExpired   : boolean       = Token.now() > decoded.exp
        if(isExpired) await this.generate()
        return this.#_token
    }

    private async sign(payload: { [key: string ]: any}, options: jwt.SignOptions = {}) {
        let priv = await fs.readFile(this.#_config.appleApiKey)
        return new Promise(async (resolve, reject) => {
            jwt.sign(payload, priv, options, (err, encoded) => {
                if(err) reject(err)
                resolve(encoded)
            })
        })
    }

    static now(): number {
        return Math.round(Date.now() / 1000)
    }

}