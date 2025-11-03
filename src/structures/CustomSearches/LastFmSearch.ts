import type { Player } from "../Player";
import type { UnresolvedSearchResult } from "../Types/Utils";

export const lastFmSearch = async (player: Player, query: string, requestUser: unknown) => {
    let error = null;
    let tracks = [];

    if (player.LavalinkManager.options.advancedOptions.debugOptions.logCustomSearches) console.log(`Lavalink-Client-Debug | SEARCHING | - ${query} on lavalink-client`)
    player.LavalinkManager.utils.validateQueryString(player.node, query);

    try {
        const requestUrl = new URL("https://ws.audioscrobbler.com/2.0/");
        requestUrl.searchParams.append("method", "track.search");
        requestUrl.searchParams.append("track", query);
        requestUrl.searchParams.append("api_key", process.env.LASTFM_API_KEY || "");
        requestUrl.searchParams.append("format", "json");
        requestUrl.searchParams.append("limit", "10");
        
        const data = await fetch(requestUrl.toString(), {
            headers: {
                'User-Agent': 'Lavalink-Client/1.0'
            }
        });

        const json = await data.json() as { results?: { trackmatches?: { track?: any[] } } };

        tracks = json?.results?.trackmatches?.track?.filter(x => !!x && typeof x === "object" && "url" in x).map?.(item => player.LavalinkManager.utils.buildUnresolvedTrack({
            uri: item.url,
            artworkUrl: item.image?.find((img: any) => img.size === "large")?.["#text"] || item.image?.[0]?.["#text"],
            author: item.artist,
            title: item.name,
            identifier: item.mbid || item.url?.split("/").reverse()[0],
        }, requestUser)) || [];

    } catch (e) { error = e; }

    return {
        loadType: "search",
        exception: error,
        pluginInfo: {},
        playlist: null,
        tracks: tracks
    } as UnresolvedSearchResult;
}
