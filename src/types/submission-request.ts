export default interface SubmissionRequest {
    data: {
        type    : string,
        id      : string,
        attributes: {
            awsAccessKeyId      : string,
            awsSecretAccessKey  : string,
            awsSessionToken     : string,
            bucket              : string
            object              : string
        }
    }
}