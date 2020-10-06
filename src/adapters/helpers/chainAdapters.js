import axios from 'axios';

export default (config, predicate, adapter) => {
  const nextAdapter = config.adapter || axios.defaults.adapter;

  config.adapter = async (config) => {
    if (predicate(config)) {
      return adapter(config);
    }
    return nextAdapter(config);
  };

  return config;
};
