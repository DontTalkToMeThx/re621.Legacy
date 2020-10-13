/**
 * RE621 - E621 Reimagined
 * Script root. Better keep this place tidy.
 */

// Load Modules
import { Danbooru } from "./components/api/Danbooru";
import { Page, PageDefinition } from "./components/data/Page";
import { ModuleController } from "./components/ModuleController";
import { CleanSlate } from "./components/structure/CleanSlate";
import { DomUtilities } from "./components/structure/DomUtilities";
import { Debug } from "./components/utility/Debug";
import { Patcher } from "./components/utility/Patcher";
import { Util } from "./components/utility/Util";
import { VersionChecker } from "./components/utility/VersionChecker";
import { FavDownloader } from "./modules/downloader/FavDownloader";
import { MassDownloader } from "./modules/downloader/MassDownloader";
import { PoolDownloader } from "./modules/downloader/PoolDownloader";
import { FormattingManager } from "./modules/general/FormattingHelper";
import { HeaderCustomizer } from "./modules/general/HeaderCustomizer";
import { Miscellaneous } from "./modules/general/Miscellaneous";
import { SettingsController } from "./modules/general/SettingsController";
import { ThemeCustomizer } from "./modules/general/ThemeCustomizer";
import { EditTracker } from "./modules/misc/EditTracker";
import { SmartAlias } from "./modules/misc/SmartAlias";
import { UploadUtilities } from "./modules/misc/UploadUtilities";
import { WikiEnhancer } from "./modules/misc/WikiEnhancer";
import { DownloadCustomizer } from "./modules/post/DownloadCustomizer";
import { ImageScaler } from "./modules/post/ImageScaler";
import { PoolNavigator } from "./modules/post/PoolNavigator";
import { PostViewer } from "./modules/post/PostViewer";
import { TitleCustomizer } from "./modules/post/TitleCustomizer";
import { BetterSearch } from "./modules/search/BetterSearch";
import { BlacklistEnhancer } from "./modules/search/BlacklistEnhancer";
import { CustomFlagger } from "./modules/search/CustomFlagger";
import { HoverZoom } from "./modules/search/HoverZoom";
import { InstantFilters } from "./modules/search/InstantFilters";
import { PostSuggester } from "./modules/search/PostSuggester";
import { ProgressTracker } from "./modules/search/ProgressTracker";
import { SearchUtilities } from "./modules/search/SearchUtilities";
import { ThumbnailTweaks } from "./modules/search/ThumbnailTweaks";
import { CommentTracker } from "./modules/subscriptions/CommentTracker";
import { ForumTracker } from "./modules/subscriptions/ForumTracker";
import { PoolTracker } from "./modules/subscriptions/PoolTracker";
import { SubscriptionManager } from "./modules/subscriptions/SubscriptionManager";
import { TagTracker } from "./modules/subscriptions/TagTracker";


const loadOrder = [
    FormattingManager,
    HeaderCustomizer,
    ThemeCustomizer,

    DownloadCustomizer,
    ImageScaler,
    PoolNavigator,
    PostViewer,
    TitleCustomizer,

    BlacklistEnhancer,
    CustomFlagger,
    ThumbnailTweaks,
    BetterSearch,
    InstantFilters,
    HoverZoom,
    ProgressTracker,

    PostSuggester,
    SearchUtilities,
    Miscellaneous,

    SmartAlias,
    EditTracker,
    WikiEnhancer,
    UploadUtilities,

    FavDownloader,
    PoolDownloader,
    MassDownloader,

    SubscriptionManager,
    SettingsController,
];

const subscriptions = [
    TagTracker,
    PoolTracker,
    ForumTracker,
    CommentTracker,
];

// Show the script version in the console
console.log(`${window["re621"]["name"]} v.${window["re621"]["version"]} build ${window["re621"]["build"]}`);

// Reroute the title page before everything else loads
if (Page.matches(PageDefinition.title)) {
    const page = Util.LS.getItem("re621.mainpage");
    if (page && page !== "default") window.location.replace("/" + page);
}

// Disable existing keyboard shortcuts
Danbooru.Utility.disableShortcuts(true);

// Create the basic DOM structure
CleanSlate.createDOM().then(async () => {

    DomUtilities.createSearchbox();
    DomUtilities.createTagList();

    await Debug.init();
    await Patcher.patchConfig();
    await VersionChecker.init();

    // Subscriptions have to be registered before the SubscriptionManager
    await ModuleController.register(subscriptions);
    await SubscriptionManager.register(subscriptions);

    // Register the rest of the modules
    await ModuleController.register(loadOrder);

});
