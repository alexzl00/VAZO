const camelToKebabCase = (str: string) =>
  str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

export default camelToKebabCase;