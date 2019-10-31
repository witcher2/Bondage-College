"use strict";
var ChatAdminBackground = "Sheet";
var ChatAdminMessage = "";
var ChatAdminPrivate = false;
var ChatAdminBackground = "";
var ChatAdminBackgroundIndex = 0;
var ChatAdminBackgroundSelect = "";
var ChatAdminPrivate = false;
var ChatAdminLocked = false;

// When the chat admin screens loads
function ChatAdminLoad() {

	// If the current room background isn't valid, we pick the first one
	ChatAdminBackground = ChatRoomData.Background;
	if (ChatCreateBackgroundList.indexOf(ChatAdminBackgroundSelect) < 0) {
		ChatAdminBackgroundIndex = 0;
		ChatAdminBackgroundSelect = ChatCreateBackgroundList[0];
		ChatAdminBackground = ChatAdminBackgroundSelect + "Dark";
	}

	// Prepares the controls to edit a room
	ElementCreateInput("InputName", "text", ChatRoomData.Name, "20");
	ElementCreateTextArea("InputDescription");
	document.getElementById("InputDescription").setAttribute("maxLength", 100);
	document.getElementById("InputDescription").setAttribute("autocomplete", "off");
	ElementCreateTextArea("InputAdminList");
	document.getElementById("InputAdminList").setAttribute("maxLength", 250);
	document.getElementById("InputAdminList").setAttribute("autocomplete", "off");
	ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomData.Admin));
	ElementCreateTextArea("InputBanList");
	document.getElementById("InputBanList").setAttribute("maxLength", 250);
	document.getElementById("InputBanList").setAttribute("autocomplete", "off");
	ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomData.Ban));
	ElementValue("InputDescription", ChatRoomData.Description);
	ElementCreateInput("InputSize", "text", "10", "2");
	ElementValue("InputSize", ChatRoomData.Limit);
	ChatAdminMessage = "";
	ChatAdminPrivate = ChatRoomData.Private;
	ChatAdminLocked = ChatRoomData.Locked;

	// If the player isn't an admin, we disable the inputs
	if (!ChatRoomPlayerIsAdmin()) {
		document.getElementById("InputName").setAttribute("disabled", "disabled");
		document.getElementById("InputDescription").setAttribute("disabled", "disabled");
		document.getElementById("InputAdminList").setAttribute("disabled", "disabled");
		document.getElementById("InputBanList").setAttribute("disabled", "disabled");
		document.getElementById("InputSize").setAttribute("disabled", "disabled");
	}

}

// When the chat Admin screen runs
function ChatAdminRun() {

	// Draw the main controls
	if (ChatAdminMessage == "") ChatAdminMessage = "EnterRoomInfo";
	DrawText(TextGet(ChatAdminMessage), 1000, 60, "Black", "Gray");
	DrawText(TextGet("RoomName"), 320, 150, "Black", "Gray");
	ElementPosition("InputName", 320, 210, 450);

	// Background selection
	DrawImageResize("Backgrounds/" + ChatAdminBackground + ".jpg", 1450, 100, 450, 300);
	DrawText(TextGet("RoomBackground"), 1650, 420, "Black", "Gray");
	DrawBackNextButton(1500, 450, 350, 65, ChatAdminBackgroundSelect, "White", null,
		() => (ChatAdminBackgroundIndex == 0) ? ChatCreateBackgroundList[ChatCreateBackgroundList.length - 1] : ChatCreateBackgroundList[ChatAdminBackgroundIndex - 1],
		() => (ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length - 1) ? ChatCreateBackgroundList[0] : ChatCreateBackgroundList[ChatAdminBackgroundIndex + 1]);

	// Description, room size, admin and ban lists
	DrawText(TextGet("RoomDescription"), 320, 320, "Black", "Gray");
	ElementPosition("InputDescription", 320, 480, 450, 250);
	DrawText(TextGet("RoomBanList"), 1000, 150, "Black", "Gray");
	ElementPosition("InputBanList", 1000, 310, 450, 250);
	DrawText(TextGet("RoomAdminList"), 1000, 500, "Black", "Gray");
	ElementPosition("InputAdminList", 1000, 660, 450, 250);
	DrawText(TextGet("RoomSize"), 220, 700, "Black", "Gray");
	ElementPosition("InputSize", 470, 700, 150);

	// Private and Locked check boxes
	DrawText(TextGet("RoomPrivate"), 1710, 640, "Black", "Gray");
	DrawButton(1810, 590, 64, 64, "", "White", ChatAdminPrivate ? "Icons/Checked.png" : "");
	DrawText(TextGet("RoomLocked"), 1710, 750, "Black", "Gray");
	DrawButton(1810, 700, 64, 64, "", "White", ChatAdminLocked ? "Icons/Checked.png" : "");
	
	// Save & Cancel/Exit buttons + help text
	if (ChatRoomPlayerIsAdmin()) DrawButton(200, 840, 300, 65, TextGet("Save"), "White");
	DrawButton(1600, 840, 300, 65, TextGet(ChatRoomPlayerIsAdmin() ? "Cancel" : "Exit"), "White");
	DrawText(TextGet("ListDesciption"), 1000, 840, "Black", "Gray");
	DrawText(TextGet("ListExample"), 1000, 900, "Black", "Gray");

}

// When the player clicks in the chat Admin screen
function ChatAdminClick() {

	// When the user cancels/exits
	if ((MouseX >= 1600) && (MouseX < 1900) && (MouseY >= 840) && (MouseY < 905)) ChatAdminExit();

	// All other controls are for administrators only
	if (ChatRoomPlayerIsAdmin()) {

		// When we select a new background
		if ((MouseX >= 1500) && (MouseX < 1850) && (MouseY >= 450) && (MouseY < 515)) {
			ChatAdminBackgroundIndex += ((MouseX < 1675 && !CommonIsMobile) ? -1 : 1);
			if (ChatAdminBackgroundIndex >= ChatCreateBackgroundList.length) ChatAdminBackgroundIndex = 0;
			if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = ChatCreateBackgroundList.length - 1;
			ChatAdminBackgroundSelect = ChatCreateBackgroundList[ChatAdminBackgroundIndex];
			ChatAdminBackground = ChatAdminBackgroundSelect + "Dark";
		}

		// Private & Locked check boxes + save button
		if ((MouseX >= 1810) && (MouseX <= 1874) && (MouseY >= 590) && (MouseY <= 654)) ChatAdminPrivate = !ChatAdminPrivate;
		if ((MouseX >= 1810) && (MouseX <= 1874) && (MouseY >= 700) && (MouseY <= 64)) ChatAdminLocked = !ChatAdminLocked;
		if ((MouseX >= 200) && (MouseX < 500) && (MouseY >= 840) && (MouseY < 905) && ChatRoomPlayerIsAdmin()) ChatAdminUpdateRoom();

	}

}

// When the user exit from this screen
function ChatAdminExit() {
	ElementRemove("InputName");
	ElementRemove("InputDescription");
	ElementRemove("InputSize");
	ElementRemove("InputAdminList");
	ElementRemove("InputBanList");
	CommonSetScreen("Online", "ChatRoom");
}

// When the server sends a response, if it was updated properly we exit, if not we show the error
function ChatAdminResponse(data) {
	if ((data != null) && (typeof data === "string") && (data != ""))
		if (data === "Updated") ChatAdminExit();
		else ChatAdminMessage = "Response" + data;
}

// Sends the chat room update packet to the server and waits for the answer
function ChatAdminUpdateRoom() {
	var UpdatedRoom = {
		Name: ElementValue("InputName").trim(),
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminBackgroundSelect,
		Limit: ElementValue("InputSize").trim(),
		Admin: CommonConvertListToArray(ElementValue("InputAdminList").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		Private: ChatAdminPrivate,
		Locked: ChatAdminLocked
	};
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room : UpdatedRoom, Action: "Update" });
	ChatAdminMessage = "UpdatingRoom";
}