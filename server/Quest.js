var Const = require("./Const");

function getNextScenario(scenario) {
  switch (scenario) {
    case Const.SCENARIO_KANSAI:
    case Const.SCENARIO_ZENKOKU:
      return Const.SCENARIO_ZENKOKU;
    case Const.SCENARIO_KYOTO:
      return Const.SCENARIO_KANSAI;
    default:
      return Const.SCENARIO_KANSAI;
  }
}

async function updateQuestProgress(userModel, scenario, gameResult) {
  let username = userModel.username;
  let result = {};

  let progress = await db.findProgressByUserQuest(username, scenario) || [];
  progress.push(gameResult);

  let gamesPerQuest = 5;
  if (progress.length < gamesPerQuest) {
    result.completed = false;
  } else {
    result.completed = true;
    // success condition: win all games in a quest
    let wins = progress.filter(g=>g.isWin).length;
    result.success = (wins === gamesPerQuest);
    result.report = generateQuestReport(userModel, progress, getUserPrice(wins, gamesPerQuest));
    // reset current task progress
    progress = [];
    // unlock next scenario
    if (result.success) {
      await db.updateProgress(username, getNextScenario(scenario), []);
    }
  }
  await db.updateProgress(username, scenario, progress);
  return result;
}

function getUserPrice(wins, gamesPerQuest) {
  if (wins === gamesPerQuest) {
    return Const.PRICE_REPRESENTATIVE;
  }
  if (wins >= gamesPerQuest - 1) {
    return Const.PRICE_GOLD;
  }
  if (wins >= gamesPerQuest - 3) {
    return Const.PRICE_SILVER;
  }
  return Const.PRICE_BRASS;
}

const QUOTA = {
  [Const.PRICE_REPRESENTATIVE]: 0.1,
  [Const.PRICE_GOLD]: 0.1,
  [Const.PRICE_SILVER]: 0.3,
  [Const.PRICE_BRASS]: 0.5,
}

function generateQuestReport(userModel, progress, userPrice) {
  let bandName = userModel.bandName;

  // sort schools by game results
  let allSchools = [];
  let gameResults = {};
  for (let game of progress) {
    let point = game.isWin ? -1 : 1;
    gameResults[game.foeName] = gameResults[game.foeName] ? gameResults[game.foeName] + point : point;
    allSchools.push(game.foeName);
  }
  allSchools.sort((a, b) => {
    if (gameResults[a] > gameResults[b]) {
      return -1;
    } else if (gameResults[a] < gameResults[b]) {
      return 1;
    }
    return 0;
  });

  // put schools into price slots
  let total = allSchools.length + 1;
  let prices = {};
  for (let price of [Const.PRICE_REPRESENTATIVE, Const.PRICE_GOLD, Const.PRICE_SILVER, Const.PRICE_BRASS]) {
    let quota = Math.min(allSchools.length, Math.max(total * QUOTA[price], 1));
    prices[price] = [];
    // user won this price, take 1 quota
    if (userPrice === price) {
      prices[price].push(bandName);
      quota--;
    }
    for (let i = 0; i < quota; i++) {
      prices[price].push(allSchools.shift());
    }
  }
  return prices;
}

module.exports = {
  updateQuestProgress,
  getNextScenario,
}
