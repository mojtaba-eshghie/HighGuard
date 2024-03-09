require('module-alias/register');
const Convention = require('@lib/monitor/convention');


class SpecificConvention extends Convention {
  constructor(config) {
    super(config);
    // Additional setup for this specific convention
  }

  async execute() {
    try {
      // Custom logic for this specific convention
      const results = await this.performSpecificTasks();
      this.handleResults(results);
    } catch (error) {
      this.handleError(error);
    }
  }

  async performSpecificTasks() {
    // Specific tasks for this convention
    return 'specific results';
  }
}

module.exports = SpecificConvention;
