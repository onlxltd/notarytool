import { createHash }   from 'crypto'

export default class Hash {

    static sha256(buffer: Buffer): string {
        return createHash('sha256').update(buffer).digest('hex')
    }

}