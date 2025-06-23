function resolveBasePath(path: string): string {
  return `${import.meta.env.BASE_URL}/${path}`;
}

export { resolveBasePath };
