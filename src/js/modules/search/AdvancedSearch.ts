import { PageDefinition } from "../../components/data/Page";
import { RE6Module, Settings } from "../../components/RE6Module";

export class AdvancedSearch extends RE6Module {
    public constructor() {
        super([PageDefinition.post, PageDefinition.search, PageDefinition.favorites], true);
    }

    protected getDefaultSettings(): Settings {
        return {
            enabled: false,
        };
    }
}