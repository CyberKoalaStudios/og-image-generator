[![Node.js Package](https://github.com/CyberKoalaStudios/og-image-generator/actions/workflows/npm-publish.yml/badge.svg?event=deployment_status)](https://github.com/CyberKoalaStudios/og-image-generator/actions/workflows/npm-publish.yml)

# :rocket: Astro Open Graph Image Generator
Astro integration to generate Social Images from Astro Content Collections with custom blurry background that can be loaded via frontmatter.

[![Example of generated image](https://i.ibb.co/vL2mVTz/articles-test.png)](https://cyberkoalastudios.com)


## Installation
```bash
npm i @cyberkoalastudios/og-image-generator
```
## Usage
### Creating an OpenGraph image endpoint
1. Create a new file in your `src/pages/` directory. For example, `src/pages/custom-open-graph/[...route].ts`.
2. Use the `OGDynamicImageRoute` helper to create `getStaticPaths` and `get` functions for you:

````typescript
import {OGDynamicImageRoute} from '@cyberkoalastudios/og-image-generator';


export const {getStaticPaths, get} = OGDynamicImageRoute({
    // Tell us the name of your dynamic route segment.
    // In this case it’s `route`, because the file is named `index.ts`.
    param: 'route',

    // A collection of pages to generate images for.
    // This can be any map of paths to data, not necessarily a glob result.
    
    pages: await import.meta.glob('/src/content/articles/**/*.md', {eager: true}),
    // For each page, this callback will be used to customize the OpenGraph
    // image. For example, if `pages` was passed a glob like above, you
    // could read values from frontmatter.
    getImageOptions: (path, page) => ({
        title: page.frontmatter.title,
        description: page.frontmatter.description,
        logo: {
            path: './src/favicon.png',
        },
        backgroundImage: {
            url: page.frontmatter.image?.url,
            alpha: 0.2,
            blurStrength: 3,
        },
        // There are a bunch more options you can use here!
        bgGradient: [[26, 26, 26], [24, 24, 24]],
        /** Border config. Highlights a single edge of the image. */
        border: {
            /** RGB border color, e.g. `[0, 255, 0]`. */
            color: [76, 0, 153],

            /** Border width. Default: `0`. */
            width: 15,

            /** Side of the image to draw the border on. Inline start/end respects writing direction. */
            side: "block-end",
        },

        font: {
            title: {
                families: ['Open Sans','Ubuntu','Istok Web','Source Sans Pro', 'PT Serif', 'Andika']
            },
            description: {
                families: ['Open Sans','Ubuntu','Istok Web','Source Sans Pro', 'PT Serif', 'Andika']
            }
        },
        

    }),
});
````

Example of `post.md`:

```astro
---
title: My test post
author: LRN4
description: "CyberKoala LLC"
image:
  url: "https://avatars.githubusercontent.com/u/104198244?s=200&v=4.jpg"
  alt: "Image alt"
pubDate: 2023-06-01
tags: ["vr","education","tech"]
draft: false
---
# Rate this package

Some text
```

### Image Options

Your `getImageOptions` callback should return an object configuring the image to render. Almost all options are optional.

````typescript
export interface OGImageOptions {
    /** Page title. */
    title: string;

    /** Short page description. */
    description?: string;

    /** Writing direction. Default: `'ltr'`. Set to `'rtl'` for Arabic, Hebrew, etc. */
    dir?: 'rtl' | 'ltr';

    /** Optional site logo. Displayed at the top of the card. */
    logo?: {
        /** Path to the logo image file, e.g. `'./src/logo.png'` */
        path: string;

        /**
         * Size to display logo at.
         * - `undefined` — Use original image file dimensions. (Default)
         * - `[width]` — Resize to the specified width, height will be
         *               resized proportionally.
         * - `[width, height]` — Resized to the specified width and height.
         */
        size?: [width?: number, height?: number];
    };
    /** Optional background image. Displayed as cover of the card. */
    backgroundImage?: {
        size?: [width?: number, height?: number];
        /** Path to the bg image file, e.g. `'./src/bg.png'`  or `page.frontmatter.image?.url`*/
        url: string;
    };
    /**
     * Array of `[R, G, B]` colors to use in the background gradient,
     * e.g. `[[255, 0, 0], [0, 0, 255]]` (red to blue).
     * For a solid color, only include a single color, e.g. `[[0, 0, 0]]`
     */
    bgGradient?: RGBColor[];

    /** Border config. Highlights a single edge of the image. */
    border?: {
        /** RGB border color, e.g. `[0, 255, 0]`. */
        color?: RGBColor;

        /** Border width. Default: `0`. */
        width?: number;

        /** Side of the image to draw the border on. Inline start/end respects writing direction. */
        side?: LogicalSide;
    };

    /** Amount of padding between the image edge and text. Default: `60`. */
    padding?: number;

    /** Font styles. */
    font?: {
        /** Font style for the page title. */
        title?: FontConfig;

        /** Font style for the page description. */
        description?: FontConfig;
    };

    /** Array of font URLs to load and use when rendering text. */
    fonts?: string[];
}

````

#### `FontConfig`
````typescript
export interface FontConfig {
  /** RGB text color. Default: `[255, 255, 255]` */
  color?: RGBColor;

  /** Font size. Title default is `70`, description default is `40`. */
  size?: number;

  /** Font weight. Make sure you provide a URL for the matching font weight. */
  weight?: Exclude<keyof CanvasKit['FontWeight'], 'values'>;

  /** Line height, a.k.a. leading. */
  lineHeight?: number;

  /**
   * Font families to use to render this text. These must be loaded using the
   * top-level `fonts` config option.
   *
   * Similar to CSS, this operates as a “font stack”. The first family in the
   * list will be preferred with next entries used if a glyph isn’t in earlier
   * families. Useful for providing fallbacks for different alphabets etc.
   *
   * Example: `['Noto Sans', 'Noto Sans Arabic']`
   */
  families?: string[];
}

````

<div style="page-break-after: always;"></div>


## Final steps

Great now you should be done!🎉 Deploy your site and test it out. Great site for testing this out is [Open Graph previewer](https://www.opengraph.xyz/).
