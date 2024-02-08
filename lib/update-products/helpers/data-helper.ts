import * as xlsx from 'xlsx';
import Product from '../../common/types/Product';

export const streamToBuffer = async (stream: any): Promise<Buffer> => {
  console.log('Reading stream...');
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export const retrieveDataFromWorkbook = (buffer: Buffer): Product[] => {
  console.log('Retrieving data from excel sheet...');
  const workBook = xlsx.read(buffer, {
    type: 'buffer'
  });
  const sheet = workBook.SheetNames[0];
  const workSheet = workBook.Sheets[sheet];
  const rows: Product[] = xlsx.utils.sheet_to_json(workSheet);

  return rows;
}
