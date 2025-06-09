import { BaseContent } from "../BaseContent";
import { ItemSlotClass } from "../ItemSlotClass";
import { Saves } from "../Saves";
import { kFLAGS } from "../GlobalFlags/kFLAGS";
import { WeaponLib } from "../Items/WeaponLib";
import { StatusAffects } from "../StatusAffects";
import { ItemType } from "../ItemType";
import { CoC_Settings } from "../CoC_Settings";
import { Useable } from "../Items/Useable";
import { trace } from "../../console";
import { Armor } from "../Items/Armor";
import { Weapon } from "../Items/Weapon";
import { kGAMECLASS } from "../GlobalFlags/kGAMECLASS";
import { ButtonDataList } from "../../../lib/src/coc/view/ButtonDataList";
import { ButtonData } from "../../../lib/src/coc/view/ButtonData";
import { Utils } from "../internals/Utils";

/**
 * Created by aimozg on 12.01.14.
 */

export class Inventory extends BaseContent {
    private static inventorySlotName: any[] = ["first", "second", "third", "fourth", "fifth"];

    private itemStorage: ItemSlotClass[];
    private gearStorage: ItemSlotClass[];
    private callNext: any;		//These are used so that we know what has to happen once the player finishes with an item
    private callOnAbandon: any;	//They simplify dealing with items that have a sub menu. Set in inventoryMenu and in takeItem
    private currentItemSlot: ItemSlotClass | undefined;	//The slot previously occupied by the current item - only needed for stashes and items with a sub menu.

    public constructor(saveSystem: Saves) {
        super();
        this.itemStorage = [];
        this.gearStorage = [];
        saveSystem.linkToInventory(this.itemStorageDirectGet, this.gearStorageDirectGet);
    }

    public showStash(): boolean {
        return this.flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00254] > 0 || this.flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00255] > 0 || this.itemStorage.length > 0 || this.flags[kFLAGS.ANEMONE_KID] > 0;
    }

    private itemStorageDirectGet(): any[] { return this.itemStorage; }

    private gearStorageDirectGet(): any[] { return this.gearStorage; }

    //		public function currentCallNext() { return callNext; }

    public itemGoNext(): void { if (this.callNext != undefined) this.doNext(this.callNext); }

    public inventoryMenu(): void {
        var x: number;
        if (this.getGame().inCombat) {
            this.callNext = this.inventoryCombatHandler; //Player will return to combat after item use
        }
        else {
            this.spriteSelect(-1);
            this.callNext = this.inventoryMenu; //In camp or in a dungeon player will return to inventory menu after item use
        }
        this.hideMenus();
        this.hideUpDown();
        this.clearOutput();
        this.outputText("<b><u>Equipment:</u></b>\n");
        this.outputText("<b>Weapon</b>: " + this.player.weaponName + " (Attack - " + this.player.weaponAttack + ")\n");
        this.outputText("<b>Armor : </b>" + this.player.armorName + " (Defense - " + this.player.armorDef + ")\n");
        if (this.player.keyItems.length > 0) this.outputText("<b><u>\nKey Items:</u></b>\n");
        for (let x = 0; x < this.player.keyItems.length; x++) 
            this.outputText(this.player.keyItems[x].keyName + "\n");
        this.menu();

        const inventoryList: ButtonDataList = new ButtonDataList();
        const constButtons: ButtonDataList = new ButtonDataList();
        let unlockedSlots:number = 0;
        let filledSlots:number = 0;
        
        for (x = 0; x < this.player.itemSlots.length; x++) {
            if (this.player.itemSlots[x].unlocked) {
                unlockedSlots++;
                if (this.player.itemSlots[x].quantity > 0) {
                    inventoryList.append(ButtonData.fromItemSlot(this.player.itemSlots[x], Utils.curry(this.useItemInInventory, x)));
                    filledSlots++;
                }
            }
        }
        if (this.player.weapon != WeaponLib.FISTS) {
            constButtons.add("Unequip", this.unequipWeapon, "Unequip your current weapon")
        }

        constButtons.add("Key items", this.keyItems);

        if (this.getGame().inCombat && this.player.findStatusAffect(StatusAffects.Sealed) >= 0 && this.player.statusAffectv1(StatusAffects.Sealed) == 3) {
            this.outputText("\nYou reach for your items, but you just can't get your pouches open.  <b>Your ability to use items was sealed, and now you've wasted a chance to attack!</b>\n\n");
            this.getGame().enemyAI();
            return;
        }
        this.outputText(`\nWhich item will you use (${filledSlots}/${unlockedSlots})?`);
        const backFunction = (this.getGame().inCombat? Utils.curry(kGAMECLASS.combatMenu, false): this.playerMenu);
        BaseContent.submenu(inventoryList, backFunction, 0, false, constButtons);
        /*for (x = 0; x < 5; x++) {
            if (this.player.itemSlots[x].unlocked && this.player.itemSlots[x].quantity > 0) {
                this.addButton(x, (this.player.itemSlots[x].itype.shortName + " x" + this.player.itemSlots[x].quantity), this.useItemInInventory, x);
                foundItem = true;
            }
        }
        if (this.player.weapon != WeaponLib.FISTS) {
            this.addButton(5, "Unequip", this.unequipWeapon);
        }
        if (!this.getGame().inCombat && this.inDungeon == false && this.inRoomedDungeon == false) {
            if (this.getGame().nieveHoliday() && this.flags[kFLAGS.NIEVE_STAGE] > 0 && this.flags[kFLAGS.NIEVE_STAGE] < 5) {
                if (this.flags[kFLAGS.NIEVE_STAGE] == 1)
                    this.outputText("\nThere's some odd snow here that you could do something with...\n");
                else this.outputText("\nYou have a snow" + this.getGame().nieveMF("man", "woman") + " here that seems like it could use a little something...\n");
                this.addButton(6, "Snow", this.getGame().nieveBuilding);
                foundItem = true;
            }
            if (this.flags[kFLAGS.FUCK_FLOWER_KILLED] == 0 && this.flags[kFLAGS.FUCK_FLOWER_LEVEL] >= 1) {
                if (this.flags[kFLAGS.FUCK_FLOWER_LEVEL] == 4) this.outputText("\nHolli is in her tree at the edges of your camp.  You could go visit her if you want.\n");
                this.addButton(7, (this.flags[kFLAGS.FUCK_FLOWER_LEVEL] >= 3 ? "Tree" : "Plant"), this.getGame().holliScene.treeMenu);
                foundItem = true;
            }
            if (this.player.hasKeyItem("Dragon Egg") >= 0) {
                this.getGame().emberScene.emberCampDesc();
                this.addButton(8, "Egg", this.getGame().emberScene.emberEggInteraction);
                foundItem = true;
            }
        }
        if (!foundItem) {
            this.outputText("\nYou have no usable items.");
            this.doNext(this.playerMenu);
            return;
        }
        if (this.getGame().inCombat && this.player.findStatusAffect(StatusAffects.Sealed) >= 0 && this.player.statusAffectv1(StatusAffects.Sealed) == 3) {
            this.outputText("\nYou reach for your items, but you just can't get your pouches open.  <b>Your ability to use items was sealed, and now you've wasted a chance to attack!</b>\n\n");
            this.getGame().enemyAI();
            return;
        }
        this.outputText("\nWhich item will you use?");
        if (this.getGame().inCombat)
            this.addButton(9, "Back", kGAMECLASS.combatMenu, false); //Player returns to the combat menu on cancel
        else this.addButton(9, "Back", this.playerMenu);
        //Gone			menuLoc = 1; */
    }

    public keyItems(): void {
        const keyItemsList: ButtonDataList = new ButtonDataList();        

        if (!this.getGame().inCombat && this.inDungeon == false && this.inRoomedDungeon == false) {
            if (this.getGame().nieveHoliday() && this.flags[kFLAGS.NIEVE_STAGE] > 0 && this.flags[kFLAGS.NIEVE_STAGE] < 5) {
                if (this.flags[kFLAGS.NIEVE_STAGE] == 1)
                    this.outputText("\nThere's some odd snow here that you could do something with...\n");
                else this.outputText("\nYou have a snow" + this.getGame().nieveMF("man", "woman") + " here that seems like it could use a little something...\n");
                keyItemsList.add("Snow", this.getGame().nieveBuilding);
            }
            if (this.flags[kFLAGS.FUCK_FLOWER_KILLED] == 0 && this.flags[kFLAGS.FUCK_FLOWER_LEVEL] >= 1) {
                if (this.flags[kFLAGS.FUCK_FLOWER_LEVEL] == 4) this.outputText("\nHolli is in her tree at the edges of your camp.  You could go visit her if you want.\n");
                keyItemsList.add((this.flags[kFLAGS.FUCK_FLOWER_LEVEL] >= 3 ? "Tree" : "Plant"), this.getGame().holliScene.treeMenu);
            }
            if (this.player.hasKeyItem("Dragon Egg") >= 0) {
                this.getGame().emberScene.emberCampDesc();
                keyItemsList.add("Egg", this.getGame().emberScene.emberEggInteraction);
            }
        }

        BaseContent.submenu(keyItemsList, this.inventoryMenu, 0, false);
    }

    public stash(): void {
        /*Hacked in cheat to enable shit
        flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00254] = 1;
        flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00255] = 1;*/
        //REMOVE THE ABOVE BEFORE RELASE ()
        this.clearOutput();
        this.spriteSelect(-1);
        this.menu();
        if (this.flags[kFLAGS.ANEMONE_KID] > 0) {
            kGAMECLASS.anemoneScene.anemoneBarrelDescription();
            if (this.model.time.hours >= 6) this.addButton(4, "Anemone", kGAMECLASS.anemoneScene.approachAnemoneBarrel);
        }
        if (this.player.hasKeyItem("Camp - Chest") >= 0) {
            this.outputText("You have a large wood and iron chest to help store excess items located near the portal entrance.\n\n");
            this.addButton(0, "Chest", this.showChestStashMenu);
        }
        //Weapon Rack
        if (this.flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00254] > 0) {
            this.outputText("There's a weapon rack set up here, set up to hold up to nine various weapons.");
            this.addButton(1, "W. Rack", this.showWeaponStashMenu)
            this.outputText("\n\n");
        }
        //Armor Rack
        if (this.flags[kFLAGS.UNKNOWN_FLAG_NUMBER_00255] > 0) {
            this.outputText("Your camp has an armor rack set up to hold your various sets of gear.  It appears to be able to hold nine different types of armor.");
            this.addButton(2, "A. Rack", this.showArmorStashMenu);
            this.outputText("\n\n");
        }
        this.addButton(14, "Back", this.playerMenu);
    }

    private showChestStashMenu(): void {
        this.clearOutput();
        this.menu();
        const chestList = this.getChestStashList();
        this.outputText(`Chest Contents (${chestList.length}/9):\n\n`);
        this.addButton(0, "Chest Store", this.pickItemToPlaceInCampStorage);
        if (chestList.length) {
            this.addButton(1, "Chest Take", this.pickItemToTakeFromCampStorage);

            chestList.forEach(itemName => {
                this.outputText(itemName + "\n")
            });
        }
        this.addButton(14, "Back", this.stash);
    }

    private showWeaponStashMenu(): void {
        this.clearOutput();
        this.menu();
        const weaponList = this.getWeaponStashList();
        this.outputText(`Weapon Stash Contents (${weaponList.length}/9):\n\n`);
        this.addButton(2, "W.Rack Put", this.pickItemToPlaceInWeaponRack);
        if (weaponList.length) {
            this.addButton(3, "W.Rack Take", this.pickItemToTakeFromWeaponRack);

            weaponList.forEach(itemName => {
                this.outputText(itemName + "\n")
            });
        }
        this.addButton(14, "Back", this.stash);
    }

    private showArmorStashMenu(): void {
        this.clearOutput();
        this.menu();
        let armorList = this.getArmorStashList();
        this.outputText(`Armor Stash Contents (${armorList.length}/9):\n\n`);
        this.addButton(5, "A.Rack Put", this.pickItemToPlaceInArmorRack);
        if (armorList.length) {
            this.addButton(6, "A.Rack Take", this.pickItemToTakeFromArmorRack);

            armorList.forEach(itemName => {
                this.outputText(itemName + "\n")
            });
        }
        this.addButton(14, "Back", this.stash);
    }

    public takeItem(itype: ItemType | undefined, nextAction: any, overrideAbandon?: any, source?: ItemSlotClass): void {
        if (itype == undefined) {
            CoC_Settings.error("takeItem(undefined)");
            return;
        }
        if (itype == ItemType.NOTHING) return;
        if (nextAction != undefined)
            this.callNext = nextAction;
        else this.callNext = this.playerMenu;
        //Check for an existing stack with room in the inventory and return the value for it.
        var temp: number = this.player.roomInExistingStack(itype);
        if (temp >= 0) { //First slot go!
            this.player.itemSlots[temp].quantity++;
            this.outputText("You place " + itype.longName + " in your " + Inventory.inventorySlotName[temp] + " pouch, giving you " + this.player.itemSlots[temp].quantity + " of them.");
            this.itemGoNext();
            return;
        }
        //If not done, then put it in an empty spot!
        //Throw in slot 1 if there is room
        temp = this.player.emptySlot();
        if (temp >= 0) {
            this.player.itemSlots[temp].setItemAndQty(itype, 1);
            this.outputText("You place " + itype.longName + " in your " + Inventory.inventorySlotName[temp] + " pouch.");
            this.itemGoNext();
            return;
        }
        if (overrideAbandon != undefined) //callOnAbandon only becomes important if the inventory is full
            this.callOnAbandon = overrideAbandon;
        else this.callOnAbandon = this.callNext;
        //OH NOES! No room! Call replacer functions!
        this.takeItemFull(itype, true, source);
    }

    public returnItemToInventory(item: Useable, showNext: boolean = true): void { //Used only by items that have a sub menu if the player cancels
        if (!this.debug) {
            if (this.currentItemSlot == undefined) {
                this.takeItem(item, this.callNext, this.callNext, undefined); //Give player another chance to put item in inventory
            }
            else if (this.currentItemSlot.quantity > 0) { //Add it back to the existing stack
                this.currentItemSlot.quantity++;
            }
            else { //Put it back in the slot it came from
                this.currentItemSlot.setItemAndQty(item, 1);
            }
        }
        if (this.getGame().inCombat) {
            this.enemyAI();
            return;
        }
        if (showNext)
            this.doNext(this.callNext); //Items with sub menus should return to the inventory screen if the player decides not to use them
        else this.callNext(); //When putting items back in your stash we should skip to the take from stash menu
    }

    /*
    * Returns the maximum number of copies for an item that can be added before the inventory is full
    */
    public roomForItem(itype: ItemType): number {
    
        return this.player.itemSlots.reduce((spaceLeft, itemSlot) => { 
            if (itemSlot.itype == itype) {
                return spaceLeft + (itype.maxStackSize - itemSlot.quantity);
            } else if (itemSlot.isEmpty() && itemSlot.unlocked) {
                return spaceLeft + itype.maxStackSize;
            }
            return spaceLeft;
        }, 0);

    }

    /*
    * Tries to add multiple instances of an item to the inventory, and returns the number of item that were successfully added
    */
   public tryToAddMultipleItems(itype: ItemType, quantity:number): number {
    let amountDeposited:number = 0;

    if (itype == undefined) {
        CoC_Settings.error("takeItem(undefined)");
        return amountDeposited;
    }

    if (itype == ItemType.NOTHING) return amountDeposited;

    while (quantity > 0) {
        let existingStack = this.player.roomInExistingStack(itype);
        if (existingStack >= 0) {
            this.player.itemSlot(existingStack).quantity++;
            amountDeposited++;
            quantity--;
        } else {
            let newStack = this.player.emptySlot();
            if (newStack >= 0) {
                this.player.itemSlot(newStack).setItemAndQty(itype, 1);
                amountDeposited++;
                quantity--;
            } else {
                return amountDeposited;
            }
        }
    }

    return amountDeposited;
   }

    //Check to see if anything is stored
    public hasItemsInStorage(): boolean { return this.itemAnyInStorage(this.itemStorage, 0, this.itemStorage.length); }

    public hasItemInStorage(itype: ItemType): boolean { return this.itemTypeInStorage(this.itemStorage, 0, this.itemStorage.length, itype); }

    public consumeItemInStorage(itype: ItemType): boolean {
        this.temp = this.itemStorage.length;
        while (this.temp > 0) {
            this.temp--;
            if (this.itemStorage[this.temp].itype == itype && this.itemStorage[this.temp].quantity > 0) {
                this.itemStorage[this.temp].quantity--;
                return true;
            }
        }
        return false;
    }

    public giveHumanizer(): void {
        if (this.flags[kFLAGS.TIMES_CHEATED_COUNTER] > 0) {
            this.outputText("<b>I was a cheater until I took an arrow to the knee...</b>", true);
            this.getGame().gameOver();
            return;
        }
        this.outputText("I AM NOT A CROOK.  BUT YOU ARE!  <b>CHEATER</b>!\n\n", true);
        this.inventory.takeItem(this.consumables.HUMMUS_, this.playerMenu);
        this.flags[kFLAGS.TIMES_CHEATED_COUNTER]++;
    }

    //Create a storage slot
    public createStorage(): boolean {
        if (this.itemStorage.length >= 16) return false;
        var newSlot: ItemSlotClass = new ItemSlotClass();
        this.itemStorage.push(newSlot);
        return true;
    }

    //Clear storage slots
    public clearStorage(): void {
        //Various Errors preventing action
        if (this.itemStorage == undefined) trace("ERROR: Cannot clear storage because storage does not exist.");
        else {
            trace("Attempted to remove " + this.itemStorage.length + " storage slots.");
            this.itemStorage.splice(0, this.itemStorage.length);
        }
    }

    public clearGearStorage(): void {
        //Various Errors preventing action
        if (this.gearStorage == undefined) trace("ERROR: Cannot clear storage because storage does not exist.");
        else {
            trace("Attempted to remove " + this.gearStorage.length + " storage slots.");
            this.gearStorage.splice(0, this.gearStorage.length);
        }
    }

    public initializeGearStorage(): void {
        //Completely empty storage array
        if (this.gearStorage == undefined) trace("ERROR: Cannot clear gearStorage because storage does not exist.");
        else {
            trace("Attempted to remove " + this.gearStorage.length + " gearStorage slots.");
            this.gearStorage.splice(0, this.gearStorage.length);
        }
        //Rebuild a new one!
        var newSlot: ItemSlotClass;
        while (this.gearStorage.length < 18) {
            newSlot = new ItemSlotClass();
            this.gearStorage.push(newSlot);
        }
    }

    private useItemInInventory(slotNum: number): void {
        this.clearOutput();
        if (this.player.itemSlots[slotNum].itype instanceof Useable) {
            var item: Useable = this.player.itemSlots[slotNum].itype as Useable;
            if (item.canUse()) { //If an item cannot be used then canUse should provide a description of why the item cannot be used
                if (!this.debug) this.player.itemSlots[slotNum].removeOneItem();
                this.useItem(item, this.player.itemSlots[slotNum]);
                return;
            }
        }
        else {
            this.outputText("You cannot use " + this.player.itemSlots[slotNum].itype.longName + "!\n\n");
        }
        this.itemGoNext(); //Normally returns to the inventory menu. In combat it goes to the inventoryCombatHandler function
        /* menuLoc is no longer needed, after enemyAI game will always move to the next round			
                    else if (menuLoc == 1) {
                        menuLoc = 0;
                        if (!combatRoundOver()) {
                            outputText("\n\n");
                            enemyAI();
                        }
                    }
        */
    }

    private inventoryCombatHandler(): void {
        if (!this.combatRoundOver()) { //Check if the battle is over. If not then go to the enemy's action.
            this.outputText("\n\n");
            this.enemyAI();
        }
    }

    private useItem(item: Useable, fromSlot: ItemSlotClass): void {
        item.useText();
        if (item instanceof Armor) {
            this.player.armor.removeText();
            let oldItem = this.player.setArmor(item as Armor); //Item is now the player's old armor
            if (oldItem == undefined)
                this.itemGoNext();
            else this.takeItem(oldItem, this.callNext);
        }
        else if (item instanceof Weapon) {
            this.player.weapon.removeText();
            let oldItem = this.player.setWeapon(item as Weapon); //Item is now the player's old weapon
            if (oldItem == undefined)
                this.itemGoNext();
            else this.takeItem(oldItem, this.callNext);
        }
        else {
            this.currentItemSlot = fromSlot;
            if (!item.useItem()) this.itemGoNext(); //Items should return true if they have provided some form of sub-menu.
            //This is used for Reducto and GroPlus (which always present the player with a sub-menu)
            //and for the Kitsune Gift (which may show a sub-menu if the player has a full inventory)
            //				if (!item.hasSubMenu()) itemGoNext(); //Don't call itemGoNext if there's a sub menu, otherwise it would never be displayed
        }
    }

    private takeItemFull(itype: ItemType, showUseNow: boolean, source?: ItemSlotClass): void {
        this.outputText("There is no room for " + itype.longName + " in your inventory.  You may replace the contents of a pouch with " + itype.longName + " or abandon it.");
        this.menu();
        for (var x: number = 0; x < 5; x++) {
            if (this.player.itemSlots[x].unlocked)
                this.addButton(x, (this.player.itemSlots[x].itype.shortName + " x" + this.player.itemSlots[x].quantity), this.createCallBackFunction2(this.replaceItem, itype, x));
        }
        if (source != undefined) {
            this.currentItemSlot = source;
            this.addButton(7, "Put Back", this.createCallBackFunction2(this.returnItemToInventory, itype, false));
        }
        if (showUseNow && itype instanceof Useable) this.addButton(8, "Use Now", this.createCallBackFunction2(this.useItemNow, itype as Useable, source));
        this.addButton(9, "Abandon", this.callOnAbandon); //Does not doNext - immediately executes the callOnAbandon function
    }

    private useItemNow(item: Useable, source: ItemSlotClass): void {
        this.clearOutput();
        if (item.canUse()) { //If an item cannot be used then canUse should provide a description of why the item cannot be used
            this.useItem(item, source);
        }
        else {
            this.takeItemFull(item, false, source); //Give the player another chance to take this item
        }
    }

    private replaceItem(itype: ItemType, slotNum: number): void {
        this.clearOutput();
        if (this.player.itemSlots[slotNum].itype == itype) //If it is the same as what's in the slot...just throw away the new item
            this.outputText("You discard " + itype.longName + " from the stack to make room for the new one.");
        else { //If they are different...
            if (this.player.itemSlots[slotNum].quantity == 1) this.outputText("You throw away " + this.player.itemSlots[slotNum].itype.longName + " and replace it with " + itype.longName + ".");
            else this.outputText("You throw away " + this.player.itemSlots[slotNum].itype.longName + "(x" + this.player.itemSlots[slotNum].quantity + ") and replace it with " + itype.longName + ".");
            this.player.itemSlots[slotNum].setItemAndQty(itype, 1);
        }
        this.itemGoNext();
    }

    private unequipWeapon(): void {
        this.clearOutput();
        const otherItem = this.player.setWeapon(WeaponLib.FISTS);
        if (otherItem)
            this.takeItem(otherItem, this.inventoryMenu);
        else
        this.inventoryMenu();
    }

    /* Never called
            public  hasItemsInRacks(itype:ItemType, armor: boolean): boolean {
                if (armor) return itemTypeInStorage(gearStorage, 9, 18, itype);
                return itemTypeInStorage(gearStorage, 0, 9, itype);
            }
    */

    private getStorageItemNames(storage: ItemSlotClass[], startSlot: number = 0, endSlot?: number): string[] {
        var names: string[] = [];
        if (!endSlot) endSlot = storage.length

        for (let index = startSlot; index < endSlot; index++) {
            let slot = storage[index];
            if (slot.quantity > 0) {
                let name = Utils.capitalizeFirstWord(slot.itype.longName);
                if (slot.quantity > 1) {
                    name += " x" + slot.quantity;
                }
                names.push(name);
            }
        }
        
        return names;
    }

    private getArmorStashList(): string[] {
        return this.getStorageItemNames(this.gearStorage, 9, 18);
    }

    private getWeaponStashList(): string[] {
        return this.getStorageItemNames(this.gearStorage, 0, 9);
    }

    private getChestStashList(): string[] {
        return this.getStorageItemNames(this.itemStorage);
    }

    private armorRackDescription(): boolean {
        if (this.itemAnyInStorage(this.gearStorage, 9, 18)) {
            var itemList: any[] = [];
            for (var x: number = 9; x < 18; x++)
                if (this.gearStorage[x].quantity > 0) itemList[itemList.length] = this.gearStorage[x].itype.longName;
            this.outputText("  It currently holds " + Inventory.formatStringArray(itemList) + ".");
            return true;
        }
        return false;
    }

    private weaponRackDescription(): boolean {
        if (this.itemAnyInStorage(this.gearStorage, 0, 9)) {
            var itemList: any[] = [];
            for (var x: number = 0; x < 9; x++)
                if (this.gearStorage[x].quantity > 0) itemList[itemList.length] = this.gearStorage[x].itype.longName;
            this.outputText("  It currently holds " + Inventory.formatStringArray(itemList) + ".");
            return true;
        }
        return false;
    }

    private itemAnyInStorage(storage: any[], startSlot: number, endSlot: number): boolean {
        for (var x: number = startSlot; x < endSlot; x++) if (storage[x].quantity > 0) return true;
        return false;
    }

    private itemTypeInStorage(storage: any[], startSlot: number, endSlot: number, itype: ItemType): boolean {
        for (var x: number = startSlot; x < endSlot; x++) if (storage[x].quantity > 0 && storage[x].itype == itype) return true;
        return false;
    }

    private pickItemToTakeFromCampStorage(): void {
        this.callNext = this.pickItemToTakeFromCampStorage;
        this.pickItemToTakeFromStorage(this.itemStorage, 0, this.itemStorage.length, "storage", this.showChestStashMenu);
    }

    private pickItemToTakeFromArmorRack(): void {
        this.callNext = this.pickItemToTakeFromArmorRack;
        this.pickItemToTakeFromStorage(this.gearStorage, 9, 18, "rack", this.getArmorStashList);
    }

    private pickItemToTakeFromWeaponRack(): void {
        this.callNext = this.pickItemToTakeFromWeaponRack;
        this.pickItemToTakeFromStorage(this.gearStorage, 0, 9, "rack", this.getWeaponStashList);
    }

    private pickItemToTakeFromStorage(storage: any[], startSlot: number, endSlot: number, text: string, backFunction: Function): void {
        this.clearOutput(); //Selects an item from a gear slot. Rewritten so that it no longer needs to use numbered events
        this.hideUpDown();
        if (!this.itemAnyInStorage(storage, startSlot, endSlot)) { //If no items are left then return to the camp menu. Can only happen if the player removes the last item.
            backFunction();
            return;
        }
        this.outputText("What " + text + " slot do you wish to take an item from?");
        var button: number = 0;
        this.menu();
        for (var x: number = startSlot; x < endSlot; x++ , button++) {
            if (storage[x].quantity > 0) this.addButton(button, (storage[x].itype.shortName + " x" + storage[x].quantity), this.createCallBackFunction2(this.pickFrom, storage, x));
        }
        this.addButton(9, "Back", backFunction);
    }

    private pickFrom(storage: any[], slotNum: number): void {
        this.clearOutput();
        var itype: ItemType = storage[slotNum].itype;
        storage[slotNum].quantity--;
        this.inventory.takeItem(itype, this.callNext, this.callNext, storage[slotNum]);
    }

    private pickItemToPlaceInCampStorage(): void { this.pickItemToPlaceInStorage(this.placeInCampStorage, this.allAcceptable, "storage containers", false, this.showChestStashMenu); }

    private pickItemToPlaceInArmorRack(): void { this.pickItemToPlaceInStorage(this.placeInArmorRack, this.armorAcceptable, "armor rack", true, this.showArmorStashMenu); }

    private pickItemToPlaceInWeaponRack(): void { this.pickItemToPlaceInStorage(this.placeInWeaponRack, this.weaponAcceptable, "weapon rack", true, this.showWeaponStashMenu); }

    private allAcceptable(itype: ItemType): boolean { return true; }

    private armorAcceptable(itype: ItemType): boolean { return itype instanceof Armor; }

    private weaponAcceptable(itype: ItemType): boolean { return itype instanceof Weapon; }

    private pickItemToPlaceInStorage(placeInStorageFunction: any, typeAcceptableFunction: any, text: string, showEmptyWarning: boolean, backFunction: Function): void {
        this.clearOutput(); //Selects an item to place in a gear slot. Rewritten so that it no longer needs to use numbered events
        this.hideUpDown();
        this.outputText("What item slot do you wish to empty into your " + text + "?");
        this.menu();
        var foundItem: boolean = false;
        for (var x: number = 0; x < 5; x++) {
            if (this.player.itemSlots[x].unlocked && this.player.itemSlots[x].quantity > 0 && typeAcceptableFunction(this.player.itemSlots[x].itype)) {
                this.addButton(x, (this.player.itemSlots[x].itype.shortName + " x" + this.player.itemSlots[x].quantity), placeInStorageFunction, x);
                foundItem = true;
            }
        }
        if (showEmptyWarning && !foundItem) this.outputText("\n<b>You have no appropriate items to put in this rack.</b>");
        this.addButton(14, "Back", backFunction);
    }

    private placeInCampStorage(slotNum: number): void {
        this.placeIn(this.itemStorage, 0, this.itemStorage.length, slotNum);
        this.doNext(this.pickItemToPlaceInCampStorage);
    }

    private placeInArmorRack(slotNum: number): void {
        this.placeIn(this.gearStorage, 9, 18, slotNum);
        this.doNext(this.pickItemToPlaceInArmorRack);
    }

    private placeInWeaponRack(slotNum: number): void {
        this.placeIn(this.gearStorage, 0, 9, slotNum);
        this.doNext(this.pickItemToPlaceInWeaponRack);
    }

    private placeIn(storage: ItemSlotClass[], startSlot: number, endSlot: number, slotNum: number): void {
        this.clearOutput();
        var x: number;
        var temp: number;
        var itype: ItemType = this.player.itemSlots[slotNum].itype;
        var qty: number = this.player.itemSlots[slotNum].quantity;
        var orig: number = qty;
        this.player.itemSlots[slotNum].emptySlot();
        for (x = startSlot; x < endSlot && qty > 0; x++) { //Find any slots which already hold the item that is being stored
            if (storage[x].itype == itype && storage[x].quantity < storage[x].itype.maxStackSize) {
                temp = storage[x].itype.maxStackSize - storage[x].quantity;
                if (qty < temp) temp = qty;
                //this.outputText("You add " + itype.shortName + + " (x" + temp + ") into storage slot " + Inventory.num2Text(x + 1 - startSlot) + ".\n");
                this.outputText(`You add ${itype.longName} ${(qty> 1)? "(x" + temp + ") ": ""}into storage slot ${Inventory.num2Text(x + 1 - startSlot)}.\n`);
                storage[x].quantity += temp;
                qty -= temp;
                if (qty == 0) return;
            }
        }
        for (x = startSlot; x < endSlot && qty > 0; x++) { //Find any empty slots and put the item(s) there
            if (storage[x].quantity == 0) {
                storage[x].setItemAndQty(itype, qty);
                //this.outputText("You place " + qty + "x " + itype.shortName + " into storage slot " + Inventory.num2Text(x + 1 - startSlot) + ".\n");
                this.outputText(`You place ${itype.longName} ${(qty> 1)? "(x" + qty + ") ": ""}into storage slot ${Inventory.num2Text(x + 1 - startSlot)}.\n`);
                qty = 0;
                return;
            }
        }
        this.outputText("There is no room for " + (orig == qty ? "" : "the remaining ") + qty + "x " + itype.shortName + ".  You leave " + (qty > 1 ? "them" : "it") + " in your inventory.\n");
        this.player.itemSlots[slotNum].setItemAndQty(itype, qty);
    }
}

