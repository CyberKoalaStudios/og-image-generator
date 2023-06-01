import * as fs from "fs";
import puppeteer from "puppeteer";
import {fileURLToPath} from "node:url";
import {glob} from "glob";

export default function astroOGImage({config,}) {
    return {
        name: "astro-og-image",
        hooks: {
            "astro:build:done": async ({dir, routes}) => {
                let path = config.path;
                let matches = config.matches;
                let filteredRoutes = routes.filter((route) => route?.component?.includes(path));
                const allPageFiles = await glob.glob(`${dir.pathname}${config.path}/**/*.html`, {ignore: '1/**'});
                const filteredPatternsRoutes = allPageFiles
                    .map((pathname) => {
                        const matchRelPath = pathname.match(/\bdist([^<]+)index.html/);
                        const relativePath = matchRelPath ? matchRelPath[1] : "";
                        console.log("relativePath", relativePath)
                        const aMatch = matches.find((x) => {
                            return new RegExp(x.regex).test(relativePath);
                        });
                        console.log("aMatch", aMatch);
                        return {
                            pathname,
                            regex: aMatch?.regex,
                            namePrefix: aMatch?.namePrefix,
                        };
                    })
                    .filter((x, index) => x.regex);
                await generateOgImage(matches ? filteredPatternsRoutes : filteredRoutes, path, dir);
            },
        },
    };
}

async function generateOgImage(filteredRoutes, path, dir) {
    // Creates a directory for the images if it doesn't exist already
    let directory = fileURLToPath(new URL(`./assets/${path}`, dir));
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {recursive: true});
    }
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new",
    });
    for (const route of filteredRoutes) {
        const {pathname, namePrefix} = route;
        console.log("pathname", pathname, "namePrefix", namePrefix);
        // Skip URLs that have not been built (draft: true, etc.)
        if (!pathname)
            continue;
        const data = fs.readFileSync(pathname, "utf-8");
        let htmlTitle = await data.match(/<title[^>]*>([^<]+)<\/title>/)[1];

        let res = await data.match(/(?<=<script type="application\/ld\+json">)(.*?)(?=<\/script>)/);
        let title, thumbnail;
        if (res) {
            const configData = JSON.parse(res[0]);
            title = configData.headline;
            thumbnail = configData.image[0];
        }
        // Get the html
        const html = fs
            .readFileSync("og-image.html", "utf-8")
            .toString()
            .replace("@title", title || htmlTitle)
            .replace("@thumbnail", thumbnail);
        const page = await browser.newPage();
        await page.setContent(html);
        await page.waitForNetworkIdle();
        await page.setViewport({
            width: 1200,
            height: 630,
        });

        const fileToCreate = fileURLToPath(new URL(`./assets/${namePrefix}-${pathname.split("\\").at(-2)}.png`, dir));
        await page.screenshot({
            path: fileToCreate,
            encoding: "binary",
        });
    }
    await browser.close();
}

function printRoutePatterns(routes) {
    console.log("For astro-og-image, Routes Patterns to copy: ==========");
    routes.forEach((x) => {
        console.log("template/page: ", x.route);
        console.log("regex: ", x.pattern);
        console.log(" ");
    });
}