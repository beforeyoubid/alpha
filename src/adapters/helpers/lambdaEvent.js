import urlParse from 'url-parse';
import querystring from 'querystring';

export default (config, relativeUrl) => {
  const parts = urlParse(relativeUrl || config.url, null, querystringWithArraySupport);
  const params = Object.assign({}, parts.query, config.params);

  const event = {
    body: config.data || '',
    headers: config.headers,
    httpMethod: config.method.toUpperCase(),
    path: parts.pathname,
    queryStringParameters: params
  };

  if (Buffer.isBuffer(event.body)) {
    event.body = event.body.toString('base64');
    event.isBase64Encoded = true;
  }

  if (config.addRequestContext) {
    event.requestContext = {
      stage: process.env.STAGE,
      identity: {
        sourceIp: ''
      },
      authorizer: {
        principalId: ''
      },
      elb: false
    };
  }

  return event;
};

/**
 * This mirrors the simple querystringify parser, except it creates an array of duplicate keys
 * instead of only using the first key and discarding all subsequent ones, which is how url.parse functioned until urlParse replaced it.
 * Need to support that array for receiving services to continue functioning correctly (such as multiple _tag keys for FHIR object queries)
 */
function querystringWithArraySupport (query) {
  if (query.startsWith('?')) {
    query = query.substring(1);
  }
  return querystring.parse(query);
}
