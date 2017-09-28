const fs = require('fs');
const request = require('request');
const abaculus = require('@mapbox/abaculus');
const mapnik = require('mapnik');
import { S3 } from 'aws-sdk';

/* 
WORK IN PROGRESS  
- Currently uses mapnik to render .png file
- Need to figure out getting binaries (Cairo) on Lambda
*/
function getTiles(z, x, y, callback) {
    return request({
            url: `https://s3.amazonaws.com/eviction-lab-data/evictions-cities-research/${z}/${x}/${y}.pbf`,
            method: 'GET',
            encoding: null
        },
        function(error, response, body) {
            // console.log(typeof body);
            const vt = new mapnik.VectorTile(z, x, y);
            vt.addDataSync(body);
            const tileSize = vt.tileSize;
            const map = new mapnik.Map(tileSize, tileSize);
            map.loadSync('assets/style.xml');
            return vt.render(map, new mapnik.Image(256, 256), function (err, image) {
                if (err) throw err;
                return image.encode('png', function(err, buffer) {
                    // console.log(typeof buffer);
                    return callback(null, buffer, { 'Content-Type': 'image/png' });
                });
            });
        });
}

const params = {
    zoom: 10,
    scale: 1,
    bbox: [-76.165466, 40.653295, -75.687561, 40.950085],
    getTile: getTiles
};

function main() {
    abaculus(params, function (err, image, headers) {
        if (err) {
            console.log(err);
            return err;
        }
        fs.writeFileSync('test.png', image);
    });
}

// main();

export async function fileHandler(event, context, callback): Promise<void> {
    const s3 = new S3();

    await abaculus(params, function (err, image, headers) {
        if (err) {
            console.log(err);
            return err;
        }
        fs.writeFileSync('test.png', image);
    });

    await s3.putObject({
        Bucket: process.env['export_bucket'],
        Key: 'test.png',
        Body: fs.readFileSync('test.png'),
        ACL: 'public-read'
    }).promise();

    callback(null, {
        statusCode: 200,
        body: JSON.stringify({
            message: '.png'
        })
    });
}