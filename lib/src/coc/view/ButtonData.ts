//Created by Demojay on 19/1/2025

import { Utils } from "../../../../classes/classes/internals/Utils";
import { ItemSlotClass } from "../../../../classes/classes/ItemSlotClass";
import { ItemType } from "../../../../classes/classes/ItemType";
import { CoCButton } from "./CoCButton";

//Class created to hold information that will used to populate a CoC Button instance, or held in a list of Buttons to be populated on the UI
export class ButtonData {
    constructor(
        public label: string,
        public callback?: Function,
        public toolTipText?: string,
        public toolTipHeader?: string,
        public visible: boolean = true,
        public disable: boolean = false,
    ) {}

    public applyTo(button:CoCButton) {
        button.show(this.label, this.callback, this.toolTipText, this.toolTipHeader);
        if (!this.visible) button.visible = false;
        if (this.disable) button.disabled = true;
    }

    public static fromItem(item: ItemType, callback?: Function) {
        return new ButtonData(item.shortName, callback, item.fullDescription, Utils.capitalizeFirstWord(item.longName));
    }

    public static fromItemSlot(slot: ItemSlotClass, callback?: Function) {
        //this.player.itemSlots[x].itype.shortName + " x" + this.player.itemSlots[x].quantity
        let quantityStr:String = "";
        if (slot.quantity > 1)
            quantityStr = " x" + slot.quantity

        return new ButtonData(slot.itype.shortName + quantityStr, callback, slot.itype.fullDescription, Utils.capitalizeFirstWord(slot.itype.longName));
    }

    
}