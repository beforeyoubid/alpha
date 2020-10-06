const WITH_SCHEME = /^[a-z][a-z\d+\-.]*:\/\//i;

export default (url) => {
  return WITH_SCHEME.test(url) || url.startsWith('//');
};
