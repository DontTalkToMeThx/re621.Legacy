import { TagTypes, Tag } from "./Tag";

declare var Danbooru;

/**
 * Collects basic info for a post.
 * Use fetchPosts to construct
 */
export class Post {

    private static initalPosts: Post[];
    private static addedPosts: Post[] = [];

    protected element: JQuery<HTMLElement>;

    protected id: number;
    protected tags: string;
    protected rating: PostRating;
    protected favorites: number;
    protected score: number;

    protected fileURL: string;
    protected sampleURL: string;
    protected previewURL: string;
    protected fileExtension: string;

    protected uploaderID: number;
    protected uploaderName: string;

    protected sound: boolean;
    protected flags: string;

    protected isBlacklisted: boolean;

    public constructor($image: JQuery<HTMLElement>) {
        this.id = parseInt($image.attr("data-id"));
        this.tags = $image.attr("data-tags");
        this.rating = PostRating.fromValue($image.attr("data-rating"));

        if ($image.attr("data-fav-count")) { this.favorites = parseInt($image.attr("data-fav-count")); }
        else { parseInt($image.find(".post-score-faves").first().html().substring(1)); }

        if ($image.attr("data-score")) { this.score = parseInt($image.attr("data-score")); }
        else { parseInt($image.find(".post-score-score").first().html().substring(1)); }

        this.fileURL = $image.attr("data-file-url");
        this.sampleURL = $image.attr("data-large-file-url");
        this.previewURL = $image.attr("data-preview-file-url");
        this.fileExtension = $image.attr("data-file-ext");

        this.uploaderID = parseInt($image.attr("data-uploader-id"));
        this.uploaderName = $image.attr("data-uploader");
        this.sound = $image.attr("data-has-sound") === "true";
        this.flags = $image.attr("data-flags");

        this.element = $image;

        //Check if a post will be hidden if the blacklist is active
        //Cache this result, to prevent having to recalculate it everytime the blacklist toggles
        this.isBlacklisted = this.matchesSiteBlacklist();
    }

    /**
     * Fetches the posts from the current page.
     */
    public static fetchPosts() {
        if (this.initalPosts === undefined) {
            let imageContainer = $("#image-container");
            this.initalPosts = [];
            if (imageContainer.length === 0) {
                $("#posts-container").children(".post-preview").each(function () {
                    Post.initalPosts.push(new Post($(this)));
                });
            } else {
                this.initalPosts.push(new ViewingPost(imageContainer));
            }
        }

        return this.initalPosts.concat(this.addedPosts);
    }

    /**
     * Adds a post which will now be returned with fetchPosts
     * @param post the post to appened
     */
    public static appendPost(post) {
        this.initalPosts.push(post);
    }

    /**
     * Creates a ViewingPost if you are on a post page (https://e621.net/posts/:id)
     * @returns the current ViewingPost if it exists, undefined otherwise
     */
    public static getViewingPost() {
        const posts = this.fetchPosts();
        if (posts[0] instanceof ViewingPost) {
            return <ViewingPost>posts[0];
        } else {
            return undefined;
        }
    }

    /**
    * Checks if the post would be returned if you searched on the site with filterString
    * Most of the things that work on the site should also work here
    * @todo Implement ~ modifier
    */
    public tagsMatchesFilter(queryString: string) {
        const seperatedFilters = queryString.split(" ");
        let result = true;
        for (const filter of seperatedFilters) {
            const inverse = filter.startsWith("-");
            //Remove dash from filter, if it starts with one
            const filterNoMinus = inverse ? filter.substring(1) : filter;
            //If the result is already negative, bail. All filters must match
            if (result === false) {
                break;
            }
            if (filterNoMinus.includes("*")) {
                const regex = Tag.escapeSearchToRegex(filterNoMinus);
                result = regex.test(this.getTags());
            } else {
                //if there is no wildcard, the filter and tag must be an equal match
                let matchFound = false;
                for (const tag of this.getTags().split(" ")) {
                    if (tag === filterNoMinus) {
                        matchFound = true;
                        break;
                    }
                }
                result = matchFound;
            }
            //invert the result, depending on if the filter started with a -
            result = result !== inverse;
        }
        return result;
    }

    /**
     * Checks if posts should be hidden, because the blacklist is active
     */
    public static blacklistIsActive() {
        return $("#disable-all-blacklists").is(":visible");
    }

    /**
     * Checks if a post should be hidden by the users blacklist
     * Also takes care to update blacklist match counter
     * https://github.com/zwagoth/e621ng/blob/master/app/javascript/src/javascripts/blacklists.js
     */
    private matchesSiteBlacklist() {
        let hits = 0;
        for (const entry of Danbooru.Blacklist.entries) {
            if (Danbooru.Blacklist.post_match(this.element, entry)) {
                entry.hits++
                if (!entry.disabled) {
                    hits++;
                }
                Danbooru.Blacklist.post_count++;
            }
        }
        return hits !== 0;
    }

    /**
     * Returns true if the post has been hidden by InstantSearch
     * @returns boolean True if the post has been hidden, false otherwise
     */
    public isVisible() { return !this.element.hasClass("filtered"); }

    /**
     * Sets the post's visibility status
     * @param hidden If true, hides the post, if false shows it
     */
    public setVisibility(visible = true) {
        if (visible) { this.element.removeClass("filtered"); }
        else { this.element.addClass("filtered"); }
    }

    /**
     * Returns the JQuery Object for the post
     * @returns JQuery<HTMLElement> DOM Element
     */
    public getDomElement() {
        return this.element;
    }

    /**
     * Returns true if post can be hidden by blacklist
     * @returns true if the post can be hidden by the blacklist, false otherwise
     */
    public getIsBlacklisted() {
        return this.isBlacklisted;
    }

    public getId() { return this.id; }
    public getTags() { return this.tags; }
    public getRating() { return this.rating; }
    public getFavCount() { return this.favorites; }
    public getScoreCount() { return this.score; }

    public getImageURL() { return this.fileURL; }
    public getSampleURL() { return this.sampleURL; }
    public getPreviewURL() { return this.previewURL; }

    public getFileExtension() { return this.fileExtension; }

    public getUploaderID() { return this.uploaderID; }
    public getUploaderName() { return this.uploaderName; }

    public hasSound() { return this.sound; }
    public getFlags() { return this.flags; }
}


/**
 * If you are viewing a post this element can be constructed
 */
export class ViewingPost extends Post {
    private isFaved: boolean;
    private isUpvoted: boolean;
    private isDownvoted: boolean;

    private artistTags: string[];
    private characterTags: string[];
    private copyrightTags: string[];
    private speciesTags: string[];
    private generalTags: string[];
    private metaTags: string[];
    private loreTags: string[];

    constructor($image: JQuery<HTMLElement>) {
        super($image);

        this.isFaved = $("#add-to-favorites").css("display") === "none";
        this.isUpvoted = $("#post-vote-up-" + this.id).hasClass("score-positive");
        this.isDownvoted = $("#post-vote-down-" + this.id).hasClass("score-negative");

        this.artistTags = this.getAllFromTaggroup("artist");
        this.characterTags = this.getAllFromTaggroup("character");
        this.copyrightTags = this.getAllFromTaggroup("copyright");
        this.speciesTags = this.getAllFromTaggroup("species");
        this.generalTags = this.getAllFromTaggroup("general");
        this.metaTags = this.getAllFromTaggroup("meta");
        this.loreTags = this.getAllFromTaggroup("lore");
    }

    private getAllFromTaggroup(taggroup: string) {
        const result = [];
        for (const element of $(`#tag-list .${taggroup}-tag-list`).children()) {
            result.push($(element).find(".search-tag").text().replace(/ /g, "_"));
        }
        return result;
    }
    /**
     * Returns true if the post is favorited
     */
    public getIsFaved() {
        return this.isFaved;
    }

    /**
     * Returns true if the post is upvoted
     */
    public getIsUpvoted() {
        return this.isUpvoted;
    }

    /**
     * Returns true if the post is downvoted
     */
    public getIsDownvoted() {
        return this.isDownvoted;
    }

    /**
     * Returns an array of all the tags of the specified type, or an empty array if there are none
     */
    public getTagsFromType(tagType: TagTypes): string[] {
        return this[tagType + "Tags"];
    }
}

export enum PostRating {
    Safe = "s",
    Questionable = "q",
    Explicit = "e"
}

export namespace PostRating {
    export function fromValue(value: string) {
        for (const key of Object.keys(PostRating)) {
            if (PostRating[key] === value) {
                return PostRating[key];
            }
        }
        return undefined;
    }

    export function toString(postRating: PostRating): string {
        for (const key of Object.keys(PostRating)) {
            if (PostRating[key] === postRating) {
                return key;
            }
        }
        return undefined;
    }
}
