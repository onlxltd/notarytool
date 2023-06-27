import { config }   from 'dotenv'
import NotaryTool   from '../src/notarytool'

// Call .env setup
config()

const main = async () => {

    const tool = new NotaryTool({
        appleApiKey         : process.env.APPLE_API_KEY,
        appleApiKeyId       : process.env.APPLE_API_KEY_ID,
        appleApiIssuerId    : process.env.APPLE_API_ISSUER_ID
    })

    tool.on('progress', val => console.log('progress:', val))
    tool.on('status', (status, message) => console.log('status:', message))

    await tool.notarize(process.env.FILE_PATH)

}
main()