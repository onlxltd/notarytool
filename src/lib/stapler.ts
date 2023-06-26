import { exec }             from 'child_process'
import { EventEmitter }     from 'events'

export default class Stapler extends EventEmitter {

    #_target    : string

    constructor(filePath: string) {
        super()
        this.#_target = filePath
    }

    public async staple() {
        return await this.cmd('xcrun stapler staple ' + this.#_target)
    }

    public async verify() {
        return await this.cmd('spctl --assess -vv --type install ' + this.#_target)
    }

    private async cmd(runPath: string) {
        return new Promise<void>((resolve, reject) => {
            let handler = exec(runPath, { windowsHide: true })
            handler.stdout.on('data', (data) => this.emit('data', data.toString().split('\n').join('')))
            handler.stderr.on('data', (error) => this.emit('data', error.toString()))
            handler.on('close', () => resolve())
        })
    }

    static async run(filePath: string) {
        let instance = new Stapler(filePath)
        await instance.staple()
        await instance.verify()
        return instance
    }

    public async run() {
        await this.staple()
        await this.verify()
    }

}