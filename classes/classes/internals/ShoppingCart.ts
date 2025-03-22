import { BaseContent } from "../BaseContent";
import { ItemType } from "../ItemType";
import { Utils } from "./Utils";

export class ShoppingCart extends BaseContent {

    public static confirmBuyMulti(returnFunc:Function, shopKeep:String, priceRate:number, itype:ItemType, descString:string, onBuyString:string="\n", currentQuantity:number=1):void {
        const utils = new ShoppingCart();
        
        utils.clearOutput();
    
        var costPerItem:number = itype.value * priceRate;
        var wallet:number = utils.player.gems;
    
        var roomLeftInBag:number = utils.inventory.roomForItem(itype);
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
        utils.outputText("Currently buying: " + itype.longName + "\n");
        utils.outputText("Maximum amount: " + maxQuanity + "\n");
        utils.outputText("Quanity: " + currentQuantity + "\n");
        if (maxBuy != 0) {
            utils.outputText("Cost: " + String(costPerItem * currentQuantity) + " " + paymentMethod + "\n");
        } else {
            utils.outputText("This item costs " + String(costPerItem) + " " + paymentMethod + ".\n");
            utils.outputText("You need " + String(costPerItem - wallet) + " more " + paymentMethod + " to buy this item.\n");
        }
    
        utils.menu();
        utils.addButton(0, "Subtract 1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, currentQuantity - 1))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(1, "Add 1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, currentQuantity + 1))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
        utils.addButton(5, "Subtract 5", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, currentQuantity - 5))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(6, "Add 5", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, currentQuantity + 5))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
    
        utils.addButton(4, "1", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, 1))
            .disableIf(currentQuantity <= 1, "Minimum Quantity reached");
        utils.addButton(9, "Max", Utils.curry(ShoppingCart.confirmBuyMulti,returnFunc, shopKeep, priceRate, itype, descString, onBuyString, maxQuanity))
            .disableIf(currentQuantity == maxQuanity, "Maximum Quantity reached");
    
        utils.addButton(13, "Buy", Utils.curry(ShoppingCart.confirmPurchase,returnFunc,shopKeep,priceRate,itype,descString, onBuyString, currentQuantity))
            .disableIf(roomLeftInBag == 0, "You have no space left in your bag")
            .disableIf(maxBuy == 0, "You do not have enough to buy this item");
        utils.addButton(14, "Return", returnFunc);
    }

    private static confirmPurchase(returnFunc:Function, shopKeep:string, priceRate:number, itype:ItemType, descString:string, onBuy:string, currentQuantity:number=1): void {
        const utils = new ShoppingCart();

        utils.clearOutput();
        utils.outputText("Are you sure you want to buy " + currentQuantity + " of " + itype.longName + "?\n");
        utils.doYesNo(Utils.curry(ShoppingCart.debitItemMulti, returnFunc, shopKeep, priceRate, itype, onBuy, currentQuantity),
            Utils.curry(ShoppingCart.confirmBuyMulti, returnFunc, shopKeep, priceRate, itype, descString, onBuy, currentQuantity));
    }

    private static debitItemMulti(returnFunc:Function, shopKeep:string, priceRate:number, itype:ItemType, onBuy:string, currentQuantity:number=1): void {
        const utils = new ShoppingCart();
        
        var wallet:number;
        var costPerItem:number;
        var debitFunction:Function;
        var paymentMethod:string = "gems";

        wallet = utils.player.gems;
        costPerItem = itype.value * priceRate;
        debitFunction = function (cost:number):void {
            utils.player.gems -= cost;
        };
        

        var value:number = costPerItem * currentQuantity;

        if (wallet < value) {
            utils.clearOutput();
            utils.outputText("\n\n"+shopKeep+" shakes their head, indicating you need " + String(value - wallet) + " more " + paymentMethod + " to purchase this item.");
            utils.doNext(returnFunc);
        } else {
            debitFunction(value);
            utils.outputText(onBuy);
            var amountDeposited:number = utils.inventory.tryToAddMultipleItems(itype, currentQuantity);
            utils.outputText("You place " + amountDeposited + " of them in your bag, leaving you with " + utils.player.itemCount(itype) + " of them.");

            if(amountDeposited < currentQuantity) {
                var amountToRefund:number = (currentQuantity - amountDeposited) * costPerItem;
                debitFunction(-amountToRefund);
            }
            utils.doNext(returnFunc);
            utils.statScreenRefresh();
        }
    }
}