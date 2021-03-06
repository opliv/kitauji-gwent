const MongoClient = require('mongodb').MongoClient;
const Util = require("./util");
const CardData = require("../../assets/data/cards");
const Const = require("../Const");

const MONGODB_PORT = 27017;
const DB_NAME = "mydb";

const TABLE_USER = "user";
const TABLE_CARD = "card";
const TABLE_DRAW_STATS = "draw_stats";
const TABLE_PROGRESS = "progress";
const TABLE_CONDITION = "condition";

class DB {
  constructor() {
    this.connectPromise = MongoClient.connect(`mongodb://localhost:${MONGODB_PORT}`).then((client) => {
      console.info("mongodb connected");
      this.client = client;
      this.db = client.db(DB_NAME);
  
      this.db.createCollection(TABLE_USER, function(err) {
        if (err) throw err;
        console.log("user table created!");
      });
      this.db.createCollection(TABLE_CARD, function(err) {
        if (err) throw err;
        console.log("card table created!");
      });
      this.db.createCollection(TABLE_DRAW_STATS, function(err) {
        if (err) throw err;
        console.log("draw stats table created!");
      });
      this.db.createCollection(TABLE_PROGRESS, function(err) {
        if (err) throw err;
        console.log("progress table created!");
      });
      this.db.createCollection(TABLE_CONDITION, function(err) {
        if (err) throw err;
        console.log("condition table created!");
      });
    });
  }
  
  // user
  
  async addUser(user) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_USER);
    await table.insertOne(Util.toUserDto(user));
  }
  
  async findUserByName(username) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_USER);
    return await table.findOne({
      username,
    });
  }

  async findUserByNames(usernames) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_USER);
    return await table.find({
      username: {
        $in: usernames,
      }
    }).toArray();
  }

  /**
   * update bandName, currentDeck
   */
  async updateUser(userModel) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_USER);
    return await table.updateOne({
      username: userModel.username
    }, {
      $set: {
        bandName: userModel.bandName,
        currentDeck: userModel.currentDeck,
      }
    });
  }

  async recordUserWin(username, isWin) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_USER);
    let update;
    if (isWin) {
      update = {winCount: 1};
    } else {
      update = {loseCount: 1}
    };
    return await table.updateOne({username}, {
      $inc: update,
    });
  }
  
  // card
  
  async findAllCardsByUser(username) {
    await this.connectPromise;
    return await this.db.collection(TABLE_CARD).find({
      username,
    }).toArray();
  };
  
  async findCardsByUser(username, deck) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    let result = await table.findOne({
      username,
      deck,
    });
    if (result) {
      return result.cards;
    }
    return null;
  };
  
  async findLeaderCardsByUser(username) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    let result = await table.findOne({
      username,
      isLeaderCard: true,
    });
    if (result) {
      return result.cards;
    }
    return null;
  }

  async addCards(username, deck, cardList) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
  
    let cardMap = await this.findCardsByUser(username, deck) || {};
    let neutralCardMap = await this.findCardsByUser(username, Const.NEUTRAL_DECK) || {};
    for (let key of cardList) {
      if (CardData[key].faction === Const.NEUTRAL_DECK) {
        if (neutralCardMap[key]) neutralCardMap[key]++;
        else neutralCardMap[key] = 1;
      } else {
        if (cardMap[key]) cardMap[key]++;
        else cardMap[key] = 1;
      }
    }
    if (Object.keys(cardMap).length) {
      await table.updateOne({username, deck}, {
        $set: {
          cards: cardMap,
        }
      }, {
        upsert: true,
      });
    }
    if (Object.keys(neutralCardMap).length) {
      await table.updateOne({
        username,
        deck: Const.NEUTRAL_DECK,
      }, {
        $set: {
          cards: cardMap,
        }
      }, {
        upsert: true,
      });
    }
  };

  async addLeaderCards(username, cardList) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    let cards = {};
    let exist = await this.findLeaderCardsByUser(username);
    if (exist) {
      cards = exist.cards;
    }
    for (let key of cardList) {
      if (!cards[key]) cards[key] = 1;
    }
    return await table.updateOne({
      username,
      isLeaderCard: true,
    }, {
      $set: {cards},
    }, {
      upsert: true,
    });
  }

  async loadAllCustomDeck(username) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    return await table.find({
      username,
      isCustomDeck: true,
    }).toArray();
  }

  async loadCustomDeck(username, deck) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    let result = await table.findOne({
      username,
      deck,
      isCustomDeck: true,
    });
    if (result) {
      return result.customDeck;
    }
    return {};
  }

  async storeCustomDeck(username, deck, customDeck) {
    await this.connectPromise;
    const table = this.db.collection(TABLE_CARD);
    return await table.updateOne({
      username,
      deck,
      isCustomDeck: true,
    }, {
      $set: {customDeck},
    }, {
      upsert: true,
    });
  }

  async storeCustomDeckByList(username, deck, cardList) {
    let leader = cardList.find(c=>CardData[c].type === 3);
    let cardInDeck = {};
    for (let key of cardList) {
      if (CardData[key].type !== 3) {
        cardInDeck[key] = cardInDeck[key] ? cardInDeck[key] + 1 : 1;
      }
    }
    return await this.storeCustomDeck(username, deck, {
      deck,
      cardInDeck,
      leader,
    });
  }

  // draw stats

  async loadDrawStats(username, scenario) {
    await this.connectPromise;
    let result = await this.db.collection(TABLE_DRAW_STATS).findOne({
      username,
      scenario,
    });
    if (result) {
      return result.stats;
    }
    return null;
  }

  async storeDrawStats(username, scenario, stats) {
    await this.connectPromise;
    return this.db.collection(TABLE_DRAW_STATS).updateOne({
      username,
      scenario,
    }, {
      $set: {stats},
    }, {
      upsert: true,
    });
  }

  // progress
  
  async findProgressByUser(username) {
    await this.connectPromise;
    return await this.db.collection(TABLE_PROGRESS).find({
      username,
    }).toArray();
  };
  
  async findProgressByUserQuest(username, questName) {
    await this.connectPromise;
    let result = await this.db.collection(TABLE_PROGRESS).findOne({
      username,
      questName,
    });
    if (result) {
      return result.progress;
    }
    return null;
  }
  
  async updateProgress(username, questName, progress) {
    await this.connectPromise;
    return await this.db.collection(TABLE_PROGRESS).updateOne({
      username,
      questName,
    }, {
      $set: {progress},
    }, {
      upsert: true,
    });
  };

  // condition

  async setCondition(username, conditionKey, value) {
    await this.connectPromise;
    return await this.db.collection(TABLE_CONDITION).updateOne({
      username,
    }, {
      $set: {
        [conditionKey]: value,
      },
    }, {
      upsert: true,
    });
  }

  async getCondition(username, conditionKey) {
    await this.connectPromise;
    let result = await this.db.collection(TABLE_CONDITION).findOne({
      username,
    }, {
      [conditionKey]: true
    });
    if (result) {
      return result[conditionKey];
    }
    return null;
  }
}

module.exports = DB;
