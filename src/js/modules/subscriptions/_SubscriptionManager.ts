import { RE6Module } from "../../components/RE6Module";
import { DomUtilities } from "../../components/structure/DomUtilities";
import { Modal } from "../../components/structure/Modal";
import { Tabbed, TabContent } from "../../components/structure/Tabbed";
import { Util } from "../../components/utility/Util";
import { SubscriptionCache } from "./_SubscriptionCache";
import { SubscriptionTracker } from "./_SubscriptionTracker";


export class SubscriptionManager extends RE6Module {

    // List of trackers - needs to be registered from the main file
    private static trackers: SubscriptionTracker[] = [];

    public constructor() {
        super();
        SubscriptionCache.validateCacheVersion();
    }

    public create(): void {
        super.create();

        // Create a notifications button
        const openSubscriptionsButton = DomUtilities.addSettingsButton({
            id: "header-button-settings",
            name: `<i class="fas fa-bell"></i>`,
            title: "Notifications",
            attr: {
                loading: "false",
                updates: "0",
            },
            linkClass: "update-notification",
            onClick: () => { SubscriptionManager.trigger("windowOpen"); },
        });

        // Create tab headers and content
        const trackerPages: TabContent[] = [];
        for (const tracker of SubscriptionManager.trackers)
            trackerPages.push({
                name: tracker.getOutputTab(),
                content: tracker.getOutputContainer(),
            });

        // Establish the settings window contents
        const content = new Tabbed({
            name: "notifications-tabs",
            class: "config-tabs",
            content: [
                ...trackerPages,
                // info page
            ]
        }).render().on("re621:update", () => {
            let loading = false,
                updates = 0;
            for (const trackerTab of trackerPages) {
                if (typeof trackerTab.name == "string") continue;

                if (trackerTab.name.attr("loading") == "true") loading = true;
                updates += (parseInt(trackerTab.name.attr("updates")) || 0);
            }

            openSubscriptionsButton.attr({
                loading: loading,
                updates: updates,
            });
        });

        // Create the modal
        const modal = new Modal({
            title: "Notifications",
            triggers: [{ element: openSubscriptionsButton }],
            escapable: false,
            fixed: true,
            reserveHeight: true,
            content: content,
            position: { my: "right", at: "right" },
        });
        modal.getElement().addClass("subscription-wrapper");

        SubscriptionManager.on("windowOpen", async () => {

            // Align the modal window relative to the page
            // This is really dumb, but so is JQuery-UI, which caused this issue to begin with
            const modalEl = modal.getElement().parent();
            modalEl.addClass("vis-hidden");
            await Util.sleep(50);
            modalEl.css("left", ($(document).outerWidth() - modalEl.outerWidth() - 16) + "px");
            modalEl.css("top", $("#page").offset().top + "px");
            modalEl.removeClass("vis-hidden");
        });

        for (const tracker of SubscriptionManager.trackers)
            tracker.draw();

    }

    /**
     * Stores tracker instances for later use.  
     * This does not initialize the modules - they still have to be registered in the ModuleController
     * @param moduleList List of tracker modules to register
     */
    public static async register(moduleList: any | any[]): Promise<number> {
        if (!Array.isArray(moduleList)) moduleList = [moduleList];
        for (const moduleClass of moduleList)
            this.trackers.push(moduleClass.getInstance());
        return Promise.resolve(this.trackers.length);
    }

}
