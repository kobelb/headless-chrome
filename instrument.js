export async function instrument(description, promise) {
  const start = new Date();
  const result = await promise;
  console.log(`${description} took ${new Date() - start} ticks`);
  return result;
};