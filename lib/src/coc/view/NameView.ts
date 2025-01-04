import { Utils } from "../../../../classes/classes/internals/Utils";
import { loadId } from "./LoadUtils";

export class NameView {
    public element: HTMLElement;
    public constructor(id: string) {
        this.element = loadId(id);
    }

    public setText(text: string) {
        this.element.textContent = 'Name: ' + Utils.capitalizeFirstWord(text);
    }
}
