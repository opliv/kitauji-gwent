class Cache {
  constructor() {
    this.cache = {};
    this.conditions = {};
  }

  static instance_ = new Cache();

  getInstance() {
    return instance_;
  }

  async getCondition(username, conditionKey) {
    this.conditions[username] = this.conditions[username] || {};
    let condition = this.conditions[username][conditionKey];
    if (condition != null) {
      return condition;
    }
    condition = this.conditions[username][conditionKey] = await db.getCondition(username, conditionKey);
    return condition;
  }

  async setCondition(username, conditionKey, value) {
    this.conditions[username] = this.conditions[username] || {};
    this.conditions[username][conditionKey] = value;
    await db.setCondition(username, conditionKey, value);
  }
}

module.exports = Cache;
