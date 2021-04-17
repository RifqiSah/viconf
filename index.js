const express = require('express');
const ffmpeg = require("fluent-ffmpeg");
const { urlencoded, json } = require("body-parser");
const { writeFileSync, unlinkSync, readFileSync } = require("fs");
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 3000;

const tmp = "tmp/";

// parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: false }));

// parse application/json
app.use(json({ limit: '5mb' }));

//support parsing of application/x-www-form-urlencoded post data
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ffmpeg.setFfmpegPath("E:/Program Files/ffmpeg/bin/ffmpeg.exe");
// ffmpeg.setFfprobePath("E:/Program Files/ffmpeg/bin");
// ffmpeg.setFlvtoolPath("E:/Program Files/flvtool");

console.log(ffmpeg);

app.get("/", (req,res) => {
    res.send("Hello world");
})

app.post("/convert", async (req, res) => {
    //res.contentType(`video/${to}`);
    //res.attachment(`output.${to}`

    try {
        const mime = /data:(.*);base64/.exec(req.body.header)[1];
        const base64source = req.body.buffer;
        const ext = mime.split("/")[1];

        const source = tmp + Math.random().toString(36).substring(7) + "." + ext;
        const target = tmp + Math.random().toString(36).substring(7) + "." + req.body.to;

        // write source file
        console.log("Writing temporary file.");
        writeFileSync(source, Buffer.from(base64source, "base64"));

        // convert
        console.log("Converting, please wait ...");

        await new Promise((resolve, reject) => {
            ffmpeg(source)
                .withOutputFormat(req.body.to)
                .on("progress", (progress) => {
                    console.info(`[ffmpeg] ${JSON.stringify(progress)}`);
                })
                .on("error", (err) => {
                    console.info(`[ffmpeg] Error: ${err.message}`);
                    reject(err);
                })
                .on("end", () => {
                    console.info("[ffmpeg] Finished");
                    resolve();
                })
                .saveToFile(target);
        });

        // read target file
        const buffer = readFileSync(target, { encoding: "base64" });

        // delete files
        unlinkSync(source);
        unlinkSync(target);

        res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.send(null);
    }
});

app.listen(PORT, () =>{
    console.log(`App is listening on PORT ${PORT}`);
});