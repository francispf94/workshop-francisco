const _ = require('lodash')
const aws4 = require('aws4')
const URL = require('url')
const http = require('superagent-promise')(require('superagent'), Promise)
const mode = process.env.TEST_MODE
const APP_ROOT = '../../'

const viaHandler = async (event, functionName) => {
  const handler = require(`${APP_ROOT}/functions/${functionName}`).handler

  const context = {}
  const response = await handler(event, context)
  const contentType = _.get(response, 'headers.content-type', 'application/json');
  if (response.body && contentType === 'application/json') {
    response.body = JSON.parse(response.body);
  }
  return response
}

const respondFrom = async (httpRes) => {
  const contentType = _.get(httpRes, 'headers.content-type', 'application/json')
  const body =
    contentType === 'application/json'
      ? httpRes.body
      : httpRes.text

  return {
    statusCode: httpRes.status,
    body: body,
    headers: httpRes.headers
  }
}

const signHttpRequest = (url, httpReq) => {
  const urlData = URL.parse(url)
  const opts = {
    host: urlData.hostname,
    path: urlData.pathname
  }

  aws4.sign(opts)

  httpReq
    .set('Host', opts.headers['Host'])
    .set('X-Amz-Date', opts.headers['X-Amz-Date'])
    .set('Authorization', opts.headers['Authorization'])

  if (opts.headers['X-Amz-Security-Token']) {
    httpReq.set('X-Amz-Security-Token', opts.headers['X-Amz-Security-Token'])
  }
}

const viaHttp = async (relPath, method, opts) => {
  const root = process.env.TEST_ROOT
  const url = `${root}/${relPath}`
  console.log(`invoking via HTTP ${method} ${url}`)

  try {
    const httpReq = http(method, url)

    const body = _.get(opts, "body")
    if (body) {
      httpReq.send(body)
    }

    if (_.get(opts, "iam_auth", false) === true) {
      signHttpRequest(url, httpReq)
    }

    const authHeader = _.get(opts, "auth")
    if (authHeader) {
      httpReq.set('Authorization', authHeader)
    }

    const res = await httpReq
    return respondFrom(res)
  } catch (err) {
    if (err.status) {
      return {
        statusCode: err.status,
        headers: err.response.headers
      }
    } else {
      throw err
    }
  }
}

const we_invoke_get_index = async () => {
  const res =
    mode === 'handler'
      ? await viaHandler({}, 'get-index')
      : await viaHttp('', 'GET')

  return res
}

module.exports = {
  we_invoke_get_index
}
