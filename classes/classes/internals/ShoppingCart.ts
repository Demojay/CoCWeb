import { BaseContent } from "../BaseContent";
import { ItemType } from "../ItemType";
import { Utils } from "./Utils";

export class ShoppingCart extends BaseContent {

    /**
     * Generic function for allowing the purchase of an item multiple times. Limits the amount that can be purchased to the current inventory size.
     * @param returnFunc Function that called once an item is purchased, or if the purchase is cancelled
     * @param shopKeep Name of the shopkeeper who is selling the item
     * @param iType The item being sold
     * @param descString The description and speech shown to the player while buying the item
     * @param onBuyCallback Callback performed once the player has purchased the item. If empty, will default to telling the player how many of the item has been brought,
     * and how many they have in their inventory.
     * @param overrideCostPerItem Optional overrinding of the item's value to use as a single item's price
     * @param currentQuantity Internal parameter used to denote how many of the item is currently being brought by the player. Used recursively within the function only.
     */
    public static confirmBuyMulti(returnFunc:Function, shopKeep:String, iType:ItemType, descString:string, 
        onBuyCallback?: (iType: ItemType, amountBought: number, pricePaid:number) => void, overrideCostPerItem:number = -1, currentQuantity:number=1):void {
        const utils = new ShoppingCart();
        
        utils.clearOutput();
    
        var costPerItem:number = overrideCostPerItem > -1? overrideCostPerItem: iType.value;
        var wallet:number = utils.player.gems;
    
        var roomLeftInBag:number = utils.inventory.roomForItem(iType);
        var maxBuy:number = Math.floor(wallet / costPerItem);
        var maxQuanity:number = Math.min(roomLeftInBag, maxBuy);
        var paymentMethod:String =  "gems";
        
    
        if (currentQuantity < 1) {
            currentQuantity = 1;
        }
        if (currentQuantity > maxQuanity){
            currentQuantity = maxQuanity;
        }
    
        utils.outputText(descString);
        utils.outputText("\n\n");
        utils.outputText("Currently buying: " + Utils.capitalizeFirstWord(iType.longName) + "\n");
        utils.outputText("Maximum amount: " + maxQuanity + "\n");
        utils.outputText("Quanity: " + currentQuantity + "\n");
        if (maxBuy != 0) {
            utils.outputText("Cost: " + String(costPerItem * currentQuantity) + " " + paymentMethod + "\n");
        } else {
            utils.outputText("This item costs " + String(costPerItem) + " " + paymentMethod + ".\n");
            utils.outputText("You need " + String(costPerItem - wallet) + " more " + paymentMethod + " to buy this item.\n");
        }
    
        utils.menu();
        utils.addButton(0, "Subtract 1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity - 1))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(1, "Add 1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity + 1))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
        utils.addButton(5, "Subtract 5", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity - 5))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(6, "Add 5", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity + 5))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
    
        utils.addButton(4, "1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, 1))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(9, "Max", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, maxQuanity))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
    
        utils.addButton(13, "Buy", Utils.curry(ShoppingCart.confirmPurchase,returnFunc,shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity))
            .disableIf(roomLeftInBag == 0, "You have no space left in your bag")
            .disableIf(maxBuy == 0, "You do not have enough to buy this item");
        utils.addButton(14, "Return", returnFunc);
    }

    /**
     * Confirms to the player whether they want to buy the amount of the item they have specified in the "confirmBuyMutli" function
     * @param returnFunc Function that called once an item is purchased, or if the purchase is cancelled
     * @param shopKeep Name of the shopkeeper who is selling the item
     * @param iType The item being sold
     * @param descString The description and speech shown to the player while buying the item
     * @param onBuyCallback Callback performed once the player has purchased the item. If empty, will default to telling the player how many of the item has been brought,
     * and how many they have in their inventory.
     * @param overrideCostPerItem Optional overrinding of the item's value to use as a single item's price
     * @param currentQuantity Internal parameter used to denote how many of the item is currently being brought by the player. Used recursively within the function only. 
     */
    private static confirmPurchase(returnFunc:Function, shopKeep:string, iType:ItemType, descString:string, 
        onBuyCallback?:(iType: ItemType, amountBought: number, pricePaid:number) => void, overrideCostPerItem:number = -1, currentQuantity:number=1): void {
        const utils = new ShoppingCart();

        utils.clearOutput();
        utils.outputText("Are you sure you want to buy " + currentQuantity + " of " + iType.longName + "?\n");
        utils.doYesNo(Utils.curry(ShoppingCart.debitItemMulti, returnFunc, shopKeep, iType, onBuyCallback, overrideCostPerItem, currentQuantity),
            Utils.curry(ShoppingCart.confirmBuyMulti, returnFunc, shopKeep, iType, descString, onBuyCallback, overrideCostPerItem, currentQuantity));
    }

    /**
     * Internal function for debiting the cost of the requested items from the player, adding them to the inventory and executing the onBuyCallback function. The return function
     * is executed at the end.
     * @param returnFunc Function that called once an item is purchased, or if the purchase is cancelled
     * @param shopKeep Name of the shopkeeper who is selling the item
     * @param iType The item being sold
     * @param descString The description and speech shown to the player while buying the item
     * @param onBuyCallback Callback performed once the player has purchased the item. If empty, will default to telling the player how many of the item has been brought,
     * and how many they have in their inventory.
     * @param overrideCostPerItem Optional overrinding of the item's value to use as a single item's price
     * @param currentQuantity Internal parameter used to denote how many of the item is currently being brought by the player. Used recursively within the function only.
     */
    private static debitItemMulti(returnFunc:Function, shopKeep:string, iType:ItemType, 
        onBuyCallback?:(iType: ItemType, amountBought: number, pricePaid:number) => void, overrideCostPerItem:number = -1, currentQuantity:number=1): void {

        const utils = new ShoppingCart();
        if (!onBuyCallback) onBuyCallback = ShoppingCart._defaultOnBuyCallback;
        
        var wallet:number;
        var costPerItem:number;
        var debitFunction:Function;
        var paymentMethod:string = "gems";

        wallet = utils.player.gems;
        costPerItem = overrideCostPerItem > -1? overrideCostPerItem: iType.value;
        debitFunction = function (cost:number):void {
            utils.player.gems -= cost;
        };
        

        var value:number = costPerItem * currentQuantity;

        if (wallet < value) {
            utils.clearOutput();
            utils.outputText("\n\n"+shopKeep+" shakes their head, indicating you need " + String(value - wallet) + " more " + paymentMethod + " to purchase this item.");
            utils.doNext(returnFunc);
        } else {           
            var amountDeposited:number = utils.inventory.tryToAddMultipleItems(iType, currentQuantity);
            debitFunction(value);
            if(amountDeposited < currentQuantity) {
                var amountToRefund:number = (currentQuantity - amountDeposited) * costPerItem;
                debitFunction(-amountToRefund);
            }

            onBuyCallback(iType, amountDeposited, costPerItem * amountDeposited);

            utils.doNext(returnFunc);
        }
        utils.statScreenRefresh();
    }

    private static _defaultOnBuyCallback(iType: ItemType, amountBought: number, pricePaid:number) {
        const utils: ShoppingCart = new ShoppingCart();
        utils.outputText("\n");
        utils.outputText("You place " + amountBought + " of them in your bag, leaving you with " + utils.player.itemCount(iType) + " of them.");
    }
}