import { chromium } from "playwright";
import ffmpeg from "fluent-ffmpeg";
import { Command } from "commander";

async function fetchM3U8Url(pageUrl: string): Promise<string | null> {
    let m3u8Url: string | null = null;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on("response", (response) => {
        if (response.url().includes("playlist.m3u8")) {
            m3u8Url = response.url();
        }
    });

    await page.goto(pageUrl);
    await page.waitForSelector("video", { timeout: 10000 });
    await page.waitForTimeout(5000);

    await browser.close();

    return m3u8Url;
}

function downloadM3U8Video(m3u8Url: string, outputFile: string): void {
    ffmpeg(m3u8Url)
        .inputOptions(["-protocol_whitelist", "file,http,https,tcp,tls,crypto"])
        .output(outputFile)
        .on("end", () => {
            console.log(`Video downloaded successfully: ${outputFile}`);
        })
        .on("error", (err) => {
            const errorMessage = err.message || "Unknown error occurred.";
            console.error(`Error occurred: ${errorMessage}`);
        })
        .run();
}

const program = new Command();

program
    .name("BlueSky Video Downloader")
    .description("A script to download videos from bsky")
    .version("1.0.0")
    .requiredOption("-u --url <url>", "Video URL")
    .option(
        "-o, --output <file>",
        "Output file name for the downloaded video",
        "output.mp4",
    );

program.parse();

const options = program.opts();

const m3u8Url = await fetchM3U8Url(options.url);
if (m3u8Url) {
    downloadM3U8Video(m3u8Url, options.output);
}
