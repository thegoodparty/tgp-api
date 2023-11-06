// const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const md5 = require('md5');
// const { BaseLoader } = require('@llmembed/embedjs/interfaces/base-loader');
// const { cleanString } = require('@llmembed/embedjs/global/utils.js');

// class CustomTextLoader extends BaseLoader {
//   constructor({ text }) {
//     super(md5(text));
//     this.text = text;
//   }

//   async getChunks() {
//     const chunker = new RecursiveCharacterTextSplitter({
//       chunkSize: 200,
//       chunkOverlap: 0,
//       keepSeparator: false,
//       separators: ['\n'],
//     });
//     const chunks = await chunker.splitText(cleanString(this.text));

//     return chunks.map((chunk, index) => {
//       return {
//         pageContent: chunk,
//         metadata: {
//           type: 'TEXT',
//           textId: this.uniqueId,
//           id: md5(chunk),
//           chunkId: index,
//         },
//       };
//     });
//   }
// }
