let initialized = false

const init = async () => {
  if (initialized) {
    return
  }

  process.env.restaurants_api   = "https://2rxkvcjngi.execute-api.eu-west-1.amazonaws.com/dev/restaurants"
  process.env.restaurants_table = "restaurants-dev-francisco"
  process.env.AWS_REGION        = "eu-west-1"
  process.env.TEST_ROOT = "https://2rxkvcjngi.execute-api.eu-west-1.amazonaws.com/dev"
  
  initialized = true
}

module.exports = {
  init
}
