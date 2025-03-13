import { ItemSlotClass } from "../../classes/classes/ItemSlotClass";
import { ItemType } from "../../classes/classes/ItemType";

//Created by Demojay on 19/1/2025
//Class created to hold information that will used to populate a CoC Button instance, or held in a list of Buttons to be populated on the UI
export class ButtonData {
    constructor(
        public label: string,
        public callback?: () => void,
        public toolTipText?: string,
        public toolTipHeader?: string,
        public visible: Boolean = true
    ) {}

    public static fromItem(item: ItemType) {
        return new ButtonData(item.shortName, undefined, item.longName, item.description);
    }

    public static fromItemSlot(slot: ItemSlotClass) {
        return new ButtonData(slot.itype.shortName, undefined, slot.itype.longName, slot.itype.description);
    }

    
}