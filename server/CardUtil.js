let Util = {};

Util.canReplace = function(card) {
  return !(this.isHero(card) || card._data.ability === "decoy" || card._data.ability === "scorch_card");
}
Util.isSpy = function(card, includeHero) {
  return card._data.ability === "spy" ||
    (includeHero && String(card._data.ability).includes("spy"));
}
Util.isHero = function(card) {
  return String(card._data.ability).includes("hero");
}
Util.isScorch = function(card, isScorchCard) {
  if (isScorchCard) return card._data.ability === "scorch_card";
  return card._data.ability !== "scorch_card" && String(card._data.ability).includes("scorch");
}
Util.isMedic = function(card, includeHero) {
  return card._data.ability === "medic" ||
    (includeHero && String(card._data.ability).includes("medic"));
}
Util.isMuster = function(card, opt_musterType) {
  return String(card._data.ability).includes("muster") &&
    (opt_musterType ? card._data.musterType === opt_musterType : true);
}
Util.isMoraleBoost = function(card, includeHero) {
  return card._data.ability === "morale_boost" ||
    (includeHero && String(card._data.ability).includes("morale_boost"));
}
Util.isHorn = function(card, isHornCard) {
  if (isHornCard) {
    return card._data.ability === "commanders_horn_card";
  }
  return card._data.ability !== "commanders_horn_card" &&
    (String(card._data.ability).includes("commanders_horn") ||
    card._data.ability === "francesca_leader2");
}
Util.isBond = function(card, opt_bondType) {
  return card._data.ability === "tight_bond" &&
    (opt_bondType ? card._data.bondType === opt_bondType : true);
}
Util.isMonaka = function(card) {
  return card._data.ability === "monaka";
}
Util.isAttack = function(card) {
  return String(card._data.ability).includes("attack");
}
Util.isTaibu = function(card) {
  return card._data.ability === "taibu";
}
Util.isGuard = function(card) {
  return card._data.ability === "guard";
}
Util.isLips = function(card) {
  return card._data.ability === "lips";
}
Util.isTunning = function(card) {
  return card._data.ability === "tunning";
}
Util.isKasa = function(card) {
  return card._data.ability === "kasa";
}
Util.isWeather = function(card) {
  return card._data.type === 5 ||
    card._data.ability === "foltest_leader2" ||
    card._data.ability === "foltest_leader1" ||
    card._data.ability === "francesca_leader1";
}
Util.isDecoy = function(card) {
  return card._data.ability === "decoy";
}
Util.isEmreisLeader4 = function(card) {
  return card._data.ability === "emreis_leader4";
}

module.exports = Util;
