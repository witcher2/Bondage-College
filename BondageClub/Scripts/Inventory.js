"use strict";

// Add a new item by group & name to character inventory
function InventoryAdd(C, NewItemName, NewItemGroup, Push) {

	// First, we check if the inventory already exists, exit if it's the case
	for (var I = 0; I < C.Inventory.length; I++)
		if ((C.Inventory[I].Name == NewItemName) && (C.Inventory[I].Group == NewItemGroup))
			return;

	// Searches to find the item asset in the current character assets family
	var NewItemAsset = null;
	for (var A = 0; A < Asset.length; A++)
		if ((Asset[A].Name == NewItemName) && (Asset[A].Group.Name == NewItemGroup) && (Asset[A].Group.Family == C.AssetFamily)) {
			NewItemAsset = Asset[A];
			break;
		}

	// Only add the item if we found the asset
	if (NewItemAsset != null) {
		
		// Creates the item and pushes it in the inventory queue
		var NewItem = {
			Name: NewItemName,
			Group: NewItemGroup,
			Asset: NewItemAsset
		}
		C.Inventory.push(NewItem);

		// Sends the new item to the server if it's for the current player
		if ((C.ID == 0) && ((Push == null) || Push))
			ServerPlayerInventorySync();

	}

}

// Deletes an item from the character inventory
function InventoryDelete(C, DelItemName, DelItemGroup, Push) {

	// First, we remove the item from the player inventory
	for (var I = 0; I < C.Inventory.length; I++)
		if ((C.Inventory[I].Name == DelItemName) && (C.Inventory[I].Group == DelItemGroup)) {
			C.Inventory.splice(I, 1);
			break;
		}

	// Next, we call the player account service to remove the item
	if ((C.ID == 0) && ((Push == null) || Push))
		ServerPlayerInventorySync();

}

// Loads the current inventory for a character
function InventoryLoad(C, Inventory) {

	// Add each items one by one from the server by name/group
	if (Inventory != null)
		for (var I = 0; I < Inventory.length; I++)
			InventoryAdd(C, Inventory[I].Name, Inventory[I].Group, false);

}

// Checks if the character has the inventory available
function InventoryAvailable(C, InventoryName, InventoryGroup) {
	for (var I = 0; I < C.Inventory.length; I++)
		if ((C.Inventory[I].Name == InventoryName) && (C.Inventory[I].Group == InventoryGroup))
			return true;
	return false;
}

// Returns TRUE if we can add the item, no other items must block that prerequisite
function InventoryAllow(C, Prerequisite, SetDialog) {

	// Torso items can only be blocked by clothes
	if (Prerequisite == null || Prerequisite == "") return true;
	var T = "";
	var curCloth = InventoryGet(C, "Cloth");
	if ((Prerequisite == "AccessTorso") && (curCloth != null) && !curCloth.Asset.Expose.includes("ItemTorso")) T = "RemoveClothesForItem";

	// Breast items can be blocked by clothes
	if ((Prerequisite == "AccessBreast") && (((curCloth != null) && !curCloth.Asset.Expose.includes("ItemBreast"))
			|| (InventoryGet(C, "Bra") != null && !InventoryGet(C, "Bra").Asset.Expose.includes("ItemBreast")))) T = "RemoveClothesForItem";

	// Vulva/Butt items can be blocked by clothes, panties and some socks
	if ((Prerequisite == "AccessVulva") && (((curCloth != null) && curCloth.Asset.Block != null && curCloth.Asset.Block.includes("ItemVulva"))
			|| (InventoryGet(C, "ClothLower") != null && !InventoryGet(C, "ClothLower").Asset.Expose.includes("ItemVulva"))
			|| (InventoryGet(C, "Panties") != null && !InventoryGet(C, "Panties").Asset.Expose.includes("ItemVulva"))
			|| (InventoryGet(C, "Socks") != null && (InventoryGet(C, "Socks").Asset.Block != null) && InventoryGet(C, "Socks").Asset.Block.includes("ItemVulva")))) T = "RemoveClothesForItem";

	// Prevent incompatible item combinations
	if (Prerequisite == "NotSuspended" && C.Pose.indexOf("Suspension") >= 0) T = "RemoveSuspensionForItem";
	if (Prerequisite == "NotKneeling" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "NotKneeling" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "NotChained" && InventoryGet(C, "ItemNeckAccessories") != null && InventoryGet(C, "ItemNeckAccessories").Asset.Name == "CollarChainLong") T = "RemoveChainForItem";
	if (Prerequisite == "Collared" && InventoryGet(C, "ItemNeck") == null) T = "MustCollaredFirst";
	if (Prerequisite == "CollaredNotSuspended" && (InventoryGet(C, "ItemNeck") == null || C.Pose.indexOf("Suspension") >= 0)) T = "MustCollaredFirstAndRemoveSuspension";
	if (Prerequisite == "LegsOpen" && C.Pose.indexOf("LegsClosed") >= 0) T = "LegsCannotOpen";

	// Toe Tied
	if (Prerequisite == "ToeTied" && (InventoryGet(C, "ItemFeet") != null) && (InventoryGet(C, "ItemFeet").Asset.Name == "SpreaderMetal")) T = "LegsCannotClose";
	if (Prerequisite == "ToeTied" && (InventoryGet(C, "ItemLegs") != null) && (InventoryGet(C, "ItemLegs").Asset.Name == "WoodenHorse")) T = "LegsCannotClose";
	if (Prerequisite == "ToeTied" && (InventoryGet(C, "ItemDevices") != null) && (InventoryGet(C, "ItemDevices").Asset.Name == "OneBarPrison")) T = "LegsCannotClose";
	if (Prerequisite == "ToeTied" && (InventoryGet(C, "ItemDevices") != null) && (InventoryGet(C, "ItemDevices").Asset.Name == "SaddleStand")) T = "LegsCannotClose";

	// Display Frame
	if (Prerequisite == "DisplayFrame" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "DisplayFrame" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "DisplayFrame" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "DisplayFrame" && (InventoryGet(C, "ItemArms") != null || InventoryGet(C, "ItemLegs") != null || InventoryGet(C, "ItemFeet") != null || InventoryGet(C, "ItemBoots") != null)) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "DisplayFrame" && (InventoryGet(C, "Cloth") != null || InventoryGet(C, "ClothLower") != null || InventoryGet(C, "Shoes") != null)) T = "RemoveClothesForItem";

	// Sybian
	if (Prerequisite == "Sybian" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Sybian" && C.Pose.indexOf("LegsClosed") >= 0) T = "LegsCannotOpen";
	if (Prerequisite == "Sybian" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Sybian" && C.Effect.indexOf("Shackled") >= 0) T = "RemoveShacklesFirst";
	if (Prerequisite == "Sybian" && C.Effect.indexOf("Chaste") >= 0) T = "RemoveChastityFirst";
	if ((Prerequisite == "Sybian") && (((curCloth != null) && curCloth.Asset.Block != null && curCloth.Asset.Block.includes("ItemVulva"))
		|| (InventoryGet(C, "ClothLower") != null && !InventoryGet(C, "ClothLower").Asset.Expose.includes("ItemVulva"))
		|| (InventoryGet(C, "Panties") != null && !InventoryGet(C, "Panties").Asset.Expose.includes("ItemVulva"))
		|| (InventoryGet(C, "Socks") != null && (InventoryGet(C, "Socks").Asset.Block != null) && InventoryGet(C, "Socks").Asset.Block.includes("ItemVulva")))) T = "RemoveClothesForItem";

	// One Bar Prison
	if (Prerequisite == "OBP" && C.Pose.indexOf("LegsClosed") >= 0) T = "LegsCannotOpen";
	if (Prerequisite == "OBP" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "OBP" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "OBP" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "OBP" &&  C.Effect.indexOf("Chaste") >= 0) T = "RemoveChastityFirst";
	if ((Prerequisite == "OBP") && (((curCloth != null) && curCloth.Asset.Block != null && curCloth.Asset.Block.includes("ItemVulva"))
		|| (InventoryGet(C, "ClothLower") != null && !InventoryGet(C, "ClothLower").Asset.Expose.includes("ItemVulva"))
		|| (InventoryGet(C, "Panties") != null && !InventoryGet(C, "Panties").Asset.Expose.includes("ItemVulva"))
		|| (InventoryGet(C, "Socks") != null && (InventoryGet(C, "Socks").Asset.Block != null) && InventoryGet(C, "Socks").Asset.Block.includes("ItemVulva")))) T = "RemoveClothesForItem";

	// Shackles and Manacles
	if (Prerequisite == "Shackles" && InventoryGet(C, "ItemFeet") != null) T = "MustFreeFeetFirst";
	if (Prerequisite == "Shackles" && C.Effect.indexOf("Mounted") >= 0) T = "CannotBeUsedWhenMounted";
	if (Prerequisite == "Shackles" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Shackles" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Shackles" && C.Pose.indexOf("KneelingSpread") >= 0) T = "TheyMustBeStandingFirst";

	// Saddle stand
	if (Prerequisite == "LegsOpen1" && C.Pose.indexOf("LegsClosed") >= 0) T = "LegsCannotOpen";
	if (Prerequisite == "LegsOpen1" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "LegsOpen1" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "LegsOpen1" && C.Pose.indexOf("KneelingSpread") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "LegsOpen1" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "LegsOpen1" && C.Effect.indexOf("Shackled") >= 0) T = "RemoveShacklesFirst";

	// Wooden horse blocks
	if (Prerequisite == "Horse" && C.Pose.indexOf("Kneel") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Horse" && C.Pose.indexOf("LegsClosed") >= 0) T = "LegsCannotOpen";
	if (Prerequisite == "Horse" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "Horse" && C.Effect.indexOf("Shackled") >= 0) T = "RemoveShacklesFirst";
	if (Prerequisite == "CollaredNotSuspended1" && (InventoryGet(C, "ItemNeck") == null || C.Pose.indexOf("Suspension") >= 0)) T = "MustCollaredFirstAndRemoveSuspension1";
	if (Prerequisite == "CollaredNotSuspended1" && (InventoryGet(C, "ItemNeck") == null || C.Pose.indexOf("Horse") >= 0)) T = "MustCollaredFirstAndRemoveSuspension1";
	if (Prerequisite == "CollaredNotSuspended1" && (InventoryGet(C, "ItemNeck") == null || C.Effect.indexOf("Mounted") >= 0)) T = "MustCollaredFirstAndRemoveSuspension1";
	if (Prerequisite == "NotSuspendedOrHorsed" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "NotSuspendedOrHorsed" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "NotSuspendedOrHorsed" && C.Pose.indexOf("KneelingSpread") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "NotSuspendedOrHorsed" && (InventoryGet(C, "ItemFeet") != null) && (InventoryGet(C, "ItemFeet").Asset.Name == "SpreaderMetal")) T = "CannotBeUsedWithFeetSpreader";
	if (Prerequisite == "NotSuspendedOrHorsed" && C.Effect.indexOf("Mounted") >= 0) T = "CannotBeUsedWhenMounted";
	
	//Layered Gags, Prevent gags marked with "GagUnique" and "GagCorset" from being equipped over gags with "GagFlat"
	if (Prerequisite == "GagUnique" && (InventoryGet(C, "ItemMouth") != null) && InventoryGet(C, "ItemMouth").Asset.Prerequisite == "GagFlat") T = "CannotBeUsedOverFlatGag";
	if (Prerequisite == "GagUnique" && (InventoryGet(C, "ItemMouth2") != null) && InventoryGet(C, "ItemMouth2").Asset.Prerequisite == "GagFlat") T = "CannotBeUsedOverFlatGag";
	if (Prerequisite == "GagUnique" && (InventoryGet(C, "ItemMouth") != null) && InventoryGet(C, "ItemMouth").Asset.Prerequisite == "GagCorset") T = "CannotBeUsedOverFlatGag";
	if (Prerequisite == "GagUnique" && (InventoryGet(C, "ItemMouth2") != null) && InventoryGet(C, "ItemMouth2").Asset.Prerequisite == "GagCorset") T = "CannotBeUsedOverFlatGag";

	// Burlap sack or body bag
	if (Prerequisite == "CanBeBagged" && C.Pose.indexOf("Suspension") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "CanBeBagged" && C.Pose.indexOf("Horse") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "CanBeBagged" && C.Pose.indexOf("KneelingSpread") >= 0) T = "TheyMustBeStandingFirst";
	if (Prerequisite == "CanBeBagged" && (InventoryGet(C, "ItemFeet") != null) && (InventoryGet(C, "ItemFeet").Asset.Name == "SpreaderMetal")) T = "CannotBeUsedWithFeetSpreader";
	if (Prerequisite == "CanBeBagged" && C.Effect.indexOf("Mounted") >= 0) T = "CannotBeUsedWhenMounted";
	if (Prerequisite == "CanBeBagged" && C.Pose.indexOf("Yoked") >= 0) T = "CannotBeUsedWhenYoked";
	
	// If no error text was found, we return TRUE, if a text was found, we can show it in the dialog
	if (T != "" && (SetDialog == null || SetDialog)) DialogSetText(T);
	return (T == "");

}

// Gets the current item worn a specific spot
function InventoryGet(C, AssetGroup) {
	for (var A = 0; A < C.Appearance.length; A++)
		if ((C.Appearance[A].Asset != null) && (C.Appearance[A].Asset.Group.Family == C.AssetFamily) && (C.Appearance[A].Asset.Group.Name == AssetGroup))
			return C.Appearance[A];
	return null;
}

// Makes the character wear an item, color can be undefined
function InventoryWear(C, AssetName, AssetGroup, ItemColor, Difficulty) {
	for (var A = 0; A < Asset.length; A++)
		if ((Asset[A].Name == AssetName) && (Asset[A].Group.Name == AssetGroup)) {
			CharacterAppearanceSetItem(C, AssetGroup, Asset[A], ((ItemColor == null) || (ItemColor == "Default")) ? AssetGet(C.AssetFamily, AssetGroup, AssetName).DefaultColor : ItemColor, Difficulty);
			InventoryExpressionTrigger(C, InventoryGet(C, AssetGroup));
			return;
		}
}

// Sets the difficulty to remove an item
function InventorySetDifficulty(C, AssetGroup, Difficulty) {
	if ((Difficulty >= 0) && (Difficulty <= 100))
		for (var A = 0; A < C.Appearance.length; A++)
			if ((C.Appearance[A].Asset != null) && (C.Appearance[A].Asset.Group.Name == AssetGroup))
				C.Appearance[A].Difficulty = Difficulty;
	if ((CurrentModule != "Character") && (C.ID == 0)) ServerPlayerAppearanceSync();
}

// Returns TRUE if there's already a locked item at a given position
function InventoryLocked(C, AssetGroup) {
	var I = InventoryGet(C, AssetGroup);
	return ((I != null) && InventoryItemHasEffect(I, "Lock"));
}

// Makes the character wear a random item from a group
function InventoryWearRandom(C, GroupName, Difficulty) {
	if (!InventoryLocked(C, GroupName)) {

		// Finds the asset group and make sure it's not blocked
		for (var A = 0; A < AssetGroup.length; A++)
			if (AssetGroup[A].Name == GroupName) {
				var FG = C.FocusGroup;
				C.FocusGroup = AssetGroup[A];
				var IsBlocked = InventoryGroupIsBlocked(C);
				C.FocusGroup = FG;
				if (IsBlocked) return;
				break;
			}

		// Builds a list of all possible items and use one
		var List = [];
		for (var A = 0; A < Asset.length; A++)
			if ((Asset[A].Group.Name == GroupName) && Asset[A].Wear && Asset[A].Enable && Asset[A].Random && InventoryAllow(C, Asset[A].Prerequisite, false))
				List.push(Asset[A]);
		if (List.length == 0) return;
		var RandomAsset = List[Math.floor(Math.random() * List.length)];
		CharacterAppearanceSetItem(C, GroupName, RandomAsset, RandomAsset.DefaultColor, Difficulty);
		CharacterRefresh(C);

	}
}

// Removes a specific item from the player appearance
function InventoryRemove(C, AssetGroup) {
	for (var E = 0; E < C.Appearance.length; E++)
		if (C.Appearance[E].Asset.Group.Name == AssetGroup) {
			C.Appearance.splice(E, 1);
			E--;
		}
	CharacterRefresh(C);
}

// Returns TRUE if the focused group for a character is blocked and cannot be used
function InventoryGroupIsBlocked(C) {

	// Items can block each other (hoods blocks gags, belts blocks eggs, etc.)
	for (var E = 0; E < C.Appearance.length; E++) {
		if (!C.Appearance[E].Asset.Group.Clothing && (C.Appearance[E].Asset.Block != null) && (C.Appearance[E].Asset.Block.includes(C.FocusGroup.Name))) return true;
		if (!C.Appearance[E].Asset.Group.Clothing && (C.Appearance[E].Property != null) && (C.Appearance[E].Property.Block != null) && (C.Appearance[E].Property.Block.indexOf(C.FocusGroup.Name) >= 0)) return true;
	}

	// If another character is enclosed, items other than the enclosing one cannot be used
	if ((C.ID != 0) && C.IsEnclose()) {
		for (var E = 0; E < C.Appearance.length; E++)
			if ((C.Appearance[E].Asset.Group.Name == C.FocusGroup.Name) && InventoryItemHasEffect(C.Appearance[E], "Enclose"))
				return false;
		return true;
	}

	// If the player is enclosed, all groups for another character are blocked
	if ((C.ID != 0) && Player.IsEnclose()) return true;

	// Nothing is preventing the group from being used
	return false;

}

// Returns TRUE if the item has a specific effect.
function InventoryItemHasEffect(Item, Effect, CheckProperties) {
	if (!Item) return null;

	// If no effect is specified, we simply check if the item has any effect
	if (!Effect) {
		if ((Item.Asset && Item.Asset.Effect) || (CheckProperties && Item.Property && Item.Property.Effect)) return true;
		else return false;
	}
	else {
		if ((Item.Asset && Item.Asset.Effect && Item.Asset.Effect.indexOf(Effect) >= 0) || (CheckProperties && Item.Property && Item.Property.Effect && Item.Property.Effect.indexOf(Effect) >= 0)) return true;
		else return false;
	}
}

// Check if we must trigger an expression for the character after an item is used/applied
function InventoryExpressionTrigger(C, Item) {
	if ((Item != null) && (Item.Asset != null) && (Item.Asset.DynamicExpressionTrigger() != null))
		for (var E = 0; E < Item.Asset.DynamicExpressionTrigger().length; E++)
			if ((InventoryGet(C, Item.Asset.DynamicExpressionTrigger()[E].Group) == null) || (InventoryGet(C, Item.Asset.DynamicExpressionTrigger()[E].Group).Property == null) || (InventoryGet(C, Item.Asset.DynamicExpressionTrigger()[E].Group).Property.Expression == null)) {
				CharacterSetFacialExpression(C, Item.Asset.DynamicExpressionTrigger()[E].Group, Item.Asset.DynamicExpressionTrigger()[E].Name);
				TimerInventoryRemoveSet(C, Item.Asset.DynamicExpressionTrigger()[E].Group, Item.Asset.DynamicExpressionTrigger()[E].Timer);
			}
}

// Returns the item that locks another item
function InventoryGetLock(Item) {
	if ((Item == null) || (Item.Property == null) || (Item.Property.LockedBy == null)) return null;
	for (var A = 0; A < Asset.length; A++)
		if (Asset[A].IsLock && (Asset[A].Name == Item.Property.LockedBy))
			return { Asset: Asset[A] };
	return null;
}

// Returns TRUE if the item has an OwnerOnly flag, such as the owner padlock
function InventoryOwnerOnlyItem(Item) {
	if (Item == null) return false;
	if (Item.Asset.OwnerOnly) return true;
	if (Item.Asset.Group.Category == "Item") {
		var Lock = InventoryGetLock(Item);
		if ((Lock != null) && (Lock.Asset.OwnerOnly != null) && Lock.Asset.OwnerOnly) return true;
	}
	return false;
}

// Returns TRUE if the character is wearing at least one restraint that's locked with an extra lock
function InventoryCharacterHasLockedRestraint(C) {
	if (C.Appearance != null)
		for (var A = 0; A < C.Appearance.length; A++)
			if (C.Appearance[A].Asset.IsRestraint && (InventoryGetLock(C.Appearance[A]) != null))
				return true;
	return false;
}

// Returns TRUE if the character is wearing at least one item that's a restraint with a OwnerOnly flag, such as the owner padlock
function InventoryCharacterHasOwnerOnlyRestraint(C) {
	if ((C.Ownership == null) || (C.Ownership.MemberNumber == null) || (C.Ownership.MemberNumber == "")) return false;
	if (C.Appearance != null)
		for (var A = 0; A < C.Appearance.length; A++)
			if (C.Appearance[A].Asset.IsRestraint && InventoryOwnerOnlyItem(C.Appearance[A]))
				return true;
	return false;
}

// Returns TRUE if at least one item on the character can be locked
function InventoryHasLockableItems(C) {
	for (var I = 0; I < C.Appearance.length; I++)
		if (C.Appearance[I].Asset.AllowLock && (InventoryGetLock(C.Appearance[I]) == null))
			return true;
	return false;
}

// Applies a lock to an inventory item
function InventoryLock(C, Item, Lock, MemberNumber) {
	if (typeof Item === 'string') Item = InventoryGet(C, Item);
	if (typeof Lock === 'string') Lock = { Asset: AssetGet(C.AssetFamily, "ItemMisc", Lock) };
	if (Item && Lock && Item.Asset.AllowLock) {
		if (Item.Property == null) Item.Property = {};
		if (Item.Property.Effect == null) Item.Property.Effect = [];
		if (Item.Property.Effect.indexOf("Lock") < 0) Item.Property.Effect.push("Lock");
		Item.Property.LockedBy = Lock.Asset.Name;
		if (MemberNumber != null) Item.Property.LockMemberNumber = MemberNumber;
		if (Lock.Asset.RemoveTimer > 0) TimerInventoryRemoveSet(C, Item.Asset.Group.Name, Lock.Asset.RemoveTimer);
		CharacterRefresh(C);
	}
}

// Applies a random lock on an item
function InventoryLockRandom(C, Item, FromOwner) {
	if (Item.Asset.AllowLock) {
		var List = [];
		for (var A = 0; A < Asset.length; A++)
			if (Asset[A].IsLock && (FromOwner || !Asset[A].OwnerOnly))
				List.push(Asset[A]);
		if (List.length > 0) {
			var Lock = { Asset: List[Math.floor(Math.random() * List.length)] };
			InventoryLock(C, Item, Lock);
		}
	}
}

// Applies random locks on each character items that can be locked
function InventoryFullLockRandom(C, FromOwner) {
	for (var I = 0; I < C.Appearance.length; I++)
		if (C.Appearance[I].Asset.AllowLock && (InventoryGetLock(C.Appearance[I]) == null))
			InventoryLockRandom(C, C.Appearance[I], FromOwner);
}

// Removes all common keys from the player inventory
function InventoryConfiscateKey() {
	InventoryDelete(Player, "MetalCuffsKey", "ItemMisc");
	InventoryDelete(Player, "MetalPadlockKey", "ItemMisc");
	InventoryDelete(Player, "IntricatePadlockKey", "ItemMisc");
}

// Removes the remotes of the vibrators from the player inventory
function InventoryConfiscateRemote() {
	InventoryDelete(Player, "VibratorRemote", "ItemVulva");
	InventoryDelete(Player, "VibratorRemote", "ItemNipples");
}

// returns TRUE if the item is worn
function InventoryIsWorn(C, AssetGroup, AssetName){
	return C && C.Appearance && C.Appearance.some(Item => Item.Asset.Group.Name == AssetGroup && Item.Asset.Name == AssetName);
} 
