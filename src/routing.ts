import type { APIRoute, GetStaticPaths } from 'astro';
import { generateOpenGraphImage } from './generateOpenGraphImage';
import type { OGImageOptions } from './types/og-image-options';

const pathToSlug = (path: string): string => {
    path = path.replace(/^\/src\/pages\//, '');
    path = path.replace(/^\/src\/content\//, '');
    path = path.replace(/\.[^\.]*$/, '') + '.png';
    path = path.replace(/\/index\.png$/, '.png');
    return path;
};

const slugFromCollection = (path: string): string =>  {
    path = path.replace(/^\/src\/content\/articles\//, '');
    path = path.replace(/\.[^\.]*$/, '') + '';
    return path;
}

const addCollectionNameAndImageExtension = (path: string): string => {
    return "articles/" + path + ".png";
}

function makeGetStaticPaths({
                                pages,
                                collection,
                                param,
                                getSlug = pathToSlug,
                                getRawSlug = slugFromCollection,
                                addCollectionAndExtension = addCollectionNameAndImageExtension,
                            }: OGImageRouteConfig): GetStaticPaths {
    let slugs = Object.entries(pages).map((page) => getSlug(...page));

    // Filter only slugs in collection
    if (collection) {
        const slugsRaw = Object.entries(pages).map((page) => getRawSlug(...page));
        const slugsFiltered = slugsRaw.filter(slug => collection.some(entry => entry.slug === slug));
        slugs = slugsFiltered.map((slug) => {
            return addCollectionAndExtension(slug);
        });
    }

    const paths = slugs.map((slug) => ({ params: { [param]: slug } }));
    return function getStaticPaths() {
        return paths;
    };
}

function createOGImageEndpoint({ getSlug = pathToSlug, ...opts }: OGImageRouteConfig): APIRoute {
    return async function getOGImage({ params }) {
        const pageEntry = Object.entries(opts.pages).find(
            (page) => getSlug(...page) === params[opts.param]
        );
        if (!pageEntry) return new Response('Page not found', { status: 404 });
        return {
            body: (await generateOpenGraphImage(
                await opts.getImageOptions(...pageEntry)
            )) as unknown as string,
        };
    };
}

export function OGDynamicImageRoute(opts: OGImageRouteConfig): {
    getStaticPaths: GetStaticPaths;
    get: APIRoute;
} {
    return {
        getStaticPaths: makeGetStaticPaths(opts),
        get: createOGImageEndpoint(opts),
    };
}

interface OGImageRouteConfig {
    pages: { [path: string]: any };
    collection?: { slug?: string, pubDate?: Date }[];
    param: string;
    getSlug?: (path: string, page: any) => string;
    getRawSlug?:(path: string, page: any) => string;
    addCollectionAndExtension?:(path: string) => string;
    getImageOptions: (path: string, page: any) => OGImageOptions | Promise<OGImageOptions>;
}
