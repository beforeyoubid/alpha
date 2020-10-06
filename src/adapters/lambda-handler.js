import chainAdapters from './helpers/chainAdapters';
import isAbsoluteURL from './helpers/isAbsoluteURL';
import lambdaEvent from './helpers/lambdaEvent';
import lambdaResponse from './helpers/lambdaResponse';
import promisify from './helpers/promisify';
import RequestError from './helpers/RequestError';

async function lambdaHandlerAdapter (config) {
  const request = {
    context: {},
    event: lambdaEvent(config)
  };

  const handler = promisify(config.lambda);
  let result = null;

  try {
    result = await handler(request.event, request.context);
  } catch (error) {
    throw new RequestError(error.message, config, request);
  }

  return lambdaResponse(config, request, result);
}

function lamdaHandlerRequestInterceptor (config) {
  return chainAdapters(
    config,
    (config) => (!isAbsoluteURL(config.url) && config.lambda),
    lambdaHandlerAdapter
  );
}

export default (client) => {
  client.interceptors.request.use(lamdaHandlerRequestInterceptor);
};
