import lambdaEvent from '../src/adapters/helpers/lambdaEvent';
import test from 'ava';

const duplicateParams = '/lifeomic/dstu3/Questionnaire?pageSize=25&_tag=http%3A%2F%2Flifeomic.com%2Ffhir%2Fquestionnaire-type%7Csurvey-form&_tag=http%3A%2F%2Flifeomic.com%2Ffhir%2Fdataset%7C0bb18fef-4e2d-4b91-a623-09527265a8b3&_tag=http%3A%2F%2Flifeomic.com%2Ffhir%2Fprimary%7C0343bfcf-4e2d-4b91-a623-095272783bf3';
const params = '/lifeomic/dstu3/Questionnaire?pageSize=25&_tag=http%3A%2F%2Flifeomic.com%2Ffhir%2Fquestionnaire-type%7Csurvey-form&test=diffValue';
const invalidValueParam = '/lifeomic/dstu3/Questionnaire?pageSize=25&=onlyvalue';
const invalidKeyParam = '/lifeomic/dstu3/Questionnaire?pageSize=25&onlyKey=';

const lambda = `lambda://service:deployed/`;
const config = {
  method: 'get',
  headers: {},
  url: ''
};

test.serial(`Can parse URLs with duplicate parameters`, async (test) => {
  config.url = lambda + duplicateParams;
  test.deepEqual(lambdaEvent(config, duplicateParams), {
    body: '',
    headers: {},
    httpMethod: 'GET',
    path: '/lifeomic/dstu3/Questionnaire',
    queryStringParameters: {
      _tag: [
        'http://lifeomic.com/fhir/questionnaire-type|survey-form',
        'http://lifeomic.com/fhir/dataset|0bb18fef-4e2d-4b91-a623-09527265a8b3',
        'http://lifeomic.com/fhir/primary|0343bfcf-4e2d-4b91-a623-095272783bf3'
      ],
      pageSize: '25'
    }
  });
});

test.serial(`Can parse URLs without duplicates`, async (test) => {
  config.url = lambda + params;
  test.deepEqual(lambdaEvent(config, params), {
    body: '',
    headers: {},
    httpMethod: 'GET',
    path: '/lifeomic/dstu3/Questionnaire',
    queryStringParameters: {
      _tag: 'http://lifeomic.com/fhir/questionnaire-type|survey-form',
      pageSize: '25',
      test: 'diffValue'
    }
  });
});

test.serial(`handles null values`, test => {
  config.url = lambda + invalidKeyParam;
  test.deepEqual(lambdaEvent(config, invalidKeyParam), {
    body: '',
    headers: {},
    httpMethod: 'GET',
    path: '/lifeomic/dstu3/Questionnaire',
    queryStringParameters: {
      pageSize: '25',
      onlyKey: ''
    }
  });
});

test.serial(`handles null keys`, test => {
  config.url = lambda + invalidValueParam;
  test.deepEqual(lambdaEvent(config, invalidValueParam), {
    body: '',
    headers: {},
    httpMethod: 'GET',
    path: '/lifeomic/dstu3/Questionnaire',
    queryStringParameters: {
      pageSize: '25',
      '': 'onlyvalue'
    }
  });
});

test.serial(`Can include request context`, async (test) => {
  process.env['STAGE'] = 'test';
  config.url = lambda + params;
  const mergedConfig = {
    ...config,
    addRequestContext: true
  };
  test.deepEqual(lambdaEvent(mergedConfig, params), {
    body: '',
    headers: {},
    httpMethod: 'GET',
    path: '/lifeomic/dstu3/Questionnaire',
    queryStringParameters: {
      _tag: 'http://lifeomic.com/fhir/questionnaire-type|survey-form',
      pageSize: '25',
      test: 'diffValue'
    },
    requestContext: {
      stage: 'test',
      identity: {
        sourceIp: ''
      },
      authorizer: {
        principalId: ''
      },
      elb: false
    }
  });
});
