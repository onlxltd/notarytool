# NotaryTool

[![build](https://github.com/onlxltd/notarytool/actions/workflows/build-release.yml/badge.svg?style=flat-square)](https://github.com/onlxltd/notarytool/actions/workflows/build-release.yml) ![npm bundle size](https://img.shields.io/bundlephobia/min/notarytool?style=flat-square) [![DeepScan grade](https://deepscan.io/api/teams/13435/projects/24967/branches/773213/badge/grade.svg?style=flat-square)](https://deepscan.io/dashboard#view=project&tid=13435&pid=24967&bid=773213)

NotaryTool is a TypeScript implimentation of Apple's notarization process.
The tool can be used on any platform and on macOS will attempt to staple on completion.

## Support
NotaryTool is supported by [ON LX Limited](https://onlx.ltd/?src=notarytool). Check out our projects such as [Ctrl Suite](https://onlx.ltd/ctrl-suite?src=notarytool) and [bonjour-service](https://npmjs.com/package/bonjour-service).

## Installation
Add to your project dependencies using Yarn or NPM.

#### Install with Yarn
```
yarn add notarytool
```
#### Install with NPM
```
npm install notarytool
```


## Usage 

```js
import NotaryTool from 'notarytool'

/**
 *  Setup the tool using API credentials 
 */
const tool = new NotaryTool({
    appleApiKey         : process.env.APPLE_API_KEY,
    appleApiKeyId       : process.env.APPLE_API_KEY_ID,
    appleApiIssuerId    : process.env.APPLE_API_ISSUER_ID
})

/**
 * Monitor the current status of the tool
 */
tool.on('progress', val => console.log('progress:', val))
tool.on('status', (status, message) => console.log('status:', status, message))

/**
 * Call notarize with the file path
 */
try {
    await tool.notarize(process.env.FILE_PATH)
    console.log('Success')
} catch(error) {
    console.log('Failed', error)
}
```

## API

### Initializing

```js
const tool = new NotaryTool(options: NotaryToolConfig)
```

Creates an new tool instance that can handle notarizing multiple times

Options are:

- @string `appleApiKey` The file path to the AuthKey_{id}.p8 file from the App Store
- @string `appleApiKeyId` The {id} of the AuthKey file
- @string `appleApiIssuerId` The issuer ID provided by the App Store
- @boolean? `ignoreStaple` If enabled on macOS, staple stage will be skipped

### Methods

#### `await tool.notarize(filePath: string)`

Begins the file notarization process. Function returns a void on success and throws errors

### Events

#### `tool.on('progress', (val: number) => console.log(val))`

Provides progress of process from 0.0 to 1.0. Value will hang around 0.75 whilst response from App Store is provided.

#### `tool.on('status', (status: NotaryToolStatus, message: string | undefined) => console.log(status, message))`

Provides a status value and optional readable message where applicable.


### Enums

#### NotaryToolStatus

```js
enum NotaryToolStatus {
    BeginUpload     = 'begin_upload',
    Uploaded        = 'uploaded',
    Invalid         = 'invalid',
    InProgress      = 'in_progress',
    Complete        = 'complete'
}
```
