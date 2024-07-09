const parseRawBodyAsBuffer = async function (req) {
  return new Promise((resolve, reject) => {
    let byteChunks = [];
    req.on('data', (chunk) => {
      byteChunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(byteChunks));
    });
    req.on('error', reject);
  });
};

module.exports = {
  parseRawBodyAsBuffer,
};
