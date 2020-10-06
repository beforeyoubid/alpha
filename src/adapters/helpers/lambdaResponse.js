import http from 'http';
import RequestError from './RequestError';

export default (config, request, payload) => {
  const response = {
    config,
    data: payload.body,
    headers: payload.headers,
    request,
    status: payload.statusCode,
    statusText: http.STATUS_CODES[payload.statusCode]
  };

  if (typeof config.validateStatus === 'function' && !config.validateStatus(response.status)) {
    throw new RequestError(`Request failed with status code ${response.status}`, config, request, response);
  }

  return response;
};
