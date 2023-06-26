
/**
 * A simple class for scaling ranges
 */
export default class RangeFormatter {

    static min : number = 0.1
    static max : number = 0.7

    static calc(value: number) {
        let a   : number    = this.min * -1
        let b   : number    = this.max + a
        return (value * b) + this.min
    }
}