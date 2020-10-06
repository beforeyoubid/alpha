class RequestError extends Error {
  constructor (message, config, request, response) {
    super(message);
    this.config = config;
    this.request = request;
    this.response = response;
  }
}

export default RequestError;
