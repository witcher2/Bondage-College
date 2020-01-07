"use strict";
var SkillModifier = 0;
var SkillModifierMax = 5;
var SkillModifierMin = -10
var SkillLevelMaximum = 10;
var SkillLevelMinimum = 0;

// Pushes the skill progression to the server
function SkillSave(S) {
	ServerPlayerSkillSync();
}

// When the player progresses in a skill
function SkillChange(SkillType, SkillLevel, SkillProgress, Push) {

	// Make sure the progress and level are valid
	SkillProgress = parseInt(SkillProgress) || 0;
	SkillLevel = parseInt(SkillLevel) || 0;
	if ((SkillProgress < 0) || (SkillProgress >= 1000)) SkillProgress = 0;
	if ((SkillLevel < 0) || (SkillLevel > 10)) SkillLevel = 0;

	// If the skill already exists, we updated it
	for (var S = 0; S < Player.Skill.length; S++)
		if (Player.Skill[S].Type == SkillType) {
			Player.Skill[S].Level = SkillLevel;
			Player.Skill[S].Progress = SkillProgress;
			if ((Push == null) || Push) SkillSave(Player.Skill[S])
			return;
		}

	// Creates a new skill
	var NewSkill = {
		Type: SkillType,
		Level: SkillLevel,
		Progress: SkillProgress
	}
	Player.Skill.push(NewSkill);
	if ((Push == null) || Push) SkillSave(NewSkill);

}

// Loads the skill data
function SkillLoad(NewSkill) {

	// Make sure we have something to load
	if (NewSkill != null) {

		// Add each skill entry one by one
		for (var S = 0; S < NewSkill.length; S++)
			SkillChange(NewSkill[S].Type, NewSkill[S].Level, NewSkill[S].Progress, false);

	}

}

// Returns a specific skill level from a character
function SkillGetLevel(C, SkillType) {
	for (var S = 0; S < C.Skill.length; S++)
		if (C.Skill[S].Type == SkillType) {

			// Skills modifier only apply to bondage and evasion
			var Mod = 0;
			if ((SkillType == "Bondage") || (SkillType == "Evasion")) {
				if ((LogValue("ModifierDuration", "SkillModifier") > CurrentTime) && (LogValue("ModifierDuration", "SkillModifier") < CurrentTime + 3600000)) {
					SkillModifier = LogValue("ModifierLevel", "SkillModifier");
					if (SkillModifier == null) SkillModifier = 0;
					if (SkillModifier < SkillModifierMin) SkillModifier = SkillModifierMin;
					if (SkillModifier > SkillModifierMax) SkillModifier = SkillModifierMax;
					Mod = SkillModifier;
				} else {
					SkillModifier = 0;
					if (LogValue("ModifierLevel", "SkillModifier") != 0) LogAdd("ModifierLevel", "SkillModifier", 0);
				}
			}

			// Gets the skill level and applies the modifier if needed, make sure we don't go over maximum or under minimum
			var Level = (C.Skill[S].Level + Mod);
			if (Level > (SkillLevelMaximum + SkillModifierMax)) Level = (SkillLevelMaximum + SkillModifierMax);
			if (Level < (SkillLevelMinimum + SkillModifierMin)) Level = (SkillLevelMinimum + SkillModifierMin);
			return Level;

		}
	return 0;
}

// Returns a specific skill level from a character
function SkillGetLevelReal(C, SkillType) {
	for (var S = 0; S < C.Skill.length; S++)
		if (C.Skill[S].Type == SkillType)
			return C.Skill[S].Level;
	return 0;
}

// Returns a specific skill progress from a character
function SkillGetProgress(C, SkillType) {
	for (var S = 0; S < C.Skill.length; S++)
		if (C.Skill[S].Type == SkillType)
			return C.Skill[S].Progress;
	return 0;
}

// The skill progresses more slowly as player levels gets higher
function SkillProgress(SkillType, SkillProgress) {

	// Makes sure there's a progress, we cannot go beyond level 10
	var L = SkillGetLevelReal(Player, SkillType);
	var P = Math.round(SkillProgress * 3 / ((L * L) + 1));
	P = P * CheatFactor("DoubleSkill", 2);
	if ((P > 0) && (L < 10)) {

		// Raises the actual progress and gains a level if 1000 or more
		P = P + SkillGetProgress(Player, SkillType);
		if (P >= 1000) {
			L++;
			P = 0;
		}

		// Updates the skill object and push to the server
		SkillChange(SkillType, L, P);

	}

}

// Alters the current skill modifier for the player
function SkillModifierChange(Change) {
	SkillModifier = SkillModifier + Change;
	if (SkillModifier < -10) SkillModifier = -10;
	if (SkillModifier > 10) SkillModifier = 10;
}

// Remove any skill modifier
function SkillModifierReset() {
	SkillModifier = 0;
}