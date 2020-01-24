import { PdfExport } from "./pdf/pdf"
import { data } from './data/sample'
const express = require('express')
const app = express()
const port = 3000

const fileExport = new PdfExport(data);

app.get('/', (req, res) => {
  fileExport.createHtml()
    .then((htmlString) => {
      res.send(htmlString);
    })
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
