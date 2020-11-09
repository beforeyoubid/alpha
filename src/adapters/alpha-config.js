export default (client) => {
  if (client.interceptors && client.interceptors.request) {
    client.interceptors.request.use(config => {
      const alphaConfig = config.adapter;
      delete config.adapter;
      Object.assign(config, alphaConfig);
      return config;
    });
  }
};
