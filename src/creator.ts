import * as fs from 'fs';
import { PdfExport } from './pdf/pdf'
import { PptxExport } from './exports/pptx'
import { XlsxExport } from './exports/xlsx'
import { RequestData } from './data/requestData';
import { data } from './data/sample'

const getDocumentClassFromFiletype = (fileType: string) => {
  switch(fileType) {
    case 'pdf':
      return PdfExport;
    case 'pptx':
      return PptxExport;
    case 'xlsx':
      return XlsxExport;
  }
  throw new Error(`no export class for ${fileType}`)
}

export async function create(fileType: string, data: RequestData) {
  const exportClass = getDocumentClassFromFiletype(fileType);
  const fileExport = new exportClass(data);
  const fileBuffer = await fileExport.createFile();

  return new Promise((resolve, reject) => {
    fs.writeFile(`file.${fileType}`, fileBuffer, function(err) {
      if(err) {
          console.log(err);
          reject('error writing file')
      }
      console.log("The file was saved!");
      resolve(true)
    }); 
  })
}


const fileType = process.argv[2] || 'pdf';
create(fileType, data)
  .then((done) => { console.log( 'finished' ) });