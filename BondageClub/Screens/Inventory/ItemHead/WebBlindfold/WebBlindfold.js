"use strict";

var InventoryItemHeadWebBlindfoldOptions = [
	{
		Name: "Blindfold",
		Property: { Type: null, Difficulty: 0 },
	},
	{
		Name: "Cocoon",
		Property: {
			Type: "Cocoon",
			Difficulty: 30,
			Hide: ["HairFront", "HairBack", "Glasses", "Hat"],
			Block: ["ItemMouth", "ItemMouth2", "ItemMouth3", "ItemEars"],
			Effect: ["BlindHeavy", "Prone", "GagNormal"],
		},
	},
];

// Loads the item extension properties
function InventoryItemHeadWebBlindfoldLoad() {
	ExtendedItemLoad(InventoryItemHeadWebBlindfoldOptions, "WebBondageSelect");
}

function InventoryItemHeadWebBlindfoldDraw() {
	ExtendedItemDraw(InventoryItemHeadWebBlindfoldOptions, "WebBondage");
}

function InventoryItemHeadWebBlindfoldClick() {
	ExtendedItemClick(InventoryItemHeadWebBlindfoldOptions);
}

function InventoryItemHeadWebBlindfoldPublishAction(Option) {
	var C = CharacterGetCurrent();
	var msg = "HeadWebSet" + Option.Name;
	var Dictionary = [
		{ Tag: "SourceCharacter", Text: Player.Name, MemberNumber: Player.MemberNumber },
		{ Tag: "TargetCharacter", Text: C.Name, MemberNumber: C.MemberNumber },
	];
	ChatRoomPublishCustomAction(msg, true, Dictionary);
}
