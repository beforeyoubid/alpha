import nearley from 'nearley';
import grammar from './lambdaURLGrammar';

export default (url) => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(url);
    const parts = parser.results;
    return parts[0];
  } catch (error) {
    return null;
  }
};
