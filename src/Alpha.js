import adapters from './adapters';
import cloneDeep from 'lodash/cloneDeep';
import isAbsoluteURL from './adapters/helpers/isAbsoluteURL';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import parseLambdaUrl from './adapters/helpers/parseLambdaUrl';
import pick from 'lodash/pick';
import RequestError from './adapters/helpers/RequestError';
import resolvePathname from 'resolve-pathname';
import axios from 'axios';
import { URL } from 'url';

const ALPHA_CONFIG = [ 'adapter', 'lambda', 'Lambda', 'retry', 'addRequestContext', '__retryCount' ];

const { Axios } = axios;
class Alpha extends Axios {
  static dockerLambda (options, clientOptions) {
    const dockerLambda = require('docker-lambda');

    options = Object.assign(
      {
        taskDir: false
      },
      options
    );

    delete options.event;

    function handler (event, context, callback) {
      const requestOptions = Object.assign({ event }, options);
      callback(null, dockerLambda(requestOptions));
    }

    return new Alpha(handler, clientOptions);
  }

  // whatwg-url does not accept non-numeric port values. Alpha uses the port
  // value as the lambda qualifier. However, URL resolution can have tricky
  // edge cases. We remove the lambda qualifier to allow whatwg-url to handle
  // the URL resolution nuances and then reinsert the lambda qualifier (if
  // present).
  static resolve (url, base) {
    if (isAbsoluteURL(url)) {
      return url;
    }

    let lambdaParts = parseLambdaUrl(base);

    if (!lambdaParts) {
      // This preserves the behavior we had under `url.resolve()` when
      // providing a path-only base
      if (base.startsWith('/')) return resolvePathname(url, base);

      return new URL(url, base).toString();
    }

    const qualifier = lambdaParts.qualifier ? `:${lambdaParts.qualifier}` : '';
    const sanitizedBase = `lambda://${lambdaParts.name}:0${lambdaParts.path}`;
    const resolved = new URL(url, sanitizedBase).toString();

    lambdaParts = parseLambdaUrl(resolved);
    return `lambda://${lambdaParts.name}${qualifier}${lambdaParts.path}`;
  }

  constructor (target, options) {
    options = options ? cloneDeep(options) : {};

    if (typeof target === 'function') {
      options.lambda = target;
    } else if (isString(target)) {
      options.baseURL = target;
    } else if (target) {
      options = cloneDeep(target);
      target = null;
    }

    // Override the default validateStatus to allow redirects to process
    if (!options.validateStatus) {
      options.validateStatus = (status) => (status >= 200 && status < 300) ||
        status === 301 ||
        status === 302;
    }

    options = merge({}, axios.defaults, options);
    super(options);
    adapters.forEach((adapter) => adapter(this));
  }

  async request (config) {
    const maxRedirects = 'maxRedirects' in config ? config.maxRedirects : 5;
    // Need to override the default redirect logic to allow different adapters
    // to interact.
    const requestConfig = this._buildConfig(config);
    requestConfig.maxRedirects = 0;

    // Babel does not correctly handle the super keyword in async methods
    const response = await Axios.prototype.request.call(this, requestConfig);

    if (response.status === 301 || response.status === 302) {
      if (maxRedirects === 0) {
        throw new RequestError('Exceeded maximum number of redirects.', response.config, response.request, response);
      }

      const redirect = cloneDeep(config);
      redirect.maxRedirects = maxRedirects - 1;
      redirect.url = this.constructor.resolve(response.headers['location'], response.config.url);
      return this.request(redirect);
    }

    return response;
  }

  _buildConfig (config) {
    config = cloneDeep(config);
    config.adapter = {
      ...pick(this.defaults, ALPHA_CONFIG),
      ...pick(config, ALPHA_CONFIG)
    };
    return config;
  }
}

export default Alpha;
